import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from './apiConfig'; 

export default function CreateListingScreen({ navigation }) {
  // --- State for the form ---
  const [grade, setGrade] = useState(''); 
  const [amountKg, setAmountKg] = useState('');
  const [requestedPrice, setRequestedPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(''); 
  const [details, setDetails] = useState('');
  const [province, setProvince] = useState('');
  const [amphoe, setAmphoe] = useState('');
  
  // --- [ 📍 IMPORTANT: Owner ID State ] ---
  const [ownerId, setOwnerId] = useState(null); 
  const [loading, setLoading] = useState(false); 
  const [initialLoading, setInitialLoading] = useState(true);

  // --- 📍 Load User ID on mount ---
  useEffect(() => {
    const loadUserId = async () => {
        const storedId = await AsyncStorage.getItem('userId');
        if (storedId) {
            setOwnerId(storedId);
        } else {
            Alert.alert("ข้อผิดพลาด", "ไม่พบ ID ผู้ใช้ กรุณาล็อกอินใหม่");
            navigation.navigate('Login');
        }
        setInitialLoading(false);
    };
    loadUserId();
  }, []);


  const handleSubmit = async () => {
    // 📍 1. ตรวจสอบ Owner ID ก่อนโพสต์
    if (!ownerId || initialLoading) {
      Alert.alert("ข้อผิดพลาด", "กำลังโหลดข้อมูลผู้ใช้ กรุณารอสักครู่");
      return;
    }

    if (!grade || !amountKg || !requestedPrice || !deliveryDate || !province || !amphoe) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    // 📍 2. Validate Numeric inputs
    const parsedAmountKg = parseFloat(amountKg);
    const parsedRequestedPrice = parseFloat(requestedPrice);
    if (isNaN(parsedAmountKg) || parsedAmountKg <= 0 || isNaN(parsedRequestedPrice) || parsedRequestedPrice <= 0) {
        Alert.alert('ข้อมูลไม่ถูกต้อง', 'ปริมาณและราคาต้องเป็นตัวเลขที่มากกว่าศูนย์');
        return;
    }

    setLoading(true);
    
    // 📍 3. Construct the Payload ด้วย ownerId จริง
    const payload = {
        ownerId: ownerId, // <--- แก้ไขสำคัญ: ใช้ ID ผู้ใช้จริง
        type: 'sell', 
        product: 'Longan', 
        grade: grade,
        amountKg: parsedAmountKg,
        requestedPrice: parsedRequestedPrice,
        deliveryDate: deliveryDate, 
        status: 'open', 
        province: province,
        amphoe: amphoe,
        details: details || '',
    };
    
    try {
      // 📍 4. Call the API
      const response = await fetch(`${API_BASE_URL}/orderApi/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('สำเร็จ!', 'สร้างประกาศขายผลผลิตเรียบร้อยแล้ว');
        // 📍 5. แก้ไข: ใช้ goBack() เพื่อปิด Modal กลับไปหน้า HomeTab (ซึ่งจะถูกรีเฟรชอัตโนมัติ)
        navigation.goBack(); 
      } else {
        console.error("API Error Response:", result);
        Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถสร้างประกาศได้');
      }

    } catch (e) {
      console.error("Network or Submission Error:", e);
      Alert.alert('ข้อผิดพลาดเครือข่าย', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };
  
  // --- (Loading State) ---
  if (initialLoading) {
    return (
        <View style={styles.loadingFullContainer}>
            <ActivityIndicator size="large" color="#1E9E4F" />
            <Text style={styles.loadingText}>กำลังเตรียมข้อมูลผู้ใช้...</Text>
        </View>
    );
  }

  // --- (Main Render) ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>สร้างประกาศขายลำไย</Text>
        <Text style={styles.subtitle}>กรุณากรอกรายละเอียดผลผลิตที่คุณต้องการขาย</Text>

        {/* --- Grade Selection --- */}
        <Text style={styles.label}>เลือกเกรดลำไยที่ต้องการขาย</Text>
        <View style={styles.gradeContainer}>
          {['AA', 'A', 'B', 'C', 'CC'].map((g) => (
            <TouchableOpacity 
              key={g} 
              style={[
                styles.gradeButton, 
                grade === g && styles.gradeButtonActive,
                styles[`grade${g}`]
              ]}
              onPress={() => setGrade(g)}
            >
              <Text style={styles.gradeButtonText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Input Fields --- */}
        
        <Text style={styles.label}>ปริมาณ (กิโลกรัม)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="เช่น 1000"
            value={amountKg}
            onChangeText={setAmountKg}
          />
          <Text style={styles.inputSuffix}>กก.</Text>
        </View>
        
        <Text style={styles.label}>ราคาต่อรองเริ่มต้น (บาท/กก.)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="เช่น 35.00"
            value={requestedPrice}
            onChangeText={setRequestedPrice}
          />
          <Text style={styles.inputSuffix}>บ./กก.</Text>
        </View>

        <Text style={styles.label}>วันที่พร้อมส่ง</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="เช่น 15/11/2568"
            value={deliveryDate}
            onChangeText={setDeliveryDate}
          />
          <Ionicons name="calendar-outline" size={24} color="#888" style={{ paddingHorizontal: 15 }} />
        </View>

        {/* --- Province/Amphoe --- */}
        <Text style={styles.label}>จังหวัด</Text>
        <TextInput
          style={styles.inputSingle}
          placeholder="เช่น เชียงใหม่"
          value={province}
          onChangeText={setProvince}
        />
        <Text style={styles.label}>อำเภอ</Text>
        <TextInput
          style={styles.inputSingle}
          placeholder="เช่น ฝาง"
          value={amphoe}
          onChangeText={setAmphoe}
        />

        <Text style={styles.label}>รายละเอียดเพิ่มเติม (ไม่บังคับ)</Text>
        <TextInput
          style={[styles.inputSingle, styles.inputMultiline]}
          placeholder="ลักษณะพิเศษของผลผลิต, เงื่อนไขการรับซื้อ ฯลฯ"
          multiline
          value={details}
          onChangeText={setDetails}
        />

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={loading || initialLoading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>ประกาศขายผลผลิต</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { padding: 20, paddingBottom: 50 },
  loadingFullContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  label: { fontSize: 14, color: '#555', marginTop: 15, marginBottom: 5, fontWeight: '600' },
  
  gradeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  gradeButton: {
    // 📍 ปรับ flex ให้พอดีกับ 5 ปุ่ม
    flex: 1, 
    height: 60,
    marginHorizontal: 4,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  gradeButtonActive: { borderWidth: 3, borderColor: '#1E9E4F' },
  gradeAA: { backgroundColor: '#FBE8E8' }, 
  gradeA:  { backgroundColor: '#E8F5E9' }, 
  gradeB:  { backgroundColor: '#E0F7FF' }, 
  gradeC:  { backgroundColor: '#FFFDE7' }, 
  gradeCC: { backgroundColor: '#F0F0F0' }, // เพิ่ม Style สำหรับ CC
  gradeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  input: { flex: 1, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 15 : 12, fontSize: 16, color: '#333' },
  inputSingle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    fontSize: 16,
    color: '#333'
  },
  inputMultiline: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
  inputSuffix: { fontSize: 16, color: '#888', paddingHorizontal: 15 },

  submitButton: {
    backgroundColor: '#1E9E4F',
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 30,
    alignItems: 'center',
    shadowColor: '#1E9E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});พ