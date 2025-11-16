import React, { 
  useState, 
  useEffect // [ 📍 แก้ไข! ]
} from 'react'; 
import { 
  StyleSheet, Text, View, TextInput, 
  TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// [ 📍 ตั้งค่า API URL (สำหรับ Web) ]
import { API_BASE_URL } from './apiConfig';

// --- (Component ListingItem) ---
const ListingItem = ({ item }) => {
  
  const getGradeBadgeColor = (grade) => {
    switch (grade) {
      case 'AA': return '#D32F2F'; // แดง
      case 'A':  return '#1E9E4F'; // เขียว
      case 'B':  return '#0D6EfD'; // น้ำเงิน
      case 'C':  return '#FFA000'; // ส้ม
      case 'CC': return '#616161'; // เทา
      default:   return '#888';
    }
  };

  // [ 📍 เพิ่มการตรวจสอบข้อมูลก่อนแสดงผล ]
  const amount = item.amountKg || 0;
  const price = item.requestedPrice || 0;
  const province = item.province || 'ไม่ระบุจังหวัด';
  const amphoe = item.amphoe || 'ไม่ระบุอำเภอ';
  
  let dateString = 'ไม่ระบุวันที่';
  if (item.createdAt && item.createdAt._seconds) {
     dateString = new Date(item.createdAt._seconds * 1000).toLocaleDateString("th-TH");
  } else if (item.createdAt) {
     dateString = new Date(item.createdAt).toLocaleDateString("th-TH");
  }

  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.gradeText}>เกรด {item.grade}</Text>
        <View style={[
          styles.gradeBadge, 
          {backgroundColor: getGradeBadgeColor(item.grade)} 
        ]}>
          <Text style={styles.gradeBadgeText}>{item.grade}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardLeft}>
          <Text style={styles.detailText}><Ionicons name="location-outline" size={14} /> {province} • {amphoe}</Text>
          <Text style={styles.detailText}><Ionicons name="scale-outline" size={14} /> {amount} กก.</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.priceText}>{price.toFixed(2)} <Text style={styles.priceUnit}>บาท/กก.</Text></Text>
          <Text style={styles.totalPrice}>
            รวม {(amount * price).toLocaleString()} บาท
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>{dateString}</Text>
      </View>
    </TouchableOpacity>
  );
};


export default function MarketScreen() {
  const [filter, setFilter] = useState('ทั้งหมด');
  
  const [allListings, setAllListings] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders?status=open`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(result.error || `ไม่สามารถดึงข้อมูลได้: ${errorText}`);
      }

      const result = await response.json();
      setAllListings(result.items || []);

    } catch (e) {
      console.error("Fetch Error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(); 
  }, []); 

  
  const filteredListings = allListings
    .filter(item => item.type === 'sell') // กรองเฉพาะ "ประกาศขาย"
    .filter(item => {
      if (filter === 'ทั้งหมด') return true;
      return item.grade === filter;
    });

  
  const renderContent = () => {
    if (loading && allListings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#1E9E4F" />
          <Text style={styles.emptyText}>กำลังโหลดข้อมูลตลาด...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#D32F2F" />
          <Text style={styles.emptyText}>เกิดข้อผิดพลาด</Text>
          <Text style={styles.emptySubText}>{error}</Text>
          <TouchableOpacity onPress={fetchListings} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (filteredListings.length === 0) {
       return (
            <View style={styles.emptyContainer}>
                <Ionicons name="sad-outline" size={60} color="#CCCCCC" />
                <Text style={styles.emptyText}>
                  {filter === 'ทั้งหมด' 
                    ? 'ยังไม่มีประกาศขายในตลาด' 
                    : `ไม่พบประกาศขายเกรด ${filter}`
                  }
                </Text>
                <TouchableOpacity onPress={fetchListings} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>รีเฟรช</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
      <FlatList
        data={filteredListings}
        renderItem={({ item }) => <ListingItem item={item} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <Text style={styles.resultText}>พบ {filteredListings.length} รายการ</Text>
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchListings}
            colors={['#1E9E4F']}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={22} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="ค้นหาลำไย..."
          style={styles.searchInput}
        />
      </View>

      {/* --- Filter Scroll --- */}
      <View style={styles.filterScroller}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'ทั้งหมด' && styles.filterChipActive]}
            onPress={() => setFilter('ทั้งหมด')}
          >
            <Text style={[styles.filterText, filter === 'ทั้งหมด' && styles.filterTextActive]}>ทั้งหมด</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'AA' && styles.filterChipActive]}
            onPress={() => setFilter('AA')}
          >
            <Text style={[styles.filterText, filter === 'AA' && styles.filterTextActive]}>เกรด AA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'A' && styles.filterChipActive]}
            onPress={() => setFilter('A')}
          >
            <Text style={[styles.filterText, filter === 'A' && styles.filterTextActive]}>เกรด A</Text>
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
        </ScrollView>
      </View>
      
      {renderContent()}

    </SafeAreaView>
  );
}

// --- Styles ---
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
  filterScroller: { 
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gradeText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginRight: 8 },
  gradeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  gradeBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
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
  emptyContainer: { 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
    flex: 1,
  },
  emptyText: { 
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 5,
    textAlign: 'center',
  },
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