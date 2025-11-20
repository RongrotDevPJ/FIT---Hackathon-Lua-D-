import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  ScrollView, FlatList, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_BASE_URL } from './apiConfig'; 

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("ผู้ใช้งาน"); 
  const [totalListings, setTotalListings] = useState(0); 
  const [totalOffers, setTotalOffers] = useState(0); 
  const [latestListings, setLatestListings] = useState([]); 
  const [topBuyListings, setTopBuyListings] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // state สำหรับ Pull to Refresh

  // ฟังก์ชันโหลดข้อมูล
  const fetchData = useCallback(async () => {
    // ถ้ากำลัง Refresh อยู่ ไม่ต้อง set loading ใหญ่
    if (!refreshing) setLoading(true);
    
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setLoading(false); return; }

      // 1. ข้อมูล User
      const userRes = await fetch(`${API_BASE_URL}/usersApi/${userId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserName(userData.name || "ผู้ใช้งาน");
      }
      
      // 2. รายการขายของเรา (My Sell Orders)
      // ✅ แก้ไข: เพิ่ม limit จาก 5 เป็น 50 เพื่อให้เห็นรายการใหม่
      const listingsRes = await fetch(`${API_BASE_URL}/orderApi/orders/my?ownerId=${userId}&type=sell&limit=50`);
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        let items = data?.items || [];
        
        // เรียงลำดับให้ตัวใหม่สุดขึ้นก่อน (ใช้ createdAt ถ้ามี)
        items.sort((a, b) => {
            const dateA = a.createdAt && a.createdAt._seconds ? a.createdAt._seconds : 0;
            const dateB = b.createdAt && b.createdAt._seconds ? b.createdAt._seconds : 0;
            return dateB - dateA; 
        });

        setLatestListings(items);
        setTotalListings(items.length);
      }
      
      // 3. ข้อเสนอ (Negotiations)
      const offersRes = await fetch(`${API_BASE_URL}/orderApi/negotiations?farmerId=${userId}`);
      if (offersRes.ok) {
        const data = await offersRes.json();
        const items = data?.items || [];
        const pending = items.filter(i => i.status === 'open');
        setTotalOffers(pending.length);
      }

      // 4. ประกาศรับซื้อจากตลาด (Market Buy Orders)
      const marketRes = await fetch(`${API_BASE_URL}/orderApi/orders?status=open`);
      if (marketRes.ok) {
        const data = await marketRes.json();
        const items = data?.items || [];
        // กรองเอาเฉพาะ type=buy
        const buys = items.filter(i => i.type === 'buy');
        
        // เรียงใหม่สุดขึ้นก่อน
        buys.sort((a, b) => {
             const dateA = a.createdAt && a.createdAt._seconds ? a.createdAt._seconds : 0;
             const dateB = b.createdAt && b.createdAt._seconds ? b.createdAt._seconds : 0;
             return dateB - dateA;
        });

        setTopBuyListings(buys.slice(0, 5)); // โชว์รับซื้อ 5 อันดับแรก
      }

    } catch (e) {
      console.error("Home Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]); 

  // ทำงานเมื่อหน้าจอถูกโฟกัส (กลับมาหน้านี้)
  useFocusEffect(
    useCallback(() => { fetchData(); }, []) 
  );

  // ฟังก์ชันสำหรับ Pull to Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Navigation Helpers
  const goToCreateListing = () => navigation.navigate('CreateListing'); 
  const goToOffers = () => navigation.navigate('OffersTab'); 
  const goToProfile = () => navigation.navigate('ProfileTab'); 
  const goToMarket = () => navigation.navigate('MarketTab');

  // --- Component: การ์ดประกาศรับซื้อ (Buy Offer) ---
  const renderBuyOfferItem = ({ item }) => (
    <TouchableOpacity 
        style={styles.buyCard}
        onPress={() => navigation.navigate('ListingDetail', { item, source: 'buy_offer' })}
    >
        <View style={styles.buyCardHeader}>
            <View style={styles.buyBadge}>
                <Text style={styles.buyBadgeText}>รับซื้อ</Text>
            </View>
            <Text style={styles.dateText}>
               {item.createdAt && item.createdAt._seconds 
                 ? new Date(item.createdAt._seconds * 1000).toLocaleDateString('th-TH') 
                 : 'เพิ่งลง'}
            </Text>
        </View>
        
        <Text style={styles.buyTitle}>ต้องการลำไยเกรด {item.grade}</Text>
        <View style={styles.buyInfoRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.buyInfoText}>{item.province || 'ไม่ระบุ'}</Text>
        </View>

        <View style={styles.buyFooter}>
            <Text style={styles.buyAmount}>จำนวน: {Number(item.amountKg).toLocaleString()} กก.</Text>
            <Text style={styles.buyPrice}>{Number(item.requestedPrice).toFixed(2)} ฿/กก.</Text>
        </View>
    </TouchableOpacity>
  );

  // --- Component: การ์ดสินค้าของฉัน (My Listing) ---
  const renderMyListingItem = ({ item }) => (
    <TouchableOpacity style={styles.myCard} onPress={() => navigation.navigate('ListingDetail', { item })}>
        <View style={styles.myCardIcon}>
            <Ionicons name="leaf" size={24} color="#fff" />
        </View>
        <View style={styles.myCardContent}>
            <Text style={styles.myCardTitle}>ลำไยเกรด {item.grade}</Text>
            <Text style={styles.myCardSubtitle}>
                {Number(item.amountKg).toLocaleString()} กก. • {item.province}
            </Text>
        </View>
        <View style={styles.myCardStatus}>
             <Text style={[styles.statusLabel, { color: item.status==='open' ? '#1E9E4F' : '#888' }]}>
                {item.status === 'open' ? 'เปิดขาย' : item.status}
             </Text>
             <Text style={styles.priceLabel}>{item.requestedPrice} ฿</Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E9E4F']} />
        }
      >
        
        {/* --- Header --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>สวัสดี, คุณ{userName}</Text>
            <Text style={styles.headerSubtitle}>วันนี้คุณต้องการทำอะไร?</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={goToProfile}>
            <Ionicons name="person" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* --- Stats Dashboard --- */}
        <View style={styles.statsContainer}>
            <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalListings}</Text>
                <Text style={styles.statLabel}>รายการขาย</Text>
            </View>
            <TouchableOpacity style={[styles.statBox, styles.statBoxActive]} onPress={goToOffers}>
                <Text style={[styles.statNumber, {color: '#FFF'}]}>{totalOffers}</Text>
                <Text style={[styles.statLabel, {color: '#E8F5E9'}]}>ข้อเสนอรอคุณ</Text>
            </TouchableOpacity>
        </View>

        {/* --- Main Action Button --- */}
        <TouchableOpacity style={styles.createButton} onPress={goToCreateListing}>
            <View style={styles.createButtonIcon}>
                <Ionicons name="add" size={30} color="#1E9E4F" />
            </View>
            <View>
                <Text style={styles.createButtonText}>สร้างประกาศขาย</Text>
                <Text style={styles.createButtonSub}>ลงประกาศขายผลผลิตของคุณ</Text>
            </View>
        </TouchableOpacity>

        {/* --- Section 1: ประกาศรับซื้อ (Factory Demand) --- */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ความต้องการรับซื้อล่าสุด</Text>
            <TouchableOpacity onPress={goToMarket}>
                <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
            </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {loading && !refreshing ? <ActivityIndicator color="#1E9E4F" /> : 
             topBuyListings.length === 0 ? (
                <Text style={styles.emptyText}>ยังไม่มีประกาศรับซื้อ</Text>
             ) : (
                topBuyListings.map((item, index) => (
                    <View key={index} style={{marginRight: 15, width: 280}}>
                        {renderBuyOfferItem({ item })}
                    </View>
                ))
            )}
        </ScrollView>

        {/* --- Section 2: รายการขายของฉัน (My Listings) --- */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>รายการขายของคุณ ({latestListings.length})</Text>
            {/* <TouchableOpacity onPress={() => navigation.navigate('MyListings')}>
                <Text style={styles.seeAllText}>จัดการ</Text>
            </TouchableOpacity> */}
        </View>

        <View style={styles.verticalList}>
            {loading && !refreshing ? <ActivityIndicator color="#1E9E4F" /> : 
             latestListings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="basket-outline" size={40} color="#CCC" />
                    <Text style={styles.emptyText}>คุณยังไม่มีรายการขาย</Text>
                </View>
             ) : (
                latestListings.map((item, index) => (
                    <View key={index} style={{marginBottom: 10}}>
                        {renderMyListingItem({ item })}
                    </View>
                ))
            )}
        </View>
        
        {/* Spacer for scrolling */}
        <View style={{height: 40}} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerGreeting: { fontSize: 22, fontWeight: 'bold', color: '#2D3436' },
  headerSubtitle: { fontSize: 14, color: '#636E72' },
  profileIcon: { backgroundColor: '#1E9E4F', padding: 10, borderRadius: 20 },

  // Stats
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 12, alignItems: 'center', marginRight: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statBoxActive: { backgroundColor: '#1E9E4F', marginRight: 0 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#2D3436', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#636E72' },

  // Create Button
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2D3436', padding: 15, borderRadius: 16, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  createButtonIcon: { backgroundColor: '#FFF', padding: 8, borderRadius: 12, marginRight: 15 },
  createButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  createButtonSub: { fontSize: 12, color: '#B2BEC3' },

  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436' },
  seeAllText: { fontSize: 14, color: '#1E9E4F', fontWeight: '600' },
  emptyText: { color: '#B2BEC3', textAlign: 'center', marginTop: 10 },
  emptyContainer: { alignItems: 'center', padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#DDD', borderRadius: 10 },
  
  horizontalList: { marginBottom: 20, minHeight: 130 },

  // Card: Buy Offer
  buyCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 5, borderLeftWidth: 4, borderLeftColor: '#0984E3', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  buyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  buyBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  buyBadgeText: { color: '#0984E3', fontSize: 10, fontWeight: 'bold' },
  dateText: { color: '#B2BEC3', fontSize: 12 },
  buyTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3436', marginBottom: 5 },
  buyInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  buyInfoText: { fontSize: 12, color: '#636E72', marginLeft: 5 },
  buyFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F2F6', paddingTop: 10 },
  buyAmount: { fontSize: 14, color: '#2D3436' },
  buyPrice: { fontSize: 16, fontWeight: 'bold', color: '#0984E3' },

  // Card: My Listing
  myCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  myCardIcon: { backgroundColor: '#1E9E4F', padding: 10, borderRadius: 10, marginRight: 15 },
  myCardContent: { flex: 1 },
  myCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3436' },
  myCardSubtitle: { fontSize: 13, color: '#636E72' },
  myCardStatus: { alignItems: 'flex-end' },
  statusLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  priceLabel: { fontSize: 14, color: '#2D3436', fontWeight: '600' },
});