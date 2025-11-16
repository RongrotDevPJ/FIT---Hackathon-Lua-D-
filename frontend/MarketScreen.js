import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, 
  TouchableOpacity, FlatList, ScrollView // <-- [ใหม่!] เพิ่ม ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- (Mock Data) ---
const listings = [
  {
    id: 'l1',
    grade: 'B',
    seller: 'คุณสมชาย',
    location: 'ลำพูน',
    weight: 500,
    price: 45.00,
    totalPrice: 22500,
    date: '2 วันที่แล้ว',
    views: 24,
  },
];

const ListingItem = ({ item }) => (
  <TouchableOpacity style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.gradeText}>เกรด {item.grade}</Text>
      <View style={styles.gradeBadge}><Text style={styles.gradeBadgeText}>{item.grade}</Text></View>
    </View>
    <View style={styles.cardBody}>
      <View style={styles.cardLeft}>
        <Text style={styles.detailText}><Ionicons name="location-outline" size={14} /> {item.location} • {item.seller}</Text>
        <Text style={styles.detailText}><Ionicons name="scale-outline" size={14} /> {item.weight} กก.</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.priceText}>{item.price.toFixed(2)} <Text style={styles.priceUnit}>บาท/กก.</Text></Text>
        <Text style={styles.totalPrice}>รวม {item.totalPrice.toLocaleString()} บาท</Text>
      </View>
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.footerText}>{item.date}</Text>
      <Text style={styles.footerText}>{item.views} ครั้งที่เข้าชม</Text>
    </View>
  </TouchableOpacity>
);

export default function MarketScreen() {
  const [filter, setFilter] = useState('ทั้งหมด');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={22} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="ค้นหาลำไย..."
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ทั้งหมด' && styles.filterChipActive]}
          onPress={() => setFilter('ทั้งหมด')}
        >
          <Text style={[styles.filterText, filter === 'ทั้งหมด' && styles.filterTextActive]}>ทั้งหมด</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'B' && styles.filterChipActive]}
          onPress={() => setFilter('B')}
        >
          <Text style={[styles.filterText, filter === 'B' && styles.filterTextActive]}>เกรด B</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'C' && styles.filterChipActive]}
          onPress={() => setFilter('C')}
        >
          <Text style={[styles.filterText, filter === 'C' && styles.filterTextActive]}>เกรด C</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'CC' && styles.filterChipActive]}
          onPress={() => setFilter('CC')}
        >
          <Text style={[styles.filterText, filter === 'CC' && styles.filterTextActive]}>เกรด CC</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listings}
        renderItem={({ item }) => <ListingItem item={item} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <Text style={styles.resultText}>พบ {listings.length} รายการ</Text>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

// --- Styles (ฉบับเต็ม) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  listContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 12,
    margin: 15,
    paddingHorizontal: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#1E9E4F',
    borderColor: '#1E9E4F',
  },
  filterText: { fontSize: 14, color: '#555' },
  filterTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  resultText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gradeText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginRight: 8 },
  gradeBadge: {
    backgroundColor: '#0D6EfD', // (สีเกรด B)
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gradeBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLeft: { flex: 1.2 },
  cardRight: { flex: 1, alignItems: 'flex-end' },
  detailText: { fontSize: 14, color: '#555', marginBottom: 4 },
  priceText: { fontSize: 20, fontWeight: 'bold', color: '#1E9E4F' },
  priceUnit: { fontSize: 14, color: '#1E9E4F', fontWeight: 'normal' },
  totalPrice: { fontSize: 12, color: '#888' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginTop: 5,
  },
  footerText: { fontSize: 12, color: '#AAA' },
});