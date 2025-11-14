import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, 
  TouchableOpacity, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MyBidsScreen() {
  const [filter, setFilter] = useState('กำลังเจรจา'); 

  // (Mock Data - ตอนนี้ว่าง)
  const bids = [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* --- Filter Tabs --- */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'กำลังเจรจา' && styles.filterChipActive]}
            onPress={() => setFilter('กำลังเจรจา')}
          >
            <Text style={[styles.filterText, filter === 'กำลังเจรจา' && styles.filterTextActive]}>กำลังเจรจา (0)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'ตกลงแล้ว' && styles.filterChipActive]}
            onPress={() => setFilter('ตกลงแล้ว')}
          >
            <Text style={[styles.filterText, filter === 'ตกลงแล้ว' && styles.filterTextActive]}>ตกลงแล้ว (0)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'ปฏิเสธ' && styles.filterChipActive]}
            onPress={() => setFilter('ปฏิเสธ')}
          >
            <Text style={[styles.filterText, filter === 'ปฏิเสธ' && styles.filterTextActive]}>ปฏิเสธ (0)</Text>
          </TouchableOpacity>
        </View>

        {/* --- Empty State --- */}
        {bids.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyText}>ไม่มีข้อเสนอที่รอดำเนินการ</Text>
          </View>
        )}
        
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles (ฉบับเต็ม) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterChip: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    borderRadius: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#E8F5E9', 
    borderWidth: 1,
    borderColor: '#1E9E4F',
  },
  filterText: { fontSize: 14, color: '#555' },
  filterTextActive: { color: '#1E9E4F', fontWeight: 'bold' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
    marginHorizontal: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 15,
  },
});