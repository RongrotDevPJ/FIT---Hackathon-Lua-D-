// File: frontend/OffersScreen.js

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
      case 'negotiating': return { color: '#0D6EfD', text: 'กำลังต่อรอง' };
      case 'accepted': return { color: '#1E9E4F', text: 'ดีลสำเร็จ' };
      case 'rejected': return { color: '#D9534F', text: 'ปฏิเสธ' };
      case 'cancelled': return { color: '#666', text: 'ยกเลิก' };
      default: return { color: '#888', text: 'ไม่ทราบสถานะ' };
    }
  };
  
  // ✅ ใช้ status จาก item เป็นหลัก 
  const statusInfo = getStatusStyle(item.status || item.priceStatus); 
  
  const offeredPrice = item.offeredPrice || item.requestedPrice || 0;
  
  let dateString = '...';
  if (item.updatedAt && item.updatedAt._seconds) {
     dateString = new Date(item.updatedAt._seconds * 1000).toLocaleDateString("th-TH");
  } else if (item.updatedAt) {
     dateString = new Date(item.updatedAt).toLocaleDateString("th-TH");
  }

  const handleViewDeal = () => {
    navigation.navigate('NegotiationDetail', { negotiationId: item.id });
  };

  return (
    <TouchableOpacity style={styles.offerCard} onPress={handleViewDeal}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>Order #{item.orderId ? item.orderId.slice(-6) : '???'}</Text>
        {/* แสดงสถานะที่ถูกต้องตามข้อมูลที่ได้ */}
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

// --- Helper function for sorting and date parsing (✅ NEW: ส่วนที่เพิ่มเข้ามาและต้องอยู่ภายนอก OffersScreen) ---
const getSortableDate = (item) => {
    if (!item || !item.updatedAt) return new Date(0); 
    
    // Handle Firebase Timestamp format { _seconds: N }
    if (item.updatedAt._seconds) {
        return new Date(item.updatedAt._seconds * 1000);
    }
    
    // Handle standard Date string/object
    return new Date(item.updatedAt);
};

export default function OffersScreen({ navigation }) {
  // ✅ [NEW STATE]: เก็บรายการทั้งหมดที่ดึงมาจาก API (ไม่ถูกกรอง)
  const [allOffers, setAllOffers] = useState([]); 
  const [filteredOffers, setFilteredOffers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  const [counts, setCounts] = useState({ active: 0, accepted: 0, failed: 0 });
  // [📍 ใช้ filter เพื่อบอกว่าตอนนี้กำลังแสดงแท็บไหนอยู่]
  const [filter, setFilter] = useState('active'); 
  
  // ✅ [NEW FUNCTION]: ฟังก์ชันใหม่สำหรับกรองและนับจำนวนจากชุดข้อมูลทั้งหมด
  const applyFiltersAndCounts = (offers, currentFilter) => {
      let activeCount = 0;
      let acceptedCount = 0;
      let failedCount = 0;
      let finalFilteredItems = [];
      
      // เรียงลำดับรายการตามวันที่ล่าสุดอีกครั้ง (เพื่อความแม่นยำแม้ว่า API จะเรียงมาแล้ว)
      offers.sort((a,b) => getSortableDate(b) - getSortableDate(a));
      
      offers.forEach(item => {
          // 1. Calculate Counts (Local Filtering for Counts)
          const status = item.status;
          if (status === 'open' || status === 'negotiating') activeCount++;
          if (status === 'accepted') acceptedCount++;
          if (status === 'rejected' || status === 'cancelled') failedCount++;

          // 2. Apply selected Filter for Display (Local Filtering for Display)
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

  // ✅ [MODIFIED FUNCTION]: ดึงข้อมูลทั้งหมดมาเพียงครั้งเดียว
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
      
      // ดึงข้อมูลทั้งหมด (สูงสุด 200 รายการ ตามการตั้งค่าใน Backend) โดยไม่ต้องระบุ status
      const url = `${API_BASE_URL}/orderApi/negotiations?${baseFilter}&limit=200`; 
      const response = await fetch(url);
      const result = await response.json();
      
      const rawItems = response.ok ? (result.items || []) : [];
      
      // ✅ [FIX]: ลบขั้นตอน De-duplication ออกไปแล้วเนื่องจาก API ดึงมาแบบรวมแล้วไม่ควรซ้ำซ้อนกัน
      
      setAllOffers(rawItems);
      // กรองและนับจำนวนด้วยชุดข้อมูลใหม่ และ Filter ปัจจุบัน
      applyFiltersAndCounts(rawItems, filter); 

    } catch (e) {
      console.error("Network Error:", e);
      setAllOffers([]);
      applyFiltersAndCounts([], filter); 
    } finally {
      setLoading(false);
    }
  };

  // 4. ใช้ useFocusEffect เพื่อให้โหลดใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      // โหลดข้อมูลทั้งหมดเมื่อเข้าสู่หน้าจอ
      fetchAllOffers(); 
      // ⚠️ ไม่มี dependency [filter] เพราะการเปลี่ยน filter จะจัดการด้วย handleFilterChange
    }, []) 
  );
  
  // ✅ [MODIFIED]: เมื่อกด tab ให้เปลี่ยน filter และกรองข้อมูลที่มีอยู่
  const handleFilterChange = (newFilter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    // กรองจากข้อมูลทั้งหมด (allOffers) ที่โหลดมาแล้ว
    applyFiltersAndCounts(allOffers, newFilter);
  }
  
  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* [📍 เพิ่มแถบ Filter] */}
      <View style={styles.filterContainer}>
        {
          [{ key: 'active', label: 'กำลังดีล', countKey: 'active' }, 
            { key: 'accepted', label: 'ดีลสำเร็จ', countKey: 'accepted' }, 
            { key: 'failed', label: 'ถูกปฏิเสธ/ยกเลิก', countKey: 'failed' }]
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
                        {/* ใช้ counts state ที่ดึงมาอย่างถูกต้อง */}
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
              <Text style={styles.emptyText}>ไม่พบรายการเจรจาในหมวดหมู่นี้</Text>
              <Text style={styles.emptySubText}>
                  {userRole === 'farmer' 
                      ? 'รอผู้ซื้อยื่นข้อเสนอเข้ามา หรือลองเลือกหมวดหมู่อื่น'
                      : 'ไปที่ "ตลาดลำไย" เพื่อเลือกสินค้าและกดเจรจา หรือลองเลือกหมวดหมู่อื่น'
                  }
              </Text>
              {/* เปลี่ยนเป็นเรียก fetchAllOffers */}
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
              // ✅ [MODIFIED]: onRefresh เรียก fetchAllOffers
              onRefresh={fetchAllOffers} 
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
});