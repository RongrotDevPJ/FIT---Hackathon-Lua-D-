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

// --- Component สำหรับแสดงรายการ (Item) ---
const OfferItem = ({ item, navigation }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'open': return { color: '#FFB800', text: 'รอการตอบรับ' };
      case 'negotiating': return { color: '#0D6EfD', text: 'กำลังต่อรอง' }; // เผื่อมีสถานะนี้
      case 'accepted': return { color: '#1E9E4F', text: 'ดีลสำเร็จ' };
      case 'rejected': return { color: '#D9534F', text: 'ปฏิเสธ' };
      case 'cancelled': return { color: '#666', text: 'ยกเลิก' };
      default: return { color: '#888', text: 'สถานะ: ' + status };
    }
  };
  
  // ใช้ status จาก item เป็นหลัก 
  const statusInfo = getStatusStyle(item.status || item.priceStatus); 
  const offeredPrice = item.offeredPrice || item.requestedPrice || 0;
  
  let dateString = '...';
  if (item.updatedAt && item.updatedAt._seconds) {
     dateString = new Date(item.updatedAt._seconds * 1000).toLocaleDateString("th-TH");
  } else if (item.updatedAt) {
     dateString = new Date(item.updatedAt).toLocaleDateString("th-TH");
  }

  const handleViewDeal = () => {
    // ส่งข้อมูลทั้ง negotiation และ id ไปยังหน้ารายละเอียด
    navigation.navigate('NegotiationDetail', { 
        negotiation: item,
        negotiationId: item.id,
        // ส่ง item ไปในชื่อ 'item' ด้วยเพื่อความชัวร์ (รองรับโค้ดเก่า)
        item: item 
    });
  };

  return (
    <TouchableOpacity style={styles.offerCard} onPress={handleViewDeal}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>
            {/* แสดงชื่อสินค้า หรือ Order ID */}
            {item.grade ? `ลำไย เกรด ${item.grade}` : `Order #${item.orderId ? item.orderId.slice(-6) : '???'}`}
        </Text>
        {/* แสดงสถานะ: รอการตอบรับ, ดีลสำเร็จ, ปฏิเสธ */}
        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
      </View>
      
      <View style={styles.cardBody}>
        {/* ✅ 1. แก้ไขการแสดงน้ำหนักให้มีตัวเลข */}
        <View style={styles.rowDetail}>
             <Ionicons name="scale-outline" size={16} color="#555" />
             <Text style={styles.detailText}> 
                ปริมาณ: <Text style={styles.boldText}>{item.amountKg ? Number(item.amountKg).toLocaleString() : '-'} </Text> กก.
             </Text>
        </View>
        <View style={styles.rowDetail}>
             <Ionicons name="location-outline" size={16} color="#555" />
             <Text style={styles.detailText}> 
                จังหวัด: <Text style={styles.boldText}>{item.province || 'ไม่ระบุ'}</Text>
             </Text>
        </View>
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

const getSortableDate = (item) => {
    if (!item || !item.updatedAt) return new Date(0); 
    if (item.updatedAt._seconds) {
        return new Date(item.updatedAt._seconds * 1000);
    }
    return new Date(item.updatedAt);
};

export default function OffersScreen({ navigation }) {
  const [allOffers, setAllOffers] = useState([]); 
  const [filteredOffers, setFilteredOffers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  const [counts, setCounts] = useState({ active: 0, accepted: 0, failed: 0 });
  const [filter, setFilter] = useState('active'); 
  
  // ฟังก์ชันกรองข้อมูลและนับจำนวน
  const applyFiltersAndCounts = (offers, currentFilter) => {
      let activeCount = 0;
      let acceptedCount = 0;
      let failedCount = 0;
      let finalFilteredItems = [];
      
      // เรียงลำดับตามวันที่ล่าสุด
      offers.sort((a,b) => getSortableDate(b) - getSortableDate(a));
      
      offers.forEach(item => {
          const status = item.status;
          
          // นับจำนวนในแต่ละหมวดหมู่
          if (status === 'open' || status === 'negotiating') activeCount++;
          if (status === 'accepted') acceptedCount++;
          if (status === 'rejected' || status === 'cancelled') failedCount++;

          // กรองรายการตาม Tab ที่เลือกอยู่
          if (currentFilter === 'active' && (status === 'open' || status === 'negotiating')) {
              finalFilteredItems.push(item);
          } else if (currentFilter === 'accepted' && status === 'accepted') {
              finalFilteredItems.push(item);
          } else if (currentFilter === 'failed' && (status === 'rejected' || status === 'cancelled')) {
              finalFilteredItems.push(item);
          }
      });

      setCounts({ active: activeCount, accepted: acceptedCount, failed: failedCount });
      setFilteredOffers(finalFilteredItems);
  }

  const fetchAllOffers = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const role = await AsyncStorage.getItem('userRole');
      
      setUserRole(role); 

      if (!userId || !role) {
        setLoading(false);
        return;
      }
      
      const baseFilter = role === 'farmer' ? `farmerId=${userId}` : `buyerId=${userId}`;
      // ดึงข้อมูลทั้งหมด
      const url = `${API_BASE_URL}/orderApi/negotiations?${baseFilter}&limit=200`; 
      
      const response = await fetch(url);
      const result = await response.json();
      
      const rawItems = response.ok && Array.isArray(result.items) ? result.items : [];
      
      setAllOffers(rawItems);
      applyFiltersAndCounts(rawItems, filter); 

    } catch (e) {
      console.error("Network Error:", e);
      setAllOffers([]);
      applyFiltersAndCounts([], filter); 
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllOffers(); 
    }, []) 
  );
  
  const handleFilterChange = (newFilter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    applyFiltersAndCounts(allOffers, newFilter);
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* ✅ 2. แถบ Filter Tabs: กดตรงนี้เพื่อดูรายการ "ยอมรับ" หรือ "ปฏิเสธ" */}
      <View style={styles.filterContainer}>
        {
          [{ key: 'active', label: 'กำลังเจรจา', countKey: 'active' }, 
            { key: 'accepted', label: 'ดีลสำเร็จ', countKey: 'accepted' }, 
            { key: 'failed', label: 'ปฏิเสธ/ยกเลิก', countKey: 'failed' }]
            .map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.filterButton,
                        filter === tab.key && styles.filterButtonActive
                    ]}
                    onPress={() => handleFilterChange(tab.key)}
                >
                    <Text style={[
                        styles.filterButtonText,
                        filter === tab.key && styles.filterButtonTextActive
                    ]}>
                        {tab.label} ({counts[tab.countKey] || 0}) 
                    </Text>
                </TouchableOpacity>
            ))
        }
      </View>

      {loading && filteredOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#1E9E4F" />
              <Text style={styles.emptyText}>กำลังโหลดรายการ...</Text>
          </View>
      ) : filteredOffers.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color="#CCCCCC" />
              <Text style={styles.emptyText}>ไม่พบรายการในหมวดหมู่นี้</Text>
              <Text style={styles.emptySubText}>
                 ลองกดเปลี่ยนแท็บด้านบนเพื่อดูรายการอื่น ๆ
              </Text>
              <TouchableOpacity onPress={fetchAllOffers} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>โหลดใหม่</Text>
              </TouchableOpacity>
          </View>
      ) : (
          <FlatList
              data={filteredOffers} 
              renderItem={({ item }) => <OfferItem item={item} navigation={navigation} />}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
              refreshing={loading}
              onRefresh={fetchAllOffers} 
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  listContainer: { padding: 10, paddingBottom: 20 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#888', marginTop: 10, textAlign: 'center' },
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
  rowDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#555', marginLeft: 6 },
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
  weightText: { fontSize: 12, color: '#888', marginTop: 5 },
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
  
  // Styles สำหรับ Filter Tabs
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
});