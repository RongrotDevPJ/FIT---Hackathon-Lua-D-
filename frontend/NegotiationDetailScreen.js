import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator,
    TextInput, Modal, Platform // ต้องมี Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';

export default function ListingDetailScreen({ route, navigation }) {
  // รับข้อมูลสินค้าที่ส่งมาจากหน้า Market หรือ Home
  const { item } = route.params; 
  
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserToken, setCurrentUserToken] = null; // ไม่ได้ใช้ set ใน useEffect

  // ✅ State สำหรับ Modal และ Input สำหรับการเสนอขาย
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState(''); // ปริมาณที่เกษตรกรจะเสนอขาย

  useEffect(() => {
    // ดึง ID ของเราเพื่อเช็คว่าไม่ใช่สินค้าตัวเอง
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken'); 
      
      setCurrentUserId(id);
      setCurrentUserToken(token); // เก็บ Token ไว้ใน State
    };
    loadUser();
  }, []);

  // -----------------------------------------------------------
  // Logic สำหรับเกษตรกร: เสนอขายลำไยตอบกลับประกาศรับซื้อ (Order type: 'buy')
  // -----------------------------------------------------------
  const handleStartNegotiationAsFarmer = async () => {
        if (!currentUserId || !currentUserToken) {
            Alert.alert("ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อนดำเนินการ");
            return;
        }

        const amount = parseFloat(offerAmount);
        
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("ข้อผิดพลาด", "กรุณาระบุน้ำหนักที่ถูกต้อง");
            return;
        }

        setLoading(true);
        setIsOfferModalVisible(false); // ปิด Modal

        try {
            const apiUrl = `${API_BASE_URL}/orderApi/orders/${item.id}/negotiations`;
            
            const payload = {
                actorId: currentUserId,
                // ใช้ราคาของประกาศรับซื้อ (item.requestedPrice) เป็นราคาเริ่มต้นในการเสนอขาย
                offeredPrice: item.requestedPrice, 
                amountKg: amount,
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${currentUserToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert("เสนอขายสำเร็จ", "คำขอขายถูกส่งไปยังผู้รับซื้อแล้ว สถานะจะปรากฏในหน้าข้อเสนอ", [
                    { 
                        text: "ตกลง", 
                        onPress: () => {
                            // นำทางไปยัง OffersTab ทันที
                            navigation.navigate('OffersTab'); 
                        } 
                    }
                ]);
                
            } else {
                console.error("Negotiation Error:", result);
                Alert.alert('ข้อผิดพลาด', result.error || 'ไม่สามารถส่งคำขอขายได้');
            }
        } catch (e) {
            console.error("Network Error:", e);
            Alert.alert('ข้อผิดพลาดเครือข่าย', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };
    
    // -----------------------------------------------------------
    // Logic สำหรับ Buyer: เริ่มเจรจา Order type: 'sell' (ยังไม่ต้องแก้ไข)
    // -----------------------------------------------------------
    const handleStartNegotiationAsBuyer = () => {
        Alert.alert("ทำรายการไม่ได้", "ฟังก์ชันนี้มีไว้สำหรับผู้ซื้อสินค้าเท่านั้น");
    };

    // -----------------------------------------------------------
    // Logic หลัก: กดปุ่มที่ด้านล่าง
    // -----------------------------------------------------------
    const handleDealAction = () => {
        // กรณีที่รายการเป็น Buy Offer (เกษตรกรเห็นและจะเสนอขาย)
        if (item.type === 'buy') {
             if (currentUserId === item.ownerId) {
                 Alert.alert('ทำรายการไม่ได้', 'นี่คือประกาศรับซื้อของคุณเอง');
                 return;
             }
             // ตั้งค่า offerAmount เป็นค่าว่างเสมอเมื่อเปิด Modal เพื่อให้เกษตรกรกรอกใหม่
             setOfferAmount('');
             setIsOfferModalVisible(true);
        } 
        // กรณีที่รายการเป็น Sell Listing (ผู้ซื้อเห็นและจะเสนอซื้อ - ใช้สำหรับบทบาท Buyer เท่านั้น)
        else if (item.type === 'sell') {
            handleStartNegotiationAsBuyer();
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
    
    const isBuyOffer = item.type === 'buy';


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

          <Text style={styles.title}>
                {isBuyOffer ? 'ประกาศรับซื้อ' : 'ประกาศขาย'} (เกรด {item.grade})
            </Text>
          
          {/* Price Section */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>ราคาเสนอ{isBuyOffer ? 'รับซื้อ' : 'ขาย'}</Text>
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
              {item.details || "ไม่มีรายละเอียดเพิ่มเติมจากผู้รับซื้อ/ผู้ขาย"}
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
          style={[styles.dealButton, loading && styles.disabledButton, isBuyOffer && styles.offerButton]} 
          onPress={handleDealAction} 
          disabled={loading}
        >
           {loading ? (
             <ActivityIndicator color="#FFF" />
           ) : (
             <>
               <Ionicons name="pricetag-outline" size={20} color="#FFF" style={{marginRight: 8}}/>
                {/* เปลี่ยนข้อความปุ่ม */}
               <Text style={styles.dealButtonText}>
                    {isBuyOffer ? 'ขายให้ผู้รับซื้อ' : 'สนใจดีล (สำหรับผู้ซื้อ)'}
                </Text>
             </>
           )}
        </TouchableOpacity>
      </View>
        
        {/* ✅ Modal สำหรับ Farmer เสนอขาย */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={isOfferModalVisible}
            onRequestClose={() => setIsOfferModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* เปลี่ยน Modal Title */}
                    <Text style={styles.modalTitle}>ระบุรายละเอียดการขาย</Text>
                    {/* ✅ FIX: ห่อหุ้มข้อความใน Modal ให้ถูกต้องทั้งหมดใน Text เดียว */}
                    <Text style={styles.modalText}>
                        คุณต้องการตอบรับประกาศรับซื้อนี้ กรุณาระบุปริมาณลำไยที่คุณจะขาย โดยใช้ราคาที่ผู้รับซื้อเสนอรับซื้อไว้
                        <Text style={{fontWeight: 'bold'}}> ({item.requestedPrice} บาท/กก.)</Text> เป็นราคาเริ่มต้น
                    </Text>
                    
                    <Text style={styles.inputLabel}>ปริมาณลำไยที่จะขาย (กก.):</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setOfferAmount}
                        value={offerAmount}
                        keyboardType="numeric"
                        placeholder="ระบุน้ำหนักที่ต้องการขาย"
                    />
                    
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelModalButton]}
                            onPress={() => setIsOfferModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>ยกเลิก</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.confirmModalButton]}
                            onPress={handleStartNegotiationAsFarmer}
                        >
                            <Text style={styles.modalButtonText}>ยืนยันการเสนอขาย</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
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
  dealButton: { 
        backgroundColor: '#1E9E4F', 
        flexDirection: 'row', 
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        borderRadius: 30, 
        alignItems: 'center',
        flex: 1.5, // ให้ปุ่มใหญ่ขึ้น
    },
    offerButton: { // ✅ สไตล์สำหรับปุ่มเสนอขาย
        backgroundColor: '#0D6EfD',
    },
  disabledButton: { backgroundColor: '#A5D6A7' },
  dealButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        elevation: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    modalText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelModalButton: {
        backgroundColor: '#9E9E9E',
    },
    confirmModalButton: {
        backgroundColor: '#0D6EfD',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});