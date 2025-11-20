import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // ✅ 1. เพิ่ม useFocusEffect
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from './apiConfig';

export default function MyListingsScreen() {
  const navigation = useNavigation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 2. ใช้ useFocusEffect เพื่อให้โหลดข้อมูลใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // ตัวแปรเช็คว่า Component ยังทำงานอยู่ไหม

      const fetchListings = async () => {
        try {
          // setLoading(true); // อาจจะปิดไว้ถ้าไม่อยากให้หมุนติ้วๆ ทุกครั้งที่กลับมา
          const userId = await AsyncStorage.getItem('userId');
          const token = await AsyncStorage.getItem('userToken');

          if (!userId || !token) return;

          // เรียก API ดึงรายการสินค้าของฉัน
          const response = await fetch(`${API_BASE_URL}/orderApi/orders/my-orders?ownerId=${userId}&type=sell`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const data = await response.json();

          if (isActive && response.ok) {
            setListings(data); // อัปเดตข้อมูลใหม่ (รวมถึง Order ที่แบ่งออกมาใหม่ด้วย)
          }
        } catch (error) {
          console.error("Error fetching listings:", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchListings();

      return () => {
        isActive = false; // Cleanup function
      };
    }, []) // dependency array ว่างไว้
  );

  // ... (ส่วน Render ของคุณเหมือนเดิม) ...
  
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ListingDetail', { item })}
    >
      {/* ส่วนแสดงผลการ์ดสินค้า */}
      <View style={styles.row}>
        <View style={styles.info}>
            <Text style={styles.title}>{item.grade} - {item.province}</Text>
            <Text style={styles.subTitle}>
                {/* แสดงปริมาณที่เหลืออยู่ (จะอัปเดตตามการแบ่ง Order) */}
                ปริมาณ: {Number(item.amountKg).toLocaleString()} กก. 
            </Text>
            <Text style={styles.price}>฿{item.requestedPrice}/กก.</Text>
            
            {/* แสดงสถานะ */}
            <View style={[styles.badge, item.status === 'open' ? styles.bgOpen : styles.bgMatched]}>
                <Text style={styles.badgeText}>{item.status === 'open' ? 'กำลังขาย' : 'ขายแล้ว'}</Text>
            </View>
        </View>
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
          onRefresh={() => { /* เรียก fetchListings อีกรอบก็ได้ */ }}
          ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีรายการขาย</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 10 },
  card: { backgroundColor: '#FFF', padding: 15, marginBottom: 10, borderRadius: 10, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold' },
  subTitle: { color: '#666', marginTop: 5 },
  price: { color: '#1E9E4F', fontWeight: 'bold', marginTop: 5, fontSize: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, marginTop: 8 },
  bgOpen: { backgroundColor: '#E8F5E9' },
  bgMatched: { backgroundColor: '#EEE' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});