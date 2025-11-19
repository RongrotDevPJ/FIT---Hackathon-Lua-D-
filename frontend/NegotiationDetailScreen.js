import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator,
  TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';

export default function NegotiationDetailScreen({ route, navigation }) {
  const { negotiation, order, item } = route.params || {};

  // รวมข้อมูล Negotiation และ Order
  const negotiationData = negotiation || (item && (item.offeredPrice !== undefined || item.status === 'negotiating') ? item : null);
  const productData = order || (item && !negotiationData ? item : item) || {};

  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserToken, setCurrentUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // State สำหรับ Modal
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState(''); 
  const [offerPrice, setOfferPrice] = useState(''); 

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken'); 
      const role = await AsyncStorage.getItem('userRole');
      
      setCurrentUserId(id);
      setCurrentUserToken(token); 
      setUserRole(role);
    };
    loadUser();
  }, []);

  // --- API Functions ---
  const updateNegotiationStatus = async (newStatus) => {
    if (!negotiationData || !negotiationData.id) return;
    setLoading(true);
    try {
      const apiUrl = `${API_BASE_URL}/orderApi/negotiations/${negotiationData.id}`;
      const response = await fetch(apiUrl, {
        method: 'PUT', 
        headers: {
          'Authorization': `Bearer ${currentUserToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (response.ok) {
        Alert.alert("สำเร็จ", `ดำเนินการเรียบร้อยแล้ว`, [
          { text: "ตกลง", onPress: () => navigation.navigate('OffersTab') }
        ]);
      } else {
        Alert.alert("ข้อผิดพลาด", result.error || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNegotiation = async () => {
    if (!currentUserId || !currentUserToken) {
        Alert.alert("ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อนดำเนินการ");
        return;
    }
    const amount = parseFloat(offerAmount);
    const price = parseFloat(offerPrice);
    
    if (isNaN(amount) || amount <= 0) { Alert.alert("แจ้งเตือน", "กรุณาระบุน้ำหนัก"); return; }
    if (isNaN(price) || price <= 0) { Alert.alert("แจ้งเตือน", "กรุณาระบุราคา"); return; }

    setLoading(true);
    setIsOfferModalVisible(false);

    try {
        // ใช้ orderId จาก negotiation เดิม หรือจาก productData
        const orderId = negotiationData?.orderId || productData.id || productData.orderId;
        const apiUrl = `${API_BASE_URL}/orderApi/orders/${orderId}/negotiations`;
        
        const payload = {
            actorId: currentUserId,
            offeredPrice: price, 
            amountKg: amount,
            // ถ้ามี negotiationId เดิม ให้ส่งไปด้วย (เพื่อให้ Backend รู้ว่าเป็นการต่อรองจากอันเดิม ถ้า Backend รองรับ)
            // หรือปกติการ POST ใหม่จะสร้าง record ใหม่ที่อ้างอิง orderId เดิม
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${currentUserToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        if (response.ok) {
            Alert.alert("ส่งข้อเสนอแล้ว", "ข้อเสนอใหม่ของคุณถูกส่งไปแล้ว", [{ text: "ตกลง", onPress: () => navigation.navigate('OffersTab') }]);
        } else {
            const result = await response.json();
            Alert.alert('ข้อผิดพลาด', result.error || 'ไม่สามารถส่งข้อเสนอได้');
        }
    } catch (e) {
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
        setLoading(false);
    }
  };

  // --- Handler Buttons ---
  const handleAcceptOffer = () => {
    Alert.alert("ยืนยันการตกลง", "คุณต้องการยอมรับข้อเสนอนี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ยืนยัน", onPress: () => updateNegotiationStatus('accepted') }
    ]);
  };

  const handleRejectOffer = () => {
    Alert.alert("ปฏิเสธข้อเสนอ", "คุณต้องการปฏิเสธข้อเสนอนี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ปฏิเสธ", style: "destructive", onPress: () => updateNegotiationStatus('rejected') }
    ]);
  };

  const handleNegotiateAction = () => {
    // ดึงค่าปัจจุบันมาใส่ใน Modal เพื่อให้แก้ไขต่อได้ง่าย
    const currentPrice = displayData.price;
    const currentAmount = displayData.amount;

    setOfferPrice(currentPrice ? currentPrice.toString() : '');
    setOfferAmount(currentAmount ? currentAmount.toString() : '');
    setIsOfferModalVisible(true);
  };

  // --- Display Data Calculation ---
  const getDisplayData = () => {
    // คนที่มีสิทธิ์กดปุ่ม คือ เจ้าของโพสต์ (OwnerId) หรือ คนที่ได้รับข้อเสนอ (ถ้า Backend ระบุ lastSide)
    // ในที่นี้ใช้ Logic ง่ายๆ: ถ้าฉันเป็น owner ของ order นี้ แสดงว่าคนอื่นมาเสนอ -> ฉันต้องกดรับ
    // หรือถ้าฉันเป็น factory แล้วมี negotiation ที่ farmer สร้าง -> ฉันต้องกดรับ
    
    // Logic: ใครคือเจ้าของ Order นี้?
    const isOrderOwner = currentUserId === productData.ownerId;
    
    // กรณี Negotiation Exists
    if (negotiationData) {
        return {
            title: `ข้อเสนอจาก ${negotiationData.negotiatorName || 'คู่ค้า'}`,
            status: negotiationData.status || 'กำลังเจรจา',
            price: negotiationData.offeredPrice ?? negotiationData.requestedPrice ?? 0,
            amount: negotiationData.amountKg ?? 0,
            isNegotiation: true,
            // ถ้าฉันเป็นเจ้าของ Order ต้นทาง ฉันคือคนตัดสินใจ (Decision Maker)
            // หรือถ้าฉันไม่ได้เป็นคนสร้าง negotiation นี้ (ป้องกันตัวเองกดรับของตัวเอง)
            isDecisionMaker: isOrderOwner || (negotiationData.actorId && negotiationData.actorId !== currentUserId)
        };
    } else {
        // กรณีเป็นหน้า Order (ยังไม่มี Negotiation)
        return {
            title: 'รายละเอียดประกาศ',
            status: productData.status || 'เปิดรับข้อเสนอ',
            price: productData.requestedPrice ?? 0,
            amount: productData.amountKg ?? 0,
            isNegotiation: false,
            isDecisionMaker: false // ยังไม่มีใครเสนอมา
        };
    }
  };

  const displayData = getDisplayData();
  const getGradeColor = (g) => {
    switch(g) { case 'AA': return '#D32F2F'; case 'A': return '#1E9E4F'; case 'B': return '#0D6EfD'; default: return '#888'; }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerImage}>
          <Ionicons name="chatbubbles-outline" size={80} color="#E0E0E0" />
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
            <View style={styles.detailRow}>
                <View style={{flex:1}}>
                    <Text style={styles.detailLabel}>ราคาเสนอ</Text>
                    <Text style={styles.priceValue}>{Number(displayData.price).toFixed(2)} <Text style={styles.unit}>บาท/กก.</Text></Text>
                </View>
                <View style={{flex:1, alignItems:'flex-end'}}>
                    <Text style={styles.detailLabel}>ปริมาณ</Text>
                    <Text style={styles.priceValue}>{Number(displayData.amount).toLocaleString()} <Text style={styles.unit}>กก.</Text></Text>
                </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>รายละเอียดสินค้า</Text>
            <Text style={styles.description}>{productData.details || "ไม่มีรายละเอียดเพิ่มเติม"}</Text>
          </View>
        </View>
      </ScrollView>

      {/* --- Footer Actions --- */}
      <View style={styles.footer}>
        <View style={styles.totalInfo}>
           <Text style={styles.totalLabel}>มูลค่ารวม</Text>
           <Text style={styles.totalValue}>{(Number(displayData.amount) * Number(displayData.price)).toLocaleString()} บาท</Text>
        </View>
        
        {loading ? (
            <ActivityIndicator size="small" color="#1E9E4F" style={{flex: 1}} />
        ) : (
            <>
                {/* กรณี 1: เจ้าของประกาศ (Decision Maker) เห็น 3 ปุ่ม: ปฏิเสธ / ต่อรอง / ยอมรับ */}
                {displayData.isNegotiation && displayData.status === 'open' && displayData.isDecisionMaker ? (
                    <View style={styles.actionButtonsContainer}>
                        {/* ปุ่มปฏิเสธ */}
                        <TouchableOpacity style={[styles.iconButton, styles.rejectButton]} onPress={handleRejectOffer}>
                            <Ionicons name="close" size={24} color="#D32F2F" />
                            <Text style={[styles.iconButtonText, {color: '#D32F2F'}]}>ปฏิเสธ</Text>
                        </TouchableOpacity>

                        {/* ปุ่มต่อรอง (ตรงกลาง) */}
                        <TouchableOpacity style={[styles.iconButton, styles.negotiateButton]} onPress={handleNegotiateAction}>
                            <Ionicons name="swap-horizontal" size={24} color="#FFF" />
                            <Text style={styles.iconButtonText}>ต่อรอง</Text>
                        </TouchableOpacity>

                        {/* ปุ่มยอมรับ */}
                        <TouchableOpacity style={[styles.iconButton, styles.acceptButton]} onPress={handleAcceptOffer}>
                            <Ionicons name="checkmark" size={24} color="#FFF" />
                            <Text style={styles.iconButtonText}>ยอมรับ</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // กรณี 2: ถ้าไม่ใช่ Decision Maker หรือยังไม่มีดีล -> ปุ่มเสนอราคาปกติ หรือ ปุ่มรอ
                    !displayData.isNegotiation ? (
                         <TouchableOpacity style={[styles.dealButton, { backgroundColor: '#0D6EfD' }]} onPress={handleNegotiateAction}>
                            <Text style={styles.dealButtonText}>
                                {userRole === 'farmer' ? 'เสนอราคาขาย' : 'เสนอรับซื้อ'}
                            </Text>
                         </TouchableOpacity>
                    ) : (
                        // กรณีรอผล
                         <TouchableOpacity style={[styles.dealButton, { backgroundColor: '#E0E0E0' }]} disabled={true}>
                            <Text style={[styles.dealButtonText, {color: '#888'}]}>
                                {displayData.status === 'open' ? 'รอการตอบรับ' : `สถานะ: ${displayData.status}`}
                            </Text>
                        </TouchableOpacity>
                    )
                )}
            </>
        )}
      </View>

      {/* --- Modal ต่อรอง --- */}
      <Modal animationType="slide" transparent={true} visible={isOfferModalVisible} onRequestClose={() => setIsOfferModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {userRole === 'farmer' ? 'ต่อรองราคาขาย' : 'ต่อรองปริมาณรับซื้อ'}
                    </Text>
                    
                    {/* Input 1: ปริมาณ (Buyer แก้ได้, Farmer เห็นแต่แก้ไม่ได้) */}
                    <Text style={styles.inputLabel}>ปริมาณ (กก.):</Text>
                    <TextInput
                        style={[styles.input, userRole !== 'buyer' && styles.disabledInput]}
                        onChangeText={setOfferAmount} 
                        value={offerAmount} 
                        keyboardType="numeric" 
                        placeholder="ระบุน้ำหนัก"
                        editable={userRole === 'buyer'} // ✅ Buyer แก้ได้คนเดียว
                    />
                    
                    {/* Input 2: ราคา (Farmer แก้ได้, Buyer เห็นแต่แก้ไม่ได้) */}
                    <Text style={styles.inputLabel}>ราคา (บาท/กก.):</Text>
                    <TextInput
                        style={[styles.input, userRole !== 'farmer' && styles.disabledInput]}
                        onChangeText={setOfferPrice} 
                        value={offerPrice} 
                        keyboardType="numeric" 
                        placeholder="ระบุราคา"
                        editable={userRole === 'farmer'} // ✅ Farmer แก้ได้คนเดียว
                    />
                    
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setIsOfferModalVisible(false)}>
                            <Text style={styles.modalButtonText}>ยกเลิก</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.confirmModalButton]} onPress={handleStartNegotiation}>
                            <Text style={styles.modalButtonText}>ส่งข้อเสนอ</Text>
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
  headerImage: { height: 140, backgroundColor: '#F9F9F9', justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#fff', fontWeight: 'bold' },
  dateText: { color: '#555', fontSize: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  
  priceBox: { backgroundColor: '#F0F9F4', padding: 15, borderRadius: 12, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#1E9E4F' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  priceValue: { color: '#333', fontSize: 20, fontWeight: 'bold' },
  unit: { fontSize: 14, fontWeight: 'normal', color: '#555' },
  
  section: { marginBottom: 20, padding: 15, backgroundColor: '#FAFAFA', borderRadius: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  
  footer: { padding: 15, borderTopWidth: 1, borderTopColor: '#EEE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' },
  totalInfo: { flex: 0.8 },
  totalLabel: { fontSize: 12, color: '#888' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1E9E4F' },

  // ปุ่ม 3 ปุ่ม (Reject / Negotiate / Accept)
  actionButtonsContainer: { flexDirection: 'row', flex: 1.5, justifyContent: 'flex-end', gap: 8 },
  iconButton: { 
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, minWidth: 60
  },
  rejectButton: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#EF5350' },
  negotiateButton: { backgroundColor: '#2196F3' }, // สีฟ้า
  acceptButton: { backgroundColor: '#4CAF50' }, // สีเขียว
  iconButtonText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  
  dealButton: { backgroundColor: '#1E9E4F', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, flex: 1, alignItems: 'center' },
  dealButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { width: '85%', backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'center' },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 5, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15, textAlign: 'center', backgroundColor: '#FFF' },
  disabledInput: { backgroundColor: '#F0F0F0', color: '#888' }, // สไตล์ช่องที่ห้ามแก้
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { padding: 10, borderRadius: 8, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  cancelModalButton: { backgroundColor: '#9E9E9E' },
  confirmModalButton: { backgroundColor: '#0D6EfD' },
  modalButtonText: { color: 'white', fontWeight: 'bold' }
});