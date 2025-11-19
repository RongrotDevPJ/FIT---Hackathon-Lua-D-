import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator,
  Platform,
  // ✅ [FIX]: เพิ่ม Modal และ TextInput สำหรับ Modal กรอกราคาสวนกลับ
  Modal, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';

export default function NegotiationDetailScreen({ route, navigation }) {
  const { negotiationId } = route.params;
  
  const [negotiation, setNegotiation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserToken, setCurrentUserToken] = useState(null);
  // ⚠️ ID ผู้ใช้จริงที่ดึงมาจาก AsyncStorage
  const [currentUserId, setCurrentUserId] = useState(null); 

  // ✅ [NEW]: State สำหรับควบคุม Modal และ Input
  const [isCounterModalVisible, setIsCounterModalVisible] = useState(false);
  const [newCounterPrice, setNewCounterPrice] = useState('');
  const [newCounterAmount, setNewCounterAmount] = useState(''); // ✅ [NEW] State สำหรับน้ำหนัก


  useEffect(() => {
    const loadData = async () => {
        const token = await AsyncStorage.getItem('userToken');
        setCurrentUserToken(token);
        
        // สมมติว่า ID ผู้ใช้ถูกเก็บไว้ใน AsyncStorage ด้วยคีย์ 'userId'
        const storedUserId = await AsyncStorage.getItem('userId');
        setCurrentUserId(storedUserId);

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

// ----------------------------------------------------------------------
// ✅ [MODIFIED]: handleUpdateNegotiation - แก้ URL/Method และรับ newAmountKg
// ----------------------------------------------------------------------
  const handleUpdateNegotiation = async (action, newPrice = undefined, newAmountKg = undefined) => {
    if (!currentUserToken || !currentUserId) return;
    if (negotiation.status !== 'open') return;

    if (action === 'negotiating' && (newPrice === undefined || newPrice <= 0)) {
        Alert.alert("ข้อผิดพลาด", "กรุณาระบุราคาที่ถูกต้องสำหรับการต่อรอง");
        return;
    }

    setLoading(true);

    try {
        // ✅ URL/Method ถูกต้อง (PUT /negotiations/:id)
        const apiUrl = `${API_BASE_URL}/orderApi/negotiations/${negotiationId}`; 
        
        const payload = {
            actorId: currentUserId,
            action: action, 
            newPrice: newPrice, 
            newAmountKg: newAmountKg, // ✅ ส่ง amountKg
        };

        const response = await fetch(apiUrl, {
            method: 'PUT', 
            headers: { 
                'Authorization': `Bearer ${currentUserToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // ✅ ปรับปรุงการจัดการ Error เพื่อแก้ TypeError: Already read
        const responseBodyText = await response.text();
        
        if (!response.ok) {
            console.error("API Call Failed with Status:", response.status);
            
            let errorDetails = `HTTP สถานะ: ${response.status}`;
            try {
                const result = JSON.parse(responseBodyText);
                errorDetails += `. ข้อผิดพลาด: ${result.error || JSON.stringify(result)}`;
            } catch (e) {
                errorDetails += `. ข้อความ Server: ${responseBodyText.slice(0, 100)}...`;
            }
            
            Alert.alert('ข้อผิดพลาดการดำเนินการ', errorDetails);
            return;
        }

        const result = JSON.parse(responseBodyText);
        
        Alert.alert("สำเร็จ", `ดำเนินการ ${action} เรียบร้อยแล้ว`, [
            { text: "OK", onPress: () => fetchNegotiationDetail(currentUserToken) }
        ]);

    } catch (e) {
        console.error("Network Error:", e);
        Alert.alert('ข้อผิดพลาดเครือข่าย', `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้. (รายละเอียด: ${e.message})`);
    } finally {
        setLoading(false);
    }
  };

// ----------------------------------------------------------------------
// ✅ [MODIFIED]: handleCounterOffer - ตั้งค่า State ทั้งราคาและปริมาณ
// ----------------------------------------------------------------------
  const handleCounterOffer = () => {
      // ตั้งค่าราคาเริ่มต้นจากราคาล่าสุดที่ถูกเสนอมา
      setNewCounterPrice(negotiation.offeredPrice.toString()); 
      // ตั้งค่าปริมาณเริ่มต้นจากปริมาณล่าสุดที่ถูกเสนอมา (ใช้ใน Modal)
      setNewCounterAmount(negotiation.amountKg ? negotiation.amountKg.toString() : ''); 
      setIsCounterModalVisible(true);
  };

// ✅ [MODIFIED]: submitCounterOffer - ตรวจสอบและส่งค่า amount ตามบทบาท
  const submitCounterOffer = () => {
      const price = parseFloat(newCounterPrice);
      const isFarmer = currentUserId === negotiation.farmerId;
      
      let amountToSend = undefined;

      if (isNaN(price) || price <= 0) {
          Alert.alert("ข้อผิดพลาด", "กรุณาระบุราคาที่ถูกต้อง");
          return;
      }
      
      if (!isFarmer) {
          // ถ้าเป็น Factory: ต้องส่งน้ำหนักใหม่ (บังคับให้กรอก)
          const amount = parseFloat(newCounterAmount);
          if (isNaN(amount) || amount <= 0) {
              Alert.alert("ข้อผิดพลาด", "กรุณาระบุน้ำหนักที่ถูกต้อง");
              return;
          }
          amountToSend = amount;
      } else {
          // ถ้าเป็น Farmer: ส่งน้ำหนักเดิมกลับไป (Backend จะตรวจสอบว่าน้ำหนักไม่เปลี่ยน)
          amountToSend = negotiation.amountKg;
      }

      setIsCounterModalVisible(false); // ปิด Modal
      handleUpdateNegotiation('negotiating', price, amountToSend); // ✅ ส่ง amountToSend
  };


// ----------------------------------------------------------------------
// [EXISTING]: Logic สำหรับแสดงปุ่มดำเนินการ
// ----------------------------------------------------------------------
  const renderActionButtons = () => {
    if (negotiation.status !== 'open') {
        return <Text style={styles.completedText}>การเจรจาสิ้นสุดแล้ว ({negotiation.status.toUpperCase()})</Text>;
    }
    
    if (!currentUserId) {
        return <Text style={styles.waitingText}>กำลังโหลดข้อมูลผู้ใช้...</Text>;
    }

    // ตรวจสอบบทบาทผู้ใช้
    const isFarmer = currentUserId === negotiation.farmerId;
    const isFactory = currentUserId === negotiation.factoryId;
    
    // ตรวจสอบว่าใครเสนอราคารอบล่าสุด
    const lastSide = negotiation.lastSide; // 'factory' หรือ 'farmer'
    const mySide = isFarmer ? 'farmer' : 'factory';
    const isMyLastOffer = lastSide === mySide;

    if (isMyLastOffer) {
        // ฉันเสนอราคาไปแล้ว → รออีกฝ่ายตอบกลับ
        return (
            <View style={styles.actionButtonContainer}>
                <Text style={styles.waitingText}>
                    <Ionicons name="timer-outline" size={16} color="#007BFF" /> 
                    <Text style={{fontWeight: 'bold'}}> รอการตอบกลับจาก {isFarmer ? 'โรงงาน' : 'เกษตรกร'}...</Text>
                    {"\n"}
                    <Text style={{fontSize: 12, color: '#888'}}>ราคาที่คุณเสนอ: {Number(negotiation.offeredPrice).toFixed(2)} บาท/กก.</Text>
                </Text>
            </View>
        );
    } else {
        // อีกฝ่ายเสนอราคามา → ฉันสามารถ ตอบรับ/ปฏิเสธ/สวนกลับได้
        return (
            <View style={styles.actionButtonContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]} 
                    onPress={() => handleUpdateNegotiation('accepted')}
                >
                    <Text style={styles.actionButtonText}>ตอบรับ</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionButton, styles.counterButton]} 
                    onPress={handleCounterOffer}
                >
                    <Text style={[styles.actionButtonText, { color: '#007BFF' }]}>เสนอราคาสวนกลับ</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]} 
                    onPress={() => handleUpdateNegotiation('rejected')}
                >
                    <Text style={styles.actionButtonText}>ปฏิเสธ</Text>
                </TouchableOpacity>
            </View>
        );
    }
  };


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
  const isAccepted = negotiation.status === 'accepted';
  const isFarmer = currentUserId === negotiation.farmerId;
  const isFactory = currentUserId === negotiation.factoryId;


  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* ✅ [NEW]: Counter Offer Modal Component */}
      <Modal
          animationType="slide"
          transparent={true}
          visible={isCounterModalVisible}
          onRequestClose={() => setIsCounterModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>เสนอราคาสวนกลับ</Text>
                  <Text style={styles.modalText}>กรุณาระบุราคาและน้ำหนักใหม่</Text>
                  
                  {/* Input ราคา (ทุกคนต้องกรอก) */}
                  <TextInput
                      style={styles.input}
                      onChangeText={setNewCounterPrice}
                      value={newCounterPrice}
                      keyboardType="numeric"
                      placeholder="ราคาใหม่ (บาท/กก.)"
                      placeholderTextColor="#999"
                  />
                  
                  {/* ✅ [NEW LOGIC]: Input น้ำหนัก - แสดงเฉพาะ Factory */}
                  {isFactory ? (
                      <TextInput
                          style={styles.input}
                          onChangeText={setNewCounterAmount}
                          value={newCounterAmount}
                          keyboardType="numeric"
                          placeholder="น้ำหนักใหม่ (กก.)"
                          placeholderTextColor="#999"
                      />
                  ) : (
                      <Text style={[styles.modalText, styles.modalAmountText]}>
                          น้ำหนักคงที่: {negotiation.amountKg} กก.
                      </Text>
                  )}


                  <View style={styles.modalButtonContainer}>
                      <TouchableOpacity 
                          style={[styles.modalButton, styles.cancelModalButton]}
                          onPress={() => setIsCounterModalVisible(false)}
                      >
                          <Text style={styles.modalButtonText}>ยกเลิก</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          style={[styles.modalButton, styles.confirmModalButton]}
                          onPress={submitCounterOffer}
                      >
                          <Text style={styles.modalButtonText}>ยืนยันการเสนอราคา</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.title}>การเจรจา Order #{negotiation.orderId.slice(-6)}</Text>
        <Text style={styles.subtitle}>
            สถานะ: 
            <Text style={[styles.statusValue, isAccepted && styles.acceptedStatus]}>
                {statusText.toUpperCase()}
            </Text>
        </Text>

        <View style={[styles.priceBox, isAccepted && styles.acceptedPriceBox]}>
          <Text style={styles.priceLabel}>ราคาปัจจุบันที่เสนอ / ตกลง</Text>
          <Text style={styles.priceValue}>{Number(currentPrice).toFixed(2)} <Text style={styles.unit}>บาท/กก.</Text></Text>
        </View>

        {/* ✅ [SECTION ที่แสดง เกรด และ จำนวน] */}
        <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>เกรด:</Text>
                <Text style={styles.infoValue}>{negotiation.grade}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>จำนวน:</Text>
                <Text style={styles.infoValue}>
                    {/* ✅ แสดง amountKg ที่ดึงมา */}
                    {negotiation.amountKg ? `${negotiation.amountKg} กก.` : 'ไม่ระบุ'}
                </Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>อัปเดตล่าสุด:</Text>
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

      <View style={styles.footer}>
        {renderActionButtons()}
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
    acceptedStatus: { color: '#1E9E4F' }, 
    priceBox: { 
        backgroundColor: '#E8F5E9', 
        padding: 15, 
        borderRadius: 12, 
        marginBottom: 20, 
        borderLeftWidth: 5, 
        borderLeftColor: '#1E9E4F' 
    },
    acceptedPriceBox: { 
        backgroundColor: '#D4EDDA',
        borderLeftColor: '#00A854', 
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
    actionButtonContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        gap: 10 
    },
    actionButton: { 
        padding: 12, 
        borderRadius: 8, 
        flex: 1, 
        alignItems: 'center',
        marginHorizontal: 4,
    },
    acceptButton: { backgroundColor: '#1E9E4F' },
    counterButton: { 
        backgroundColor: '#E0F7FA', 
        borderWidth: 1, 
        borderColor: '#007BFF' 
    },
    rejectButton: { backgroundColor: '#E53935' },
    actionButtonText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    waitingText: { 
        textAlign: 'center', 
        color: '#007BFF', 
        fontSize: 14, 
        padding: 10,
        width: '100%',
    },
    completedText: {
        textAlign: 'center', 
        color: '#888', 
        fontSize: 14, 
        padding: 10
    },
    
    // ✅ [NEW] Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
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
        marginBottom: 15,
        textAlign: 'center'
    },
    modalAmountText: { // ✅ Style สำหรับข้อความน้ำหนักคงที่
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#F7F7F7',
        borderRadius: 5,
        width: '100%',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 10, // ลด margin เพื่อให้มีที่ว่างสำหรับสอง input
        textAlign: 'center'
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10, // เพิ่ม margin ด้านบน
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
        backgroundColor: '#007BFF',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});