import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, 
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_BASE_URL } from './apiConfig'; 

// --- [1. Mock Data ถูกลบออก] ---

// --- [2. Component สำหรับแสดงรายการ (Item)] ---
const OfferItem = ({ item }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'open': return { color: '#FFB800', text: 'รอการตอบรับ' };
      case 'accepted': return { color: '#1E9E4F', text: 'ดีลสำเร็จ' };
      case 'rejected': return { color: '#D9534F', text: 'ยกเลิก/ปฏิเสธ' };
      case 'cancelled': return { color: '#666', text: 'ถูกยกเลิก' };
      case 'counter': return { color: '#0D6EfD', text: 'มีการต่อรองกลับ' };
      default: return { color: '#888', text: 'ไม่ทราบสถานะ' };
    }
  };
  const statusInfo = getStatusStyle(item.status);
  
  // 📍 ใช้ OfferedPrice เป็นราคาที่แสดง
  const offeredPrice = item.offeredPrice || item.requestedPrice;
  const dateString = new Date(item.updatedAt._seconds * 1000).toLocaleDateString("th-TH");
  
  const handleViewDeal = () => {
    Alert.alert('รายละเอียดข้อเสนอ', 
      `Order: ${item.orderId}\n` +
      `เกรด: ${item.grade}\n` +
      `ราคาเสนอ: ${offeredPrice} บาท/กก.\n` +
      `สถานะ: ${statusInfo.text}`
    );
  };

  return (
    <TouchableOpacity style={styles.offerCard} onPress={handleViewDeal}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>รายการ Order: {item.orderId}</Text>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detailText}>เกรด: <Text style={styles.boldText}>{item.grade}</Text></Text>
        <Text style={styles.detailText}>จาก Farmer: <Text style={styles.boldText}>{item.farmerId}</Text></Text>
        <Text style={styles.detailText}>เสนอโดย Factory: <Text style={styles.boldText}>{item.factoryId}</Text></Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>ราคาเสนอ (ล่าสุด)</Text>
          <Text style={styles.priceText}>{offeredPrice.toFixed(2)}</Text>
          <Text style={styles.priceUnit}>บาท/กก.</Text>
        </View>
        <View style={styles.weightContainer}>
          <Text style={styles.priceLabel}>วันที่อัปเดต</Text>
          <Text style={styles.weightText}>{dateString}</Text>
          <Text style={styles.priceUnit}> </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}; 

export default function OffersScreen({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 📍 โฟกัสที่ negotiations เพียงอย่างเดียวตามวัตถุประสงค์ใหม่
  // const [activeTab, setActiveTab] = useState('negotiations'); 

  // 📍 ฟังก์ชันดึงรายการ Negotiation (ข้อเสนอ/คำขอ)
  const fetchOffers = async () => {
    setLoading(true);
    const userId = await AsyncStorage.getItem('userId');
    const userRole = await AsyncStorage.getItem('userRole');

    if (!userId || !userRole) {
      setLoading(false);
      setOffers([]);
      return;
    }
    
    let endpoint = '';
    // 📍 กำหนด endpoint ตาม Role (Farmer จะดึงตาม farmerId, Buyer/Factory ดึงตาม buyerId/factoryId)
    if (userRole === 'farmer') {
      endpoint = `${API_BASE_URL}/orderApi/negotiations?farmerId=${userId}`;
    } else {
      endpoint = `${API_BASE_URL}/orderApi/negotiations?buyerId=${userId}`;
    }

    try {
      const response = await fetch(endpoint);
      const result = await response.json();
      
      if (response.ok) {
        setOffers(result.items || []);
      } else {
        console.error("Fetch Offers Error:", result);
        setOffers([]);
      }
    } catch (e) {
      console.error("Network Error fetching offers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 📍 Tab Navigation ถูกลบออกเพื่อให้หน้า Offer เป็นศูนย์กลางการซื้อขาย/เจรจา */}

      {loading && offers.length === 0 ? (
        <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#1E9E4F" />
            <Text style={styles.emptyText}>กำลังโหลดข้อเสนอและรายการซื้อขาย...</Text>
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyText}>ยังไม่มีรายการเจรจา</Text>
            <Text style={styles.emptySubText}>
              {/* 📍 ปรับข้อความตาม Role ที่ถูกดึงมาจาก AsyncStorage */}
              {AsyncStorage.getItem('userRole') === 'farmer' 
                ? 'เมื่อมีผู้ซื้อยื่นข้อเสนอ ระบบจะสร้างรายการเจรจาใหม่ที่นี่'
                : 'เมื่อมีผู้ขายตอบรับ/ต่อรองข้อเสนอของคุณ ระบบจะสร้างรายการเจรจาใหม่ที่นี่'
              }
            </Text>
            <TouchableOpacity onPress={fetchOffers} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>รีเฟรช</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={({ item }) => <OfferItem item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
    </SafeAreaView>
  );
}

// --- Styles (ฉบับเต็ม) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  emptyListContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#888', marginTop: 10, textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#AAA', textAlign: 'center', marginTop: 5 },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#1E9E4F', 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  cardBody: { marginBottom: 10 },
  detailText: { fontSize: 14, color: '#555', lineHeight: 22 },
  boldText: { fontWeight: 'bold', color: '#333' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 5,
  },
  priceContainer: { flex: 1, alignItems: 'flex-start' },
  weightContainer: { flex: 1, alignItems: 'flex-end' },
  priceLabel: { fontSize: 12, color: '#888' },
  priceText: { fontSize: 22, fontWeight: 'bold', color: '#1E9E4F', marginTop: 2 },
  weightText: { fontSize: 18, fontWeight: 'bold', color: '#0D6EfD', marginTop: 2 },
  priceUnit: { fontSize: 14, color: '#555' },
  dateText: { fontSize: 12, color: '#AAAAAA', textAlign: 'right', marginTop: 5 },
  retryButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  retryButtonText: {
    color: '#1E9E4F',
    fontWeight: 'bold',
  },
});