import React from 'react';
import { 
  StyleSheet, Text, View, FlatList, 
  TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; //

// --- [1. Mock Data (ข้อมูลจำลอง)] ---
const offersData = [
  { id: 'o1', productName: 'ลำไยพันธุ์อีดอ', grade: 'AA', seller: 'โรงงานไทยรุ่งเรือง', offeredPrice: 45.50, offeredWeight: 5000, status: 'pending', date: '10/11/2568' },
  { id: 'o2', productName: 'ลำไยพันธุ์สีชมพู', grade: 'A', seller: 'กลุ่มวิสาหกิจชุมชน', offeredPrice: 35.00, offeredWeight: 2500, status: 'accepted', date: '08/11/2568' },
  { id: 'o3', productName: 'ลำไยพันธุ์เบี้ยวเขียว', grade: 'B', seller: 'โรงงานส่งออกจีน', offeredPrice: 28.00, offeredWeight: 8000, status: 'pending', date: '05/11/2568' },
]; //

// --- [2. Component สำหรับแสดงรายการ (Item)] ---
const OfferItem = ({ item }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { color: '#FFB800', text: 'รอการตอบรับ' };
      case 'accepted': return { color: '#1E9E4F', text: 'ดีลสำเร็จ' };
      case 'rejected': return { color: '#D9534F', text: 'ยกเลิก/ปฏิเสธ' };
      default: return { color: '#888', text: 'ไม่ทราบสถานะ' };
    }
  };
  const statusInfo = getStatusStyle(item.status);
  const handleViewDeal = () => {
    Alert.alert('รายละเอียดดีล', `คุณต้องการดูรายละเอียดข้อเสนอจาก ${item.seller} หรือไม่?\n\n(ในแอปฯ จริงจะไปที่หน้าแชท/เจรจา)`);
  };

  return (
    <TouchableOpacity style={styles.offerCard} onPress={handleViewDeal}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detailText}>ผู้เสนอซื้อ: <Text style={styles.boldText}>{item.seller}</Text></Text>
        <Text style={styles.detailText}>เกรดที่เสนอ: <Text style={styles.boldText}>{item.grade}</Text></Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>ราคาเสนอซื้อ</Text>
          <Text style={styles.priceText}>{item.offeredPrice.toFixed(2)}</Text>
          <Text style={styles.priceUnit}>บาท/กก.</Text>
        </View>
        <View style={styles.weightContainer}>
          <Text style={styles.priceLabel}>ปริมาณ</Text>
          <Text style={styles.weightText}>{item.offeredWeight.toLocaleString()}</Text>
          <Text style={styles.priceUnit}>กก.</Text>
        </View>
      </View>
      <Text style={styles.dateText}>วันที่เสนอ: {item.date}</Text>
    </TouchableOpacity>
  );
}; //

export default function OffersScreen({ navigation }) {
  const offers = offersData; 
  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={offers}
        renderItem={({ item }) => <OfferItem item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={offers.length === 0 ? styles.emptyListContainer : styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyText}>ยังไม่มีข้อเสนอ</Text>
            <Text style={styles.emptySubText}>เมื่อมีผู้ซื้อยื่นข้อเสนอรับซื้อประกาศของคุณ ข้อเสนอจะปรากฏที่นี่</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
} //

// --- Styles (ฉบับเต็ม) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  emptyListContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#888', marginTop: 10 },
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
  productName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
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
  priceText: { fontSize: 24, fontWeight: 'bold', color: '#1E9E4F', marginTop: 2 },
  weightText: { fontSize: 24, fontWeight: 'bold', color: '#0D6EfD', marginTop: 2 },
  priceUnit: { fontSize: 14, color: '#555' },
  dateText: { fontSize: 12, color: '#AAAAAA', textAlign: 'right', marginTop: 5 },
}); //