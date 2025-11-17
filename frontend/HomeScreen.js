import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_BASE_URL } from './apiConfig'; 

// --- Component สำหรับแสดงรายการ (แสดงสถานะสมบูรณ์) ---
const ListingItem = ({ item }) => {
    const getStatusStyle = (status) => {
        switch (status) {
          case 'open': return { color: '#1E9E4F', text: 'กำลังขาย (เปิดรับข้อเสนอ)' }; 
          case 'matched': return { color: '#0D6EfD', text: 'ดีลสำเร็จ / กำลังดำเนินการ' }; 
          case 'closed': return { color: '#D32F2F', text: 'ขายเสร็จสิ้น' }; 
          default: return { color: '#888', text: 'สถานะไม่ทราบ' };
        }
      };
      const orderStatus = item.status || 'open'; 
    
      return (
        <TouchableOpacity style={styles.listingCard}>
          <View style={styles.listingHeaderContent}>
            <Text style={styles.listingProduct}>ลำไยเกรด ({item.grade})</Text>
            <Text style={[styles.listingStatus, { color: getStatusStyle(orderStatus).color }]}>
              {getStatusStyle(orderStatus).text}
            </Text>
          </View>
          <View style={styles.listingBody}>
            <Text style={styles.listingDetail}>
              <Text style={styles.boldText}>{item.amountKg.toLocaleString()}</Text> กก. @ {item.requestedPrice.toFixed(2)} บ./กก.
            </Text>
          </View>
        </TouchableOpacity>
      );
};


export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("ผู้ใช้งาน"); 
  const [totalListings, setTotalListings] = useState(0); 
  const [totalOffers, setTotalOffers] = useState(0); 
  const [latestListings, setLatestListings] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return; 
    }

    try {
      // 1. ดึงข้อมูล User (เพื่อเอาชื่อ)
      const userRes = await fetch(`${API_BASE_URL}/usersApi/${userId}`);
      const userData = await userRes.json();
      if (userRes.ok) {
        setUserName(userData.name);
      }
      
      // 2. ดึงรายการขายทั้งหมดของผู้ใช้
      // 📍 [สำคัญ]: ลบ filter status ออก เพื่อดึงรายการทั้งหมด (Open, Matched, Closed)
      const listingsRes = await fetch(`${API_BASE_URL}/orderApi/orders/my?ownerId=${userId}&type=sell&limit=5`);
      
      if (!listingsRes.ok) {
        throw new Error(`Failed to fetch listings: ${listingsRes.status}`);
      }
      
      const listingsData = await listingsRes.json();
      
      if (listingsData && listingsData.items) {
        // 📍 Total Listings นับจากรายการที่ดึงมา (ไม่ควรใช้ length ของ array นี้ถ้า limit ถูกกำหนดไว้ต่ำ)
        setLatestListings(listingsData.items);
        setTotalListings(listingsData.items.length); 
      } else {
        setLatestListings([]);
        setTotalListings(0);
      }
      
      // 3. ดึงจำนวนข้อเสนอ (Negotiations)
      const offersRes = await fetch(`${API_BASE_URL}/orderApi/negotiations?farmerId=${userId}`);
      const offersData = await offersRes.json();
      if (offersRes.ok) {
         // นับเฉพาะข้อเสนอที่ยังอยู่ในสถานะ 'open'
         const pendingOffers = (offersData.items || []).filter(item => item.status === 'open');
         setTotalOffers(pendingOffers.length);
      }

    } catch (e) {
      console.error("Home Data Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  }, []); 

  // 📍 ใช้ useFocusEffect เพื่อเรียก fetchData ทุกครั้งที่หน้าจอนี้ถูก Focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
      return () => {};
    }, [fetchData]) 
  );


  const goToCreateListing = () => {
    navigation.navigate('CreateListing'); 
  };
  const goToOffers = () => {
    navigation.navigate('OffersTab'); 
  };
  const goToProfile = () => {
    navigation.navigate('ProfileTab'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>สวัสดี คุณ{userName}</Text>
            <Text style={styles.headerTitle}>จัดการประกาศขายของคุณ</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={goToProfile} 
          >
            <Ionicons name="person-circle-outline" size={32} color="#1E9E4F" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, {borderLeftColor: '#0D6EfD'}]}>
            <Ionicons name="list" size={32} color="#0D6EfD" />
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {loading ? <ActivityIndicator size="small" color="#0D6EfD" /> : totalListings}
              </Text>
              <Text style={styles.statLabel}>รายการทั้งหมด</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.statCard, {borderLeftColor: '#1E9E4F'}]}
            onPress={goToOffers} 
          >
            <Ionicons name="chatbubbles" size={32} color="#1E9E4F" />
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {loading ? <ActivityIndicator size="small" color="#1E9E4F" /> : totalOffers}
              </Text>
              <Text style={styles.statLabel}>ข้อเสนอรอตอบรับ</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.postButton}
          onPress={goToCreateListing} 
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.postButtonText}>สร้างประกาศขายผลผลิต</Text>
        </TouchableOpacity>
        
        <View style={styles.listingHeader}>
            <Text style={styles.listingTitle}>รายการขายล่าสุด</Text>
            <TouchableOpacity onPress={goToOffers}><Text style={styles.viewAll}>ดูข้อเสนอทั้งหมด</Text></TouchableOpacity>
        </View>
        
        {/* --- 📍 ใช้ List จริงแทน Placeholder --- */}
        <View style={styles.listingContainer}>
          {loading && latestListings.length === 0 ? (
            <ActivityIndicator size="large" color="#1E9E4F" style={{padding: 40}} />
          ) : latestListings.length === 0 ? (
            <View style={styles.emptyListing}>
                <Ionicons name="leaf-outline" size={40} color="#CCCCCC" />
                <Text style={styles.emptyText}>ยังไม่มีประกาศขาย</Text>
                <Text style={styles.emptySubText}>กดปุ่ม "สร้างประกาศขายผลผลิต" เพื่อเริ่มต้น</Text>
            </View>
          ) : (
            latestListings.map(item => <ListingItem key={item.id} item={item} />)
          )}
        </View>
        {/* -------------------------------------- */}

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles (ส่วนที่เหลือ) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerGreeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerTitle: { fontSize: 16, color: '#888' },
  profileButton: { padding: 5 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
  },
  statContent: { marginLeft: 10 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 14, color: '#555' },
  postButton: {
    backgroundColor: '#1E9E4F',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#1E9E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  listingTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  viewAll: { fontSize: 14, color: '#1E9E4F', fontWeight: 'bold' },
  listingContainer: { paddingHorizontal: 20 },
  emptyListing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
  },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#888', marginTop: 10 },
  emptySubText: { fontSize: 14, color: '#AAA', marginTop: 5 },
  // --- Styles for Listings in HomeScreen ---
  listingCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      padding: 15,
      marginVertical: 5,
      borderLeftWidth: 4,
      borderLeftColor: '#1E9E4F', 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  listingHeaderContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
  },
  listingProduct: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  listingStatus: { fontSize: 14, fontWeight: '600' },
  listingBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
  },
  listingDetail: { fontSize: 14, color: '#555' },
  listingPrice: { fontSize: 16, fontWeight: 'bold', color: '#0D6EfD' },
  boldText: { fontWeight: 'bold' },
});