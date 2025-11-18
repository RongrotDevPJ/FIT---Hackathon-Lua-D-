import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';

export default function ListingDetailScreen({ route, navigation }) {
  // รับข้อมูลสินค้าที่ส่งมาจากหน้า Market
  const { item } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // ดึง ID ของเราเพื่อเช็คว่าไม่ใช่สินค้าตัวเอง
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id);
    };
    loadUser();
  }, []);

  const handleStartNegotiation = async () => {
    if (!currentUserId) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนเริ่มเจรจา');
      return;
    }

    if (currentUserId === item.ownerId) {
      Alert.alert('ทำรายการไม่ได้', 'คุณไม่สามารถซื้อขายสินค้าของตัวเองได้');
      return;
    }

    setLoading(true);
    try {
      // 📍 [FIX] เชื่อมต่อ API จริง (ยกเลิกตัวจำลอง)
      // URL ต้องตรงกับ Backend: /orders/:id/negotiations
      const apiUrl = `${API_BASE_URL}/orderApi/orders/${item.id}/negotiations`;
      
      console.log("Creating negotiation at:", apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           actorId: currentUserId,           // คนที่กดปุ่ม (เรา)
           offeredPrice: item.requestedPrice, // เริ่มต้นด้วยราคาที่เขาตั้งไว้
           amountKg: item.amountKg           // จำนวนทั้งหมด
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถสร้างรายการเจรจาได้');
      }

      // ถ้าสำเร็จ ให้แจ้งเตือนและพาไปหน้า Offers
      Alert.alert(
        'ส่งคำขอสำเร็จ!', 
        'เริ่มการเจรจาเรียบร้อย ระบบจะพาคุณไปที่หน้าข้อเสนอ',
        [
          { 
            text: 'ตกลง', 
            onPress: () => {
                // นำทางไปที่หน้ารายการเจรจา
                // หากคุณใช้ Tab Navigation อาจต้องปรับเส้นทาง เช่น navigation.navigate('BuyerApp', { screen: 'OffersTab' });
                navigation.navigate('OffersScreen'); 
            } 
          }
        ]
      );

    } catch (error) {
      console.error("Negotiation Error:", error);
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (g) => {
    switch(g) {
      case 'AA': return '#D32F2F';
      case 'A': return '#1E9E4F';
      case 'B': return '#0D6EfD';
      default: return '#888';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Image Placeholder */}
        <View style={styles.headerImage}>
          <Ionicons name="leaf" size={80} color="#E0E0E0" />
        </View>

        <View style={styles.contentContainer}>
          {/* Grade & Title */}
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: getGradeColor(item.grade) }]}>
              <Text style={styles.badgeText}>เกรด {item.grade}</Text>
            </View>
            <Text style={styles.dateText}>
              ลงเมื่อ: {item.createdAt && item.createdAt._seconds 
                ? new Date(item.createdAt._seconds * 1000).toLocaleDateString('th-TH')
                : 'ไม่ระบุ'}
            </Text>
          </View>

          <Text style={styles.title}>ลำไยคุณภาพ (เกรด {item.grade})</Text>
          
          {/* Price Section */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>ราคาเสนอขาย</Text>
            <Text style={styles.priceValue}>{item.requestedPrice} <Text style={styles.unit}>บาท/กก.</Text></Text>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="scale-outline" size={24} color="#555" />
              <Text style={styles.detailLabel}>ปริมาณ</Text>
              <Text style={styles.detailValue}>{item.amountKg} กก.</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={24} color="#555" />
              <Text style={styles.detailLabel}>สถานที่</Text>
              <Text style={styles.detailValue}>{item.amphoe}, {item.province}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>รายละเอียดเพิ่มเติม</Text>
            <Text style={styles.description}>
              {item.details || "ไม่มีรายละเอียดเพิ่มเติมจากผู้ขาย"}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.footer}>
        <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>มูลค่ารวมประมาณ</Text>
            <Text style={styles.totalValue}>
              {(item.amountKg * item.requestedPrice).toLocaleString()} บาท
            </Text>
        </View>
        <TouchableOpacity 
          style={[styles.dealButton, loading && styles.disabledButton]}
          onPress={handleStartNegotiation}
          disabled={loading}
        >
           {loading ? (
             <ActivityIndicator color="#FFF" />
           ) : (
             <>
               <Ionicons name="chatbubbles-outline" size={20} color="#FFF" style={{marginRight: 8}}/>
               <Text style={styles.dealButtonText}>เจรจาซื้อขาย</Text>
             </>
           )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerImage: { height: 200, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#fff', fontWeight: 'bold' },
  dateText: { color: '#888', fontSize: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  priceBox: { backgroundColor: '#F0F9F4', padding: 15, borderRadius: 12, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#1E9E4F' },
  priceLabel: { color: '#1E9E4F', fontSize: 14 },
  priceValue: { color: '#1E9E4F', fontSize: 28, fontWeight: 'bold' },
  unit: { fontSize: 16, fontWeight: 'normal' },
  detailsGrid: { flexDirection: 'row', marginBottom: 25, justifyContent: 'space-between' },
  detailItem: { width: '48%', backgroundColor: '#FAFAFA', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  detailLabel: { marginTop: 5, color: '#888', fontSize: 12 },
  detailValue: { marginTop: 2, color: '#333', fontSize: 16, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#EEE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' },
  totalInfo: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#888' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dealButton: { backgroundColor: '#1E9E4F', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center' },
  disabledButton: { backgroundColor: '#A5D6A7' },
  dealButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});