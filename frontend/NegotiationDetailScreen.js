import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';

export default function NegotiationDetailScreen({ route, navigation }) {
  // รับ negotiationId ที่ถูกส่งมาจาก OffersScreen
  const { negotiationId } = route.params;
  
  const [negotiation, setNegotiation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserToken, setCurrentUserToken] = useState(null);

  useEffect(() => {
    const loadData = async () => {
        const token = await AsyncStorage.getItem('userToken');
        setCurrentUserToken(token);
        if (token) {
            fetchNegotiationDetail(token);
        } else {
            setLoading(false);
            Alert.alert("ข้อผิดพลาด", "ไม่พบ Token ผู้ใช้");
        }
    };
    loadData();
  }, []);

  const fetchNegotiationDetail = async (token) => {
    setLoading(true);
    try {
        // [📍 API Endpoint สำหรับดึงข้อมูลการเจรจารายการเดียว]
        // ต้องมั่นใจว่า Backend มี Endpoint นี้: /orderApi/negotiations/:id
        const apiUrl = `${API_BASE_URL}/orderApi/negotiations/${negotiationId}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();
        
        if (response.ok) {
            setNegotiation(result);
        } else {
            console.error("Fetch Detail Error:", result);
            Alert.alert('ข้อผิดพลาด', result.error || 'ไม่สามารถดึงรายละเอียดการเจรจาได้');
        }

    } catch (e) {
        console.error("Network Error:", e);
        Alert.alert('ข้อผิดพลาดเครือข่าย', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
        setLoading(false);
    }
  };

  // [TODO: เพิ่ม handleUpdateNegotiation (Accept/Reject/Counter) ในขั้นตอนต่อไป]
  // เพื่อให้การทำงานทั้งหมดเกิดขึ้นที่หน้านี้

  if (loading || !negotiation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E9E4F" />
        <Text style={styles.loadingText}>กำลังโหลดรายละเอียดการเจรจา...</Text>
      </View>
    );
  }

  const currentPrice = negotiation.offeredPrice || negotiation.requestedPrice;
  const statusText = negotiation.status || negotiation.priceStatus;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.title}>การเจรจา Order #{negotiation.orderId.slice(-6)}</Text>
        <Text style={styles.subtitle}>สถานะ: <Text style={styles.statusValue}>{statusText.toUpperCase()}</Text></Text>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>ราคาปัจจุบันที่เสนอ</Text>
          <Text style={styles.priceValue}>{Number(currentPrice).toFixed(2)} <Text style={styles.unit}>บาท/กก.</Text></Text>
        </View>

        <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>เกรด:</Text>
                <Text style={styles.infoValue}>{negotiation.grade}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>จำนวน:</Text>
                <Text style={styles.infoValue}>{negotiation.amountKg} กก.</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>อัปเดต:</Text>
                <Text style={styles.infoValue}>
                    {negotiation.updatedAt && negotiation.updatedAt._seconds 
                        ? new Date(negotiation.updatedAt._seconds * 1000).toLocaleDateString('th-TH')
                        : 'ไม่ระบุ'}
                </Text>
            </View>
        </View>
        
        {/* TODO: ส่วนของประวัติการเสนอราคา / แชท จะอยู่ตรงนี้ */}
        <View style={styles.historyBox}>
            <Text style={styles.sectionTitle}>ประวัติการเสนอราคา</Text>
            <Text style={styles.placeholderText}>
                [ในอนาคต: แสดงรายการราคาที่เคยต่อรองกัน]
            </Text>
        </View>

      </ScrollView>

      {/* [TODO: ส่วน Action Bar (Accept/Reject/Counter) จะอยู่ตรงนี้] */}
      <View style={styles.footer}>
        {/* Placeholder สำหรับปุ่ม Action */}
        <Text style={styles.placeholderTextFooter}>
            ปุ่มดำเนินการ (Accept/Reject/Counter)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
    container: { padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#555', marginBottom: 20 },
    statusValue: { fontWeight: 'bold' },
    priceBox: { 
        backgroundColor: '#E8F5E9', 
        padding: 15, 
        borderRadius: 12, 
        marginBottom: 20, 
        borderLeftWidth: 5, 
        borderLeftColor: '#1E9E4F' 
    },
    priceLabel: { color: '#1E9E4F', fontSize: 14 },
    priceValue: { color: '#1E9E4F', fontSize: 30, fontWeight: 'bold' },
    unit: { fontSize: 18, fontWeight: 'normal' },
    infoContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F7F7',
    },
    infoLabel: { fontSize: 14, color: '#888' },
    infoValue: { fontSize: 16, fontWeight: '600', color: '#333' },
    historyBox: {
        minHeight: 150,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    placeholderText: { color: '#AAA', fontStyle: 'italic', textAlign: 'center', marginTop: 30 },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    placeholderTextFooter: { color: '#AAA', fontStyle: 'italic', textAlign: 'center' },
});