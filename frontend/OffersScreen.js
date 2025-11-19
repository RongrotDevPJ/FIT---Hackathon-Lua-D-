import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, 
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from './apiConfig'; 

// [📍 ลบ Component NegotiationActions ออก - ย้ายไปทำงานที่ NegotiationDetailScreen แทน]
// โค้ดส่วนนี้ถูกลบออกไป:
/*
const NegotiationActions = ({ item, onAction, userRole }) => { ... };
*/


// --- Component สำหรับแสดงรายการ (Item) ---
// [📍 แก้ไข: เปลี่ยน props เป็น { item, navigation } เพื่อใช้ในการนำทาง]
const OfferItem = ({ item, navigation }) => {
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
    // [📍 แก้ไข: เปลี่ยนจาก Alert เป็นการ Navigate ไปหน้า Detail]
    navigation.navigate('NegotiationDetail', { negotiationId: item.id });
  };

  // [📍 นำ onPress กลับมาใช้บน TouchableOpacity หลัก]
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
      
      {/* [📍 ลบ Component การดำเนินการออก] */}

    </TouchableOpacity>
  );
}; 

export default function OffersScreen({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  // [📍 เพิ่ม State สำหรับ Filter]
  const [filter, setFilter] = useState('active'); // ค่าเริ่มต้น: กำลังดีล
  
  const fetchOffers = async () => {
    if (offers.length === 0) setLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      const role = await AsyncStorage.getItem('userRole');
      
      setUserRole(role); 

      if (!userId || !role) {
        setLoading(false);
        return;
      }
      
      let endpoint = '';
      if (role === 'farmer') {
        endpoint = `${API_BASE_URL}/orderApi/negotiations?farmerId=${userId}`;
      } else {
        endpoint = `${API_BASE_URL}/orderApi/negotiations?buyerId=${userId}`;
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

  // [📍 ลบฟังก์ชัน handleUpdateNegotiation ออก - ย้ายไปทำงานที่ NegotiationDetailScreen แทน]
  /*
  const handleUpdateNegotiation = async (negotiationId, action, newPrice = null) => { ... };
  */
  
  // 4. ใช้ useFocusEffect เพื่อให้โหลดใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      fetchOffers();
    }, [])
  );
  
  // [📍 ฟังก์ชันกรองข้อมูลตามสถานะ]
  const getFilteredOffers = (allOffers = offers) => {
    if (allOffers.length === 0) return [];
    
    // สถานะที่ใช้ในการตัดสินใจ (ใช้ status หรือ priceStatus ก็ได้)
    const getStatus = (item) => item.status || item.priceStatus || 'unknown';

    switch (filter) {
      case 'active':
        // กำลังดีล/รอการตอบรับ
        return allOffers.filter(item => ['open', 'negotiating'].includes(getStatus(item)));
      case 'accepted':
        // ดีลสำเร็จแล้ว
        return allOffers.filter(item => getStatus(item) === 'accepted');
      case 'failed':
        // ดีลถูกปฏิเสธ/ยกเลิก
        return allOffers.filter(item => ['rejected', 'cancelled'].includes(getStatus(item)));
      default:
        return allOffers;
    }
  };

  const filteredOffers = getFilteredOffers();

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
        
        {/* [📍 เพิ่มแถบ Filter] */}
        <View style={styles.filterContainer}>
            {
                [{ key: 'active', label: 'กำลังดีล' }, 
                 { key: 'accepted', label: 'ดีลสำเร็จ' }, 
                 { key: 'failed', label: 'ถูกปฏิเสธ/ยกเลิก' }]
                .map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.filterButton,
                            filter === tab.key && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter(tab.key)}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            filter === tab.key && styles.filterButtonTextActive
                        ]}>
                            {tab.label} ({getFilteredOffers(offers).filter(item => {
                                // นับจำนวนรายการตามหมวดหมู่ที่ถูกเลือก (ใช้ offers ทั้งหมดเพื่อนับ)
                                const status = item.status || item.priceStatus;
                                if (tab.key === 'active') return ['open', 'negotiating'].includes(status);
                                if (tab.key === 'accepted') return status === 'accepted';
                                if (tab.key === 'failed') return ['rejected', 'cancelled'].includes(status);
                                return false; 
                            }).length})
                        </Text>
                    </TouchableOpacity>
                ))
            }
        </View>

        {loading && offers.length === 0 ? (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#1E9E4F" />
                <Text style={styles.emptyText}>กำลังโหลดรายการ...</Text>
            </View>
        ) : filteredOffers.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={80} color="#CCCCCC" />
                <Text style={styles.emptyText}>ไม่พบรายการเจรจาในหมวดหมู่นี้</Text>
                <Text style={styles.emptySubText}>
                    {userRole === 'farmer' 
                        ? 'รอผู้ซื้อยื่นข้อเสนอเข้ามา หรือลองเลือกหมวดหมู่อื่น'
                        : 'ไปที่ "ตลาดลำไย" เพื่อเลือกสินค้าและกดเจรจา หรือลองเลือกหมวดหมู่อื่น'
                    }
                </Text>
                <TouchableOpacity onPress={fetchOffers} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>โหลดใหม่ทั้งหมด</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <FlatList
                data={filteredOffers} 
                // [📍 แก้ไข: ส่ง navigation ไปให้ OfferItem แทน onAction และ userRole]
                renderItem={({ item }) => <OfferItem item={item} navigation={navigation} />}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
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
  
  // [📍 Styles ใหม่สำหรับ Filter Tab]
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1E9E4F', 
  },
  filterButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 12,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // [📍 ลบ Styles ส่วน Action ออกไปเพื่อให้โค้ดสะอาดขึ้น]
});