import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, StyleSheet, 
  TouchableOpacity, Image, Alert 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import API Config
import { API_BASE_URL } from './apiConfig';

export default function MyListingsScreen() {
  const navigation = useNavigation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ ใช้ useFocusEffect เพื่อโหลดข้อมูลใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // ตัวแปรกัน Memory Leak

      const fetchListings = async () => {
        try {
          // ถ้าอยากให้หมุนติ้วๆ ทุกครั้งที่เข้าหน้าจอนี้ ให้เปิดบรรทัดนี้
          // setLoading(true); 
          
          const userId = await AsyncStorage.getItem('userId');
          // const token = await AsyncStorage.getItem('userToken'); // ถ้า Backend เช็ค Token ให้เปิดใช้

          if (!userId) return;

          // ⚠️ แก้ไข Endpoint ให้ตรงกับ orderRoutes.ts (/orders/my)
          // และกรอง type=sell เพราะหน้านี้คือ "รายการขายของฉัน"
          const url = `${API_BASE_URL}/orderApi/orders/my?ownerId=${userId}&type=sell`;
          
          console.log("Fetching My Listings:", url);

          const response = await fetch(url, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              // 'Authorization': `Bearer ${token}` 
            }
          });

          const data = await response.json();

          if (isActive) {
            if (response.ok) {
              // Backend ส่งกลับมาเป็น { items: [...] } หรือ Array โดยตรง?
              // เช็คจากไฟล์ orderRoutes.ts จะส่งกลับมาเป็น { items, nextCursor }
              setListings(data.items || []); 
            } else {
              console.error("Failed to fetch listings:", data);
              setListings([]);
            }
          }
        } catch (error) {
          console.error("Error fetching listings:", error);
          if (isActive) setListings([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchListings();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ListingDetail', { item })}
    >
      <View style={styles.row}>
        {/* แสดงรูปภาพถ้ามี (ถ้าไม่มีใช้ icon แทน) */}
        <View style={styles.imageContainer}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
                <View style={styles.placeholderImage}>
                    <Ionicons name="leaf-outline" size={24} color="#1E9E4F" />
                </View>
            )}
        </View>

        <View style={styles.info}>
            <Text style={styles.title}>
                {item.plantType || 'ลำไย'} {item.grade ? `(เกรด ${item.grade})` : ''}
            </Text>
            
            <Text style={styles.subTitle}>
                พื้นที่: {item.amphoe}, {item.province}
            </Text>

            <Text style={styles.subTitle}>
                {/* แสดงปริมาณ (Updated ตามการขายจริง) */}
                ปริมาณ: <Text style={styles.bold}>{Number(item.amountKg).toLocaleString()}</Text> กก. 
            </Text>
            
            <Text style={styles.price}>฿{item.requestedPrice}/กก.</Text>
            
            {/* Badge สถานะ */}
            <View style={[
                styles.badge, 
                item.status === 'open' ? styles.bgOpen : 
                item.status === 'matched' ? styles.bgMatched : styles.bgClosed
            ]}>
                <Text style={styles.badgeText}>
                    {item.status === 'open' ? 'กำลังขาย' : 
                     item.status === 'matched' ? 'ขายแล้วบางส่วน/รอปิดดีล' : 'ปิดการขาย'}
                </Text>
            </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#CCC" style={{alignSelf:'center'}} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1E9E4F" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={() => { setLoading(true); /* Trigger fetch again via effect dependency change usually, or logic refactor */ }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={60} color="#DDD" />
                <Text style={styles.emptyText}>คุณยังไม่มีรายการประกาศขาย</Text>
                <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateListing')}
                >
                    <Text style={styles.createButtonText}>+ ลงประกาศขายเลย</Text>
                </TouchableOpacity>
            </View>
          }
          contentContainerStyle={listings.length === 0 && styles.centerEmpty}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 10 },
  card: { 
    backgroundColor: '#FFF', padding: 15, marginBottom: 10, borderRadius: 12, 
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width:0, height:2}
  },
  row: { flexDirection: 'row' },
  imageContainer: { marginRight: 15 },
  image: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#EEE' },
  placeholderImage: { 
    width: 70, height: 70, borderRadius: 8, backgroundColor: '#E8F5E9', 
    justifyContent: 'center', alignItems: 'center' 
  },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subTitle: { fontSize: 13, color: '#666', marginBottom: 2 },
  bold: { fontWeight: '600', color: '#333' },
  price: { color: '#1E9E4F', fontWeight: 'bold', marginTop: 4, fontSize: 16 },
  
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8 },
  bgOpen: { backgroundColor: '#E8F5E9' },       // เขียวอ่อน
  bgMatched: { backgroundColor: '#FFF3E0' },    // ส้มอ่อน (กรณีขายได้บางส่วน)
  bgClosed: { backgroundColor: '#EEEEEE' },     // เทา
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },

  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 10, color: '#999', fontSize: 16, marginBottom: 20 },
  centerEmpty: { flexGrow: 1, justifyContent: 'center' },
  createButton: {
      backgroundColor: '#1E9E4F', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20
  },
  createButtonText: { color: '#FFF', fontWeight: 'bold' }
});