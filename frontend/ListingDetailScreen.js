import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator,
  TextInput, Modal, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';

export default function NegotiationDetailScreen({ route, navigation }) {
  const { negotiation, order, item } = route.params || {};

  // รวมข้อมูล Negotiation (ถ้ามี)
  const negotiationData = negotiation || (item && (item.offeredPrice !== undefined || item.status === 'negotiating') ? item : null);
  // ข้อมูลสินค้า/Order ต้นทาง
  const productData = order || (item && !negotiationData ? item : item) || {};

  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserToken, setCurrentUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // ✅ เพิ่ม State เก็บ Role

  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState(''); 
  const [offerPrice, setOfferPrice] = useState(''); 

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken'); 
      const role = await AsyncStorage.getItem('userRole'); // ✅ ดึง Role มาด้วย
      
      setCurrentUserId(id);
      setCurrentUserToken(token); 
      setUserRole(role);
    };
    loadUser();
  }, []);

  // ฟังก์ชันส่งข้อเสนอ (ใช้ได้ทั้ง Farmer และ Buyer)
  const handleStartNegotiation = async () => {
    if (!currentUserId || !currentUserToken) {
        Alert.alert("ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อนดำเนินการ");
        return;
    }

    const amount = parseFloat(offerAmount);
    const price = parseFloat(offerPrice);
    
    if (isNaN(amount) || amount <= 0) {
        Alert.alert("ข้อผิดพลาด", "กรุณาระบุน้ำหนักที่ถูกต้อง");
        return;
    }
    if (isNaN(price) || price <= 0) {
        Alert.alert("ข้อผิดพลาด", "กรุณาระบุราคาที่ถูกต้อง");
        return;
    }

    setLoading(true);
    setIsOfferModalVisible(false);

    try {
        const orderId = productData.id || productData.orderId;
        const apiUrl = `${API_BASE_URL}/orderApi/orders/${orderId}/negotiations`;
        
        const payload = {
            actorId: currentUserId,
            offeredPrice: price, 
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
            Alert.alert("สำเร็จ", "ส่งข้อเสนอเรียบร้อยแล้ว", [
                { text: "ตกลง", onPress: () => navigation.navigate('OffersTab') }
            ]);
        } else {
            Alert.alert('ข้อผิดพลาด', result.error || 'ไม่สามารถส่งข้อเสนอได้');
        }
    } catch (e) {
        console.error("Network Error:", e);
        Alert.alert('ข้อผิดพลาดเครือข่าย', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
        setLoading(false);
    }
  };

  // ปุ่มเปิด Modal (แยก Logic ตาม Role)
  const handleDealAction = () => {
    if (currentUserId === productData.ownerId) {
         Alert.alert('แจ้งเตือน', 'คุณไม่สามารถเจรจากับประกาศของตัวเองได้');
         return;
    }

    // ตั้งค่าเริ่มต้นใน Modal
    // ราคา: ใช้ราคาจากประกาศ หรือราคาที่เคยเสนอไว้
    setOfferPrice(productData.requestedPrice ? productData.requestedPrice.toString() : '');
    // น้ำหนัก: ใช้ปริมาณจากประกาศ หรือปริมาณที่เคยเสนอไว้
    setOfferAmount(productData.amountKg ? productData.amountKg.toString() : '');

    setIsOfferModalVisible(true);
  };

  // คำนวณข้อมูลแสดงผล
  const getDisplayData = () => {
    if (negotiationData) {
      return {
        title: `ข้อเสนอจาก ${negotiationData.negotiatorName || 'คู่ค้า'}`,
        status: negotiationData.status || 'กำลังเจรจา',
        price: negotiationData.offeredPrice ?? negotiationData.requestedPrice ?? 0,
        amount: negotiationData.amountKg ?? 0,
        isNegotiation: true,
        isOwner: currentUserId === negotiationData.factoryId // เจ้าของคือโรงงาน (ในมุมมอง Negotiation)
      };
    } else {
      return {
        title: 'รายละเอียดประกาศ',
        status: productData.status || 'เปิดรับข้อเสนอ',
        price: productData.requestedPrice ?? 0,
        amount: productData.amountKg ?? 0,
        isNegotiation: false,
        isOwner: currentUserId === productData.ownerId
      };
    }
  };

  const displayData = getDisplayData();

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
        <View style={styles.headerImage}>
          <Ionicons 
            name={displayData.isNegotiation ? "chatbubbles-outline" : "leaf-outline"} 
            size={80} 
            color="#E0E0E0" 
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: getGradeColor(productData.grade || '-') }]}>
              <Text style={styles.badgeText}>เกรด {productData.grade || '-'}</Text>
            </View>
            <Text style={styles.dateText}>สถานะ: {displayData.status}</Text>
          </View>

          <Text style={styles.title}>{displayData.title}</Text>
          
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>รายละเอียดข้อเสนอ</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
                <View>
                    <Text style={styles.detailLabel}>ราคา</Text>
                    <Text style={styles.priceValue}>
                        {Number(displayData.price).toFixed(2)} <Text style={styles.unit}>บาท/กก.</Text>
                    </Text>
                </View>
                <View>
                    <Text style={styles.detailLabel}>ปริมาณ</Text>
                    <Text style={styles.priceValue}>
                        {Number(displayData.amount).toLocaleString()} <Text style={styles.unit}>กก.</Text>
                    </Text>
                </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ข้อมูลประกาศต้นทาง</Text>
            <Text style={styles.description}>
              {productData.details || "ไม่มีรายละเอียดเพิ่มเติม"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalInfo}>
           <Text style={styles.totalLabel}>มูลค่ารวม</Text>
           <Text style={styles.totalValue}>
             {(Number(displayData.amount) * Number(displayData.price)).toLocaleString()} บาท
           </Text>
        </View>
        
        {!displayData.isNegotiation && !displayData.isOwner ? (
             <TouchableOpacity 
                style={[styles.dealButton, { backgroundColor: '#0D6EfD' }]} 
                onPress={handleDealAction}
            >
               <Ionicons name="pricetag-outline" size={20} color="#FFF" style={{marginRight: 8}}/>
               {/* เปลี่ยนข้อความปุ่มตาม Role */}
               <Text style={styles.dealButtonText}>
                   {userRole === 'farmer' ? 'เสนอราคาขาย' : 'เสนอรับซื้อ'}
               </Text>
            </TouchableOpacity>
        ) : (
             <TouchableOpacity 
                style={[styles.dealButton, { backgroundColor: '#E0E0E0' }]} 
                disabled={true}
            >
               <Text style={[styles.dealButtonText, {color: '#888'}]}>
                   {displayData.status === 'open' ? 'รอการตอบรับ' : 'ดำเนินการอยู่'}
               </Text>
            </TouchableOpacity>
        )}
      </View>

      {/* ✅ Modal ที่ปรับปรุงตาม Role */}
      <Modal
            animationType="slide"
            transparent={true}
            visible={isOfferModalVisible}
            onRequestClose={() => setIsOfferModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {userRole === 'farmer' ? 'ระบุราคาที่ต้องการขาย' : 'ระบุน้ำหนักที่ต้องการรับซื้อ'}
                    </Text>
                    
                    {/* Input 1: ปริมาณ (Buyer เน้นช่องนี้) */}
                    <Text style={styles.inputLabel}>ปริมาณ (กก.): {userRole === 'buyer' && <Text style={{color:'red'}}>*</Text>}</Text>
                    <TextInput
                        style={[styles.input, userRole === 'buyer' && {borderColor: '#0D6EfD', borderWidth: 2}]}
                        onChangeText={setOfferAmount}
                        value={offerAmount}
                        keyboardType="numeric"
                        placeholder="ระบุน้ำหนัก"
                    />
                    
                    {/* Input 2: ราคา (Farmer เน้นช่องนี้) */}
                    <Text style={styles.inputLabel}>ราคา (บาท/กก.): {userRole === 'farmer' && <Text style={{color:'red'}}>*</Text>}</Text>
                    <TextInput
                        style={[styles.input, userRole === 'farmer' && {borderColor: '#1E9E4F', borderWidth: 2}]}
                        onChangeText={setOfferPrice}
                        value={offerPrice}
                        keyboardType="numeric"
                        placeholder="ระบุราคา"
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
                            onPress={handleStartNegotiation}
                        >
                            <Text style={styles.modalButtonText}>ยืนยันส่งข้อเสนอ</Text>
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
  headerImage: { height: 150, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#fff', fontWeight: 'bold' },
  dateText: { color: '#555', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  priceBox: { backgroundColor: '#F0F9F4', padding: 15, borderRadius: 12, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#1E9E4F' },
  priceLabel: { color: '#1E9E4F', fontSize: 14, fontWeight: 'bold' },
  priceValue: { color: '#333', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  unit: { fontSize: 14, fontWeight: 'normal', color: '#555' },
  section: { marginBottom: 20, padding: 15, backgroundColor: '#FAFAFA', borderRadius: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#EEE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' },
  totalInfo: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#888' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#1E9E4F' },
  dealButton: { 
        backgroundColor: '#1E9E4F', 
        flexDirection: 'row', 
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        borderRadius: 30, 
        alignItems: 'center',
        justifyContent: 'center'
    },
  dealButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContainer: { width: '90%', backgroundColor: 'white', borderRadius: 15, padding: 25, elevation: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'center' },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 5, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, textAlign: 'center' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { padding: 12, borderRadius: 8, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  cancelModalButton: { backgroundColor: '#9E9E9E' },
  confirmModalButton: { backgroundColor: '#0D6EfD' },
  modalButtonText: { color: 'white', fontWeight: 'bold' }
});