import React, { useState, useCallback } from 'react'; // 1. เพิ่ม useCallback
import { 
  StyleSheet, Text, View, FlatList, 
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useFocusEffect } from '@react-navigation/native'; // 2. เพิ่ม useFocusEffect
import { API_BASE_URL } from './apiConfig'; 

// --- Component สำหรับแสดงรายการ (Item) ---
const OfferItem = ({ item }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'open': return { color: '#FFB800', text: 'รอการตอบรับ' };
      case 'negotiating': return { color: '#0D6EfD', text: 'กำลังต่อรอง' };
      case 'accepted': return { color: '#1E9E4F', text: 'ดีลสำเร็จ' };
      case 'rejected': return { color: '#D9534F', text: 'ปฏิเสธ' };
      case 'cancelled': return { color: '#666', text: 'ยกเลิก' };
      default: return { color: '#888', text: 'ไม่ทราบสถานะ' };
    }
  };
  const statusInfo = getStatusStyle(item.status || item.priceStatus); 
  
  const offeredPrice = item.offeredPrice || item.requestedPrice || 0;
  
  let dateString = '...';
  if (item.updatedAt && item.updatedAt._seconds) {
     dateString = new Date(item.updatedAt._seconds * 1000).toLocaleDateString("th-TH");
  } else if (item.updatedAt) {
     dateString = new Date(item.updatedAt).toLocaleDateString("th-TH");
  }

  const handleViewDeal = () => {
    Alert.alert('รายละเอียด', 
      `Order: ${item.orderId}\n` +
      `ราคาเสนอ: ${offeredPrice} บาท/กก.\n` +
      `สถานะ: ${statusInfo.text}`
    );
  };

  return (
    <TouchableOpacity style={styles.offerCard} onPress={handleViewDeal}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>Order #{item.orderId ? item.orderId.slice(-6) : '???'}</Text>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detailText}>เกรด: <Text style={styles.boldText}>{item.grade}</Text></Text>
        <Text style={styles.detailText}>จำนวน: <Text style={styles.boldText}>{item.amountKg} กก.</Text></Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>ราคาเสนอ</Text>
          <Text style={styles.priceText}>{Number(offeredPrice).toFixed(2)}</Text>
          <Text style={styles.priceUnit}>บาท/กก.</Text>
        </View>
        <View style={styles.weightContainer}>
          <Text style={styles.priceLabel}>อัปเดตล่าสุด</Text>
          <Text style={styles.weightText}>{dateString}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}; 

export default function OffersScreen({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 3. เก็บ Role ใน State
  
  const fetchOffers = async () => {
    // ถ้าไม่มีข้อมูลเลย ให้หมุนติ้วๆ (แต่ถ้ามีแล้ว จะเป็นการรีเฟรชเงียบๆ)
    if (offers.length === 0) setLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      const role = await AsyncStorage.getItem('userRole');
      
      // เก็บ Role ใส่ State เพื่อเอาไปใช้เช็คเงื่อนไขแสดงผล
      setUserRole(role); 

      if (!userId || !role) {
        setLoading(false);
        return;
      }
      
      let endpoint = '';
      if (role === 'farmer') {
        endpoint = `${API_BASE_URL}/orderApi/negotiations?farmerId=${userId}`;
      } else {
        endpoint = `${API_BASE_URL}/orderApi/negotiations?buyerId=${userId}`; // ค้นหาด้วย buyerId (ต้องตรงกับ Backend)
      }

      const response = await fetch(endpoint);
      const result = await response.json();
      
      if (response.ok) {
        setOffers(result.items || []);
      } else {
        console.error("Fetch Offers Error:", result);
        setOffers([]); 
      }
    } catch (e) {
      console.error("Network Error:", e);
    } finally {
      setLoading(false);
    }
  };

  // 4. ใช้ useFocusEffect เพื่อให้โหลดใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      fetchOffers();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {loading && offers.length === 0 ? (
        <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#1E9E4F" />
            <Text style={styles.emptyText}>กำลังโหลดรายการ...</Text>
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyText}>ยังไม่มีรายการเจรจา</Text>
            <Text style={styles.emptySubText}>
              {/* 5. ใช้ userRole จาก State แทน AsyncStorage */}
              {userRole === 'farmer' 
                ? 'รอผู้ซื้อยื่นข้อเสนอเข้ามา'
                : 'ไปที่ "ตลาดลำไย" เพื่อเลือกสินค้าและกดเจรจา'
              }
            </Text>
            <TouchableOpacity onPress={fetchOffers} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>โหลดใหม่</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={({ item }) => <OfferItem item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          // 6. เพิ่มระบบลากลงเพื่อรีเฟรช (Pull to Refresh)
          refreshing={loading}
          onRefresh={fetchOffers}
        />
      )}
      
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  listContainer: { padding: 10, paddingBottom: 20 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#888', marginTop: 10, textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#AAA', textAlign: 'center', marginTop: 5 },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#1E9E4F', 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  cardBody: { marginBottom: 10 },
  detailText: { fontSize: 14, color: '#555', lineHeight: 24 },
  boldText: { fontWeight: '600', color: '#333' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceContainer: { flex: 1, alignItems: 'flex-start' },
  weightContainer: { flex: 1, alignItems: 'flex-end' },
  priceLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  priceText: { fontSize: 20, fontWeight: 'bold', color: '#1E9E4F' },
  weightText: { fontSize: 14, color: '#555', marginTop: 5 },
  priceUnit: { fontSize: 12, color: '#888' },
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