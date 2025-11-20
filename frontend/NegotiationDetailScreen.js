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
import { useNavigation } from '@react-navigation/native';

export default function NegotiationDetailScreen({ route }) {
  const navigation = useNavigation();
  const { negotiation, order, item } = route.params || {};

  // 1. เตรียมข้อมูล Negotiation
  // ถ้ามี object 'negotiation' หรือ 'item' ที่มีสถานะเจรจา ให้ถือว่าเป็น negotiationData
  const negotiationData = negotiation || (item && (item.offeredPrice !== undefined || item.status === 'negotiating' || item.status === 'accepted' || item.status === 'open') ? item : null);
  
  // 2. เตรียมข้อมูล Product (สินค้าต้นทาง)
  // ถ้า negotiation มีข้อมูล order แนบมาด้วย (จาก backend ใหม่) ให้ใช้
  // ถ้าไม่มี ให้ใช้ order หรือ item ที่ส่งมา
  const productData = negotiationData?.order || order || item || {};
  const orderType = productData.type || 'sell'; // เช็คว่าเป็นโพสต์ 'ขาย' หรือ 'รับซื้อ'

  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserToken, setCurrentUserToken] = useState(null);
  const [userRole, setUserRole] = useState('');

  // State Modal
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState(''); 
  const [offerPrice, setOfferPrice] = useState(''); 

  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('userToken'); 
        const role = await AsyncStorage.getItem('userRole');
        
        setCurrentUserId(id);
        setCurrentUserToken(token); 
        setUserRole(role ? role.trim().toLowerCase() : '');
      } catch (e) {
        console.error("Error loading user data", e);
      }
    };
    loadUser();
  }, []);

  const handleNavigationBack = () => {
    if (userRole === 'buyer') {
        navigation.navigate('BuyerApp', { screen: 'MyBidsTab' });
    } else if (userRole === 'farmer') {
        navigation.navigate('MainApp', { screen: 'OffersTab' });
    } else {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Login'); 
        }
    }
  };

  // ✅ Helper: ฟังก์ชันแปลงตัวเลขให้ชัวร์
  const parseNumber = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
  };

  // --- Logic การอนุญาตให้แก้ไขน้ำหนัก ---
  const canEditAmount = () => {
    // ถ้าเป็น Buyer และเป็นโพสต์ขาย (Sell) -> Buyer แก้ได้ (ซื้อบางส่วน)
    if (userRole === 'buyer' && orderType === 'sell') return true;
    
    // ✅ แก้ไข: ถ้าเป็น Farmer และเป็นโพสต์รับซื้อ (Buy) -> ให้แก้ไขได้
    // เพื่อแก้ปัญหาค่าไม่ขึ้น และรองรับกรณีเกษตรกรมีของขายน้อยกว่าที่รับซื้อ
    if (userRole === 'farmer' && orderType === 'buy') return true; 

    // กรณีอื่นๆ (เช่น Farmer แก้โพสต์ขายตัวเองระหว่างต่อรอง) ปกติจะไม่ได้
    return false;
  };
  
  const isAmountEditable = canEditAmount();

  // --- API Functions ---

  const updateNegotiationStatus = async (actionType) => {
    if (!negotiationData || !negotiationData.id) return;
    if (!currentUserId) { Alert.alert("แจ้งเตือน", "กรุณาเข้าสู่ระบบ"); return; }

    setLoading(true);
    try {
      const apiUrl = `${API_BASE_URL}/orderApi/negotiations/${negotiationData.id}`;
      const payload = { action: actionType, actorId: currentUserId };

      const response = await fetch(apiUrl, {
        method: 'PUT', 
        headers: { 'Authorization': `Bearer ${currentUserToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      if (response.ok) {
        Alert.alert("สำเร็จ", "ดำเนินการเรียบร้อยแล้ว", [
          { text: "ตกลง", onPress: handleNavigationBack } 
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
    if (!currentUserId) { Alert.alert("ข้อผิดพลาด", "กรุณาเข้าสู่ระบบ"); return; }
    
    const amount = parseNumber(offerAmount);
    const price = parseNumber(offerPrice);
    
    if (amount <= 0) { Alert.alert("แจ้งเตือน", "กรุณาระบุน้ำหนักที่ถูกต้อง"); return; }
    if (price <= 0) { Alert.alert("แจ้งเตือน", "กรุณาระบุราคาที่ถูกต้อง"); return; }

    setLoading(true);
    setIsOfferModalVisible(false);

    try {
        let apiUrl, method, payload;

        if (negotiationData && negotiationData.id) {
            // ต่อรองดีลเดิม
            apiUrl = `${API_BASE_URL}/orderApi/negotiations/${negotiationData.id}`;
            method = 'PUT';
            payload = {
                action: 'negotiating',
                actorId: currentUserId,
                newPrice: price,
                newAmountKg: amount
            };
        } else {
            // เริ่มดีลใหม่
            const orderId = productData.id || productData.orderId;
            apiUrl = `${API_BASE_URL}/orderApi/orders/${orderId}/negotiations`;
            method = 'POST';
            payload = {
                actorId: currentUserId,
                offeredPrice: price, 
                amountKg: amount
            };
        }

        const response = await fetch(apiUrl, {
            method: method,
            headers: { 'Authorization': `Bearer ${currentUserToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        if (response.ok) {
            Alert.alert("สำเร็จ", "ส่งข้อเสนอเรียบร้อยแล้ว", [
                { text: "ตกลง", onPress: handleNavigationBack } 
            ]);
        } else {
            const result = await response.json();
            Alert.alert('ข้อผิดพลาด', result.error || 'ไม่สามารถส่งข้อเสนอได้');
        }
    } catch (e) {
        console.error(e);
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
        setLoading(false);
    }
  };

  const handleNegotiateAction = () => {
    const currentPrice = displayData.price ? displayData.price.toString() : '';
    
    // ✅ ดึงค่า Amount มาใส่เสมอ
    let currentAmount = displayData.amount ? displayData.amount.toString() : '';
    
    // ถ้าค่าเป็น 0 หรือว่าง หรือ undefined ให้ดึงจาก Max Amount (ของที่มีทั้งหมด) มาใส่แทน
    if (!currentAmount || currentAmount === '0' || currentAmount === 'undefined') {
         currentAmount = displayData.maxAmount ? displayData.maxAmount.toString() : '';
    }

    // Fallback สุดท้าย: ดึงจาก productData โดยตรงเผื่อ displayData ยังไม่ update
    if (!currentAmount || currentAmount === '0') {
        const directAmount = productData.amountKg || productData.amount;
        if (directAmount) currentAmount = directAmount.toString();
    }
    
    setOfferPrice(currentPrice);
    setOfferAmount(currentAmount);
    setIsOfferModalVisible(true);
  };

  const handleAcceptOffer = () => {
    const finalAmount = displayData.amount;
    const finalPrice = displayData.price;
    const total = (finalAmount * finalPrice).toLocaleString();

    Alert.alert(
        "ยืนยันดีล", 
        `ตกลงซื้อขายที่:\nน้ำหนัก ${finalAmount.toLocaleString()} กก.\nราคา ${finalPrice} บาท/กก.\nรวมเป็นเงิน ${total} บาท\n\n(ระบบจะตัดยอดสินค้าและสร้างรายการใหม่สำหรับส่วนที่เหลือ)`, 
        [
            { text: "ยกเลิก", style: "cancel" },
            { text: "ยืนยัน", onPress: () => updateNegotiationStatus('accepted') }
        ]
    );
  };

  const handleRejectOffer = () => {
    Alert.alert("ปฏิเสธข้อเสนอ", "คุณต้องการปฏิเสธข้อเสนอนี้?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ยืนยันปฏิเสธ", style: "destructive", onPress: () => updateNegotiationStatus('rejected') }
    ]);
  };

  // ✅ Logic การแสดงผลที่ปรับปรุงแล้ว
  const getDisplayData = () => {
    // 1. ดึงค่าตั้งต้นจากสินค้า (Order Original) ก่อน
    const originalAmount = parseNumber(productData.amountKg || productData.amount);
    const originalPrice = parseNumber(productData.requestedPrice || productData.price);

    if (negotiationData && negotiationData.id) {
        // --- กรณีมีดีลแล้ว ---
        const isMyTurn = negotiationData.lastSide ? (
            (userRole === 'farmer' && negotiationData.lastSide === 'factory') || 
            (userRole === 'buyer' && negotiationData.lastSide === 'farmer')
        ) : false;

        // ดึงค่าจาก Negotiation เป็นหลัก
        let dealAmount = parseNumber(negotiationData.amountKg || negotiationData.amount);
        let dealPrice = parseNumber(negotiationData.offeredPrice ?? negotiationData.price);
        
        // ✅ Fallback: ถ้าค่าใน negotiation เป็น 0 (ผิดพลาด) ให้กลับไปใช้ค่า original
        if (dealAmount === 0) dealAmount = originalAmount;
        if (dealPrice === 0) dealPrice = originalPrice;

        return {
            title: isMyTurn ? `ข้อเสนอจาก ${negotiationData.negotiatorName || 'คู่ค้า'}` : 'รายละเอียดการเจรจา',
            status: negotiationData.status || 'กำลังเจรจา',
            price: dealPrice,
            amount: dealAmount,
            maxAmount: originalAmount, // ส่งค่า Max ไปแสดงผลด้วย
            isNegotiation: true,
            isDecisionMaker: isMyTurn,
            negotiatorName: negotiationData.negotiatorName
        };
    } else {
        // --- กรณีเริ่มดีลใหม่ ---
        return {
            title: 'รายละเอียดสินค้า',
            status: 'รอข้อเสนอ',
            price: originalPrice,
            amount: originalAmount,
            maxAmount: originalAmount,
            isNegotiation: false,
            isDecisionMaker: false,
            negotiatorName: '-'
        };
    }
  };
  
  const displayData = getDisplayData();
  const totalValue = displayData.amount * displayData.price;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        
        <View style={styles.headerCard}>
           <Ionicons name="chatbubbles-outline" size={60} color="#1E9E4F" />
           <Text style={styles.headerTitle}>{displayData.title}</Text>
           <View style={[styles.statusBadge, { backgroundColor: displayData.status==='open'?'#FFF3E0':'#E8F5E9' }]}>
              <Text style={{color: displayData.status==='open'?'#FF9800':'#4CAF50', fontWeight:'bold'}}>
                  {displayData.status === 'open' ? 'สถานะ: กำลังเจรจา' : `สถานะ: ${displayData.status}`}
              </Text>
           </View>
        </View>

        <View style={styles.card}>
             {/* แสดง Stock คงเหลือ ถ้ากำลังเจรจา */}
             {displayData.isNegotiation && (
                 <View style={styles.stockInfo}>
                     <Text style={styles.stockText}>
                        สินค้าทั้งหมดในล็อตนี้: {displayData.maxAmount.toLocaleString()} กก.
                     </Text>
                 </View>
             )}

             <View style={styles.cardRow}>
                 <View style={{flex:1, alignItems:'center'}}>
                    <Text style={styles.label}>ราคาเสนอ (บาท/กก.)</Text>
                    <Text style={[styles.value, {color:'#1E9E4F'}]}>{Number(displayData.price).toFixed(2)}</Text>
                 </View>
                 <View style={{width:1, height:40, backgroundColor:'#EEE'}} />
                 <View style={{flex:1, alignItems:'center'}}>
                    <Text style={styles.label}>ปริมาณที่ซื้อขาย (กก.)</Text>
                    <Text style={styles.value}>{Number(displayData.amount).toLocaleString()}</Text>
                 </View>
             </View>
             <View style={styles.divider} />
             <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                 <Text style={styles.totalLabel}>รวมเป็นเงินทั้งสิ้น</Text>
                 <Text style={styles.totalValue}>{totalValue.toLocaleString()} บาท</Text>
             </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>รายละเอียดเพิ่มเติม</Text>
            <Text style={styles.description}>{productData.details || "ไม่มีรายละเอียดเพิ่มเติม"}</Text>
            <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={16} color="#666"/>
                <Text style={{marginLeft:5, color:'#666'}}>
                    {productData.province} {productData.amphoe ? ` - ${productData.amphoe}` : ''}
                </Text>
            </View>
            <View style={styles.gradeRow}>
                 <Text style={{color:'#888'}}>เกรดสินค้า: </Text>
                 <Text style={{fontWeight:'bold'}}>{productData.grade || '-'}</Text>
            </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        {loading ? <ActivityIndicator size="small" color="#1E9E4F" /> : (
            <>
             {displayData.isNegotiation && displayData.status === 'open' && displayData.isDecisionMaker ? (
                 <View style={styles.btnRow}>
                     <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={handleAcceptOffer}>
                         <Ionicons name="checkmark-circle" size={20} color="#FFF"/>
                         <Text style={styles.btnText}>ยอมรับดีล</Text>
                     </TouchableOpacity>

                     <TouchableOpacity style={[styles.btn, styles.btnNego]} onPress={handleNegotiateAction}>
                         <Ionicons name="create-outline" size={20} color="#FFF"/>
                         <Text style={styles.btnText}>ต่อรอง</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={handleRejectOffer}>
                         <Ionicons name="close-circle" size={20} color="#D32F2F"/>
                         <Text style={[styles.btnText, {color:'#D32F2F'}]}>ปฏิเสธ</Text>
                     </TouchableOpacity>
                 </View>
             ) : (
                 <View style={{width:'100%'}}>
                     {!displayData.isNegotiation ? (
                         <TouchableOpacity style={[styles.btn, styles.btnFull]} onPress={handleNegotiateAction}>
                            <Ionicons name="pricetag" size={20} color="#FFF" style={{marginRight:8}} />
                            <Text style={styles.btnText}>
                                {userRole === 'farmer' ? 'เสนอราคาขาย' : 'เสนอราคาซื้อ'}
                            </Text>
                         </TouchableOpacity>
                     ) : (
                        <View style={styles.waitingBox}>
                             {displayData.status === 'accepted' || displayData.status === 'matched' ? (
                                 <View style={{flexDirection:'row', alignItems:'center'}}>
                                     <Ionicons name="checkmark-done-circle" size={24} color="#4CAF50" />
                                     <Text style={{color:'#4CAF50', fontWeight:'bold', marginLeft:8}}>การซื้อขายสำเร็จ</Text>
                                 </View>
                             ) : (
                                 <View style={{flexDirection:'row', alignItems:'center'}}>
                                     <Ionicons name="time-outline" size={24} color="#888" />
                                     <Text style={{color:'#666', marginLeft:8}}>รอการตอบรับจากอีกฝ่าย...</Text>
                                 </View>
                             )}
                        </View>
                     )}
                 </View>
             )}
            </>
        )}
      </View>

      {/* Modal */}
      <Modal visible={isOfferModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                      {userRole === 'farmer' ? 'เสนอราคาขาย' : 'เสนอราคาซื้อ'}
                  </Text>
                  
                  {/* แสดงน้ำหนักที่มีทั้งหมดใน Modal */}
                  <Text style={styles.stockHint}>
                      (สินค้าทั้งหมดที่มี: {displayData.maxAmount.toLocaleString()} กก.)
                  </Text>

                  <Text style={styles.inputLabel}>ปริมาณที่ต้องการ (กก.):</Text>
                  <TextInput 
                    style={[styles.input, !isAmountEditable && styles.disabledInput]} 
                    value={offerAmount} 
                    onChangeText={setOfferAmount} 
                    keyboardType="numeric"
                    editable={isAmountEditable} 
                    placeholder="ระบุน้ำหนัก"
                  />
                  {!isAmountEditable && (
                      <Text style={styles.hint}>*น้ำหนักถูกกำหนดไว้แล้ว (แก้ไขไม่ได้)</Text>
                  )}

                  <Text style={styles.inputLabel}>ราคา (บาท/กก.):</Text>
                  <TextInput 
                    style={styles.input} 
                    value={offerPrice} 
                    onChangeText={setOfferPrice} 
                    keyboardType="numeric"
                    placeholder="ระบุราคา"
                  />

                  <View style={styles.modalBtnRow}>
                      <TouchableOpacity style={styles.modalCancel} onPress={()=>setIsOfferModalVisible(false)}>
                          <Text>ยกเลิก</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalConfirm} onPress={handleStartNegotiation}>
                          <Text style={{color:'#FFF', fontWeight:'bold'}}>ยืนยัน</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerCard: { backgroundColor: '#FFF', padding: 20, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 3 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 10, color: '#333' },
  statusBadge: { marginTop: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  card: { backgroundColor: '#FFF', margin: 15, padding: 20, borderRadius: 15, elevation: 2 },
  stockInfo: { backgroundColor: '#F0F8FF', padding: 8, borderRadius: 5, marginBottom: 15, alignItems: 'center' },
  stockText: { color: '#0056b3', fontSize: 12, fontWeight: 'bold' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: '#888', marginBottom: 5 },
  value: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  totalLabel: { fontSize: 14, color: '#555' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#1E9E4F' },
  section: { backgroundColor: '#FFF', marginHorizontal: 15, padding: 20, borderRadius: 15, marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  locationRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  gradeRow: { flexDirection: 'row', marginTop: 5, alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btn: { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnAccept: { backgroundColor: '#4CAF50' },
  btnNego: { backgroundColor: '#2196F3' },
  btnReject: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#EF9A9A' },
  btnFull: { backgroundColor: '#1E9E4F', width: '100%' },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
  waitingBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: '#F5F5F5', borderRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', padding: 25, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  stockHint: { textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 15 },
  inputLabel: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, fontSize: 16, backgroundColor: '#FAFAFA' },
  disabledInput: { backgroundColor: '#EEE', color: '#AAA' },
  hint: { fontSize: 12, color: '#D32F2F', marginTop: 3 },
  modalBtnRow: { flexDirection: 'row', marginTop: 25, justifyContent: 'space-between' },
  modalCancel: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#EEE', borderRadius: 8, marginRight: 10 },
  modalConfirm: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#1E9E4F', borderRadius: 8 }
});