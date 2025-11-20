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

  // เตรียมข้อมูลสำหรับแสดงผล
  const negotiationData = negotiation || (item && (item.offeredPrice !== undefined || item.status === 'negotiating') ? item : null);
  // ถ้าไม่มี negotiationData ให้ใช้ item เป็น productData
  const productData = order || item || {};

  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserToken, setCurrentUserToken] = useState(null);
  const [userRole, setUserRole] = useState('');

  // State สำหรับ Modal
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
    
    // แปลงค่าและลบลูกน้ำ (,) ออกก่อนแปลงเป็นตัวเลข เพื่อป้องกัน error
    const amount = parseFloat(offerAmount.replace(/,/g, ''));
    const price = parseFloat(offerPrice.replace(/,/g, ''));
    
    if (isNaN(amount) || amount <= 0) { Alert.alert("แจ้งเตือน", "กรุณาระบุน้ำหนักที่ถูกต้อง"); return; }
    if (isNaN(price) || price <= 0) { Alert.alert("แจ้งเตือน", "กรุณาระบุราคาที่ถูกต้อง"); return; }

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

  const handleAcceptOffer = () => {
    Alert.alert("ยืนยันดีล", "เมื่อกดยืนยัน ดีลจะเสร็จสมบูรณ์ทันที", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ยืนยัน", onPress: () => updateNegotiationStatus('accepted') }
    ]);
  };

  const handleRejectOffer = () => {
    Alert.alert("ปฏิเสธข้อเสนอ", "คุณต้องการปฏิเสธข้อเสนอนี้?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ยืนยันปฏิเสธ", style: "destructive", onPress: () => updateNegotiationStatus('rejected') }
    ]);
  };

  const handleNegotiateAction = () => {
    // ดึงค่าปัจจุบันมาใส่ใน Modal (ถ้าเป็น 0 ให้ว่างไว้)
    const currentPrice = displayData.price ? displayData.price.toString() : '';
    const currentAmount = displayData.amount ? displayData.amount.toString() : '';
    
    setOfferPrice(currentPrice);
    setOfferAmount(currentAmount);
    setIsOfferModalVisible(true);
  };

  // ✅ จุดที่แก้ไข: ปรับปรุง logic การแสดงผลให้ดึงค่าจาก productData ถ้า negotiationData เป็น 0
  const getDisplayData = () => {
    if (negotiationData) {
        const isMyTurn = negotiationData.actorId !== currentUserId; 
        
        // Logic: ลองดึงค่าจากดีล (negotiation) ก่อน -> ถ้าไม่มี/เป็น 0 -> ไปดึงจากสินค้า (productData)
        let showAmount = negotiationData.amountKg || negotiationData.amount;
        if (!showAmount || showAmount === 0) {
            showAmount = productData.amountKg || productData.amount || 0;
        }

        let showPrice = negotiationData.offeredPrice ?? negotiationData.price;
        if (!showPrice || showPrice === 0) {
             showPrice = productData.requestedPrice || productData.price || 0;
        }

        return {
            title: isMyTurn ? `ข้อเสนอจาก ${negotiationData.negotiatorName || 'คู่ค้า'}` : 'ข้อเสนอของคุณ',
            status: negotiationData.status || 'กำลังเจรจา',
            price: showPrice,
            amount: showAmount,
            isNegotiation: true,
            isDecisionMaker: isMyTurn
        };
    } else {
        return {
            title: 'รายละเอียดสินค้า',
            status: 'รอข้อเสนอ',
            price: productData.requestedPrice || productData.price || 0,
            amount: productData.amountKg || productData.amount || 0,
            isNegotiation: false,
            isDecisionMaker: false
        };
    }
  };
  const displayData = getDisplayData();

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
             <View style={styles.cardRow}>
                 <View style={{flex:1, alignItems:'center'}}>
                    <Text style={styles.label}>ราคา (บาท/กก.)</Text>
                    <Text style={styles.value}>{Number(displayData.price).toFixed(2)}</Text>
                 </View>
                 <View style={{width:1, height:40, backgroundColor:'#EEE'}} />
                 <View style={{flex:1, alignItems:'center'}}>
                    <Text style={styles.label}>ปริมาณ (กก.)</Text>
                    {/* เพิ่ม toLocaleString() เพื่อให้มีลูกน้ำคั่นหลักพัน */}
                    <Text style={styles.value}>{Number(displayData.amount).toLocaleString()}</Text>
                 </View>
             </View>
             <View style={styles.divider} />
             <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                 <Text style={styles.totalLabel}>รวมเป็นเงินทั้งสิ้น</Text>
                 <Text style={styles.totalValue}>{(Number(displayData.amount) * Number(displayData.price)).toLocaleString()} บาท</Text>
             </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>รายละเอียดเพิ่มเติม</Text>
            <Text style={styles.description}>{productData.details || "ไม่มีรายละเอียด"}</Text>
            <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={16} color="#666"/>
                <Text style={{marginLeft:5, color:'#666'}}>{productData.province || '-'}</Text>
            </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        {loading ? <ActivityIndicator size="small" color="#1E9E4F" /> : (
            <>
             {displayData.isNegotiation && displayData.status !== 'accepted' && displayData.status !== 'rejected' && displayData.isDecisionMaker ? (
                 <View style={styles.btnRow}>
                     <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={handleAcceptOffer}>
                         <Ionicons name="checkmark" size={20} color="#FFF"/>
                         <Text style={styles.btnText}>ยอมรับ</Text>
                     </TouchableOpacity>

                     <TouchableOpacity style={[styles.btn, styles.btnNego]} onPress={handleNegotiateAction}>
                         <Ionicons name="swap-horizontal" size={20} color="#FFF"/>
                         <Text style={styles.btnText}>ต่อรอง</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={handleRejectOffer}>
                         <Ionicons name="close" size={20} color="#D32F2F"/>
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
                        // เช็คว่าดีลจบหรือยัง
                        (displayData.status === 'accepted' || displayData.status === 'rejected') ? (
                             <View style={[styles.waitingBox, {backgroundColor: displayData.status === 'accepted' ? '#E8F5E9' : '#FFEBEE'}]}>
                                 <Ionicons name={displayData.status === 'accepted' ? "checkmark-circle" : "close-circle"} size={24} color={displayData.status === 'accepted' ? "#4CAF50" : "#D32F2F"} />
                                 <Text style={{color: displayData.status === 'accepted' ? "#4CAF50" : "#D32F2F", marginLeft:10, fontWeight:'bold'}}>
                                    {displayData.status === 'accepted' ? 'การเจรจาสำเร็จ' : 'การเจรจาถูกปฏิเสธ'}
                                 </Text>
                             </View>
                        ) : (
                             <View style={styles.waitingBox}>
                                 <Ionicons name="time-outline" size={24} color="#888" />
                                 <Text style={{color:'#666', marginLeft:10}}>รอการตอบรับจากอีกฝ่าย...</Text>
                             </View>
                        )
                     )}
                 </View>
             )}
            </>
        )}
      </View>

      <Modal visible={isOfferModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>ยื่นข้อเสนอใหม่</Text>
                  
                  <Text style={styles.inputLabel}>ปริมาณ (กก.):</Text>
                  <TextInput 
                    style={[styles.input, userRole !== 'buyer' && styles.disabledInput]} 
                    value={offerAmount} 
                    onChangeText={setOfferAmount} 
                    keyboardType="numeric"
                    editable={userRole === 'buyer'}
                    placeholder="ระบุน้ำหนัก"
                  />
                  {userRole !== 'buyer' && <Text style={styles.hint}>*เกษตรกรแก้ไขปริมาณไม่ได้</Text>}

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
                          <Text style={{color:'#FFF', fontWeight:'bold'}}>ส่งข้อเสนอ</Text>
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: '#888', marginBottom: 5 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  totalLabel: { fontSize: 14, color: '#555' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1E9E4F' },
  section: { backgroundColor: '#FFF', marginHorizontal: 15, padding: 20, borderRadius: 15 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  locationRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnAccept: { backgroundColor: '#4CAF50' },
  btnNego: { backgroundColor: '#2196F3' },
  btnReject: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' },
  btnFull: { backgroundColor: '#1E9E4F', width: '100%' },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 5 },
  waitingBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: '#F5F5F5', borderRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', padding: 25, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputLabel: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, fontSize: 16, backgroundColor: '#FAFAFA' },
  disabledInput: { backgroundColor: '#EEE', color: '#AAA' },
  hint: { fontSize: 12, color: '#D32F2F', marginTop: 3 },
  modalBtnRow: { flexDirection: 'row', marginTop: 25, justifyContent: 'space-between' },
  modalCancel: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#EEE', borderRadius: 8, marginRight: 10 },
  modalConfirm: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#1E9E4F', borderRadius: 8 }
})