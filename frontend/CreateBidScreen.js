import React, { useState, useEffect } from 'react'; // <-- 1. เพิ่ม useEffect
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- 2. เพิ่ม AsyncStorage

// [ 📍 ตั้งค่า API URL (สำหรับ Web) ]
import { API_BASE_URL } from './apiConfig'; 

export default function CreateBidScreen({ navigation }) {
  // --- State สำหรับฟอร์ม ---
  const [grade, setGrade] = useState(''); 
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState(''); 
  const [deliveryDate, setDeliveryDate] = useState(''); 
  const [details, setDetails] = useState('');
  const [province, setProvince] = useState('');
  const [amphoe, setAmphoe] = useState('');   
  
  // --- [ 📍 3. แก้ไข State ของ ownerId ] ---
  const [ownerId, setOwnerId] = useState(null); // (เปลี่ยนจากค่าปลอมเป็น null)
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // (เพิ่ม State โหลด)

  // --- [ 📍 4. เพิ่ม Logic ดึง ID ผู้ใช้ ] ---
  useEffect(() => {
    const loadUserId = async () => {
        const storedId = await AsyncStorage.getItem('userId');
        if (storedId) {
            setOwnerId(storedId);
        } else {
            Alert.alert("ข้อผิดพลาด", "ไม่พบ ID ผู้ใช้ กรุณาล็อกอินใหม่");
            navigation.goBack(); // ปิด Modal กลับไป
        }
        setInitialLoading(false);
    };
    loadUserId();
  }, [navigation]);


  // --- [ 📍 5. "ผ่าตัด" handleSubmit ] ---
  const handleSubmit = async () => { 
    
    // (A) ตรวจสอบ ID จริง
    if (!ownerId || initialLoading) {
      Alert.alert("ข้อผิดพลาด", "กำลังโหลดข้อมูลผู้ใช้ กรุณารอสักครู่");
      return;
    }
    
    // (B) เช็คข้อมูล (เหมือนเดิม)
    if (!grade || !weight || !price || !deliveryDate || !province || !amphoe) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลสำคัญ (เกรด, น้ำหนัก, ราคา, จังหวัด, อำเภอ, วันที่ต้องการ) ให้ครบถ้วน');
      return;
    }

    if (loading) return; 
    setLoading(true);
    
    // (C) สร้าง "Payload" (ใช้ ownerId จริงจาก State)
    const payload = {
      type: 'buy', 
      ownerId: ownerId, // <--- 📍 (สำคัญ!)
      province: province,
      amphoe: amphoe,
      grade: grade,
      amountKg: Number(weight),       
      requestedPrice: Number(price),  
      deliveryDate: deliveryDate,     
      details: details,               
    };
    
    try {
      // (D) ยิง API (Fetch)
      const response = await fetch(`${API_BASE_URL}/orderApi/orders`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      // (E) ถ้าสำเร็จ (เหมือนเดิม)
      Alert.alert(
          'ประกาศรับซื้อสำเร็จ', 
          'ประกาศของคุณจะถูกส่งไปยังเกษตรกรในระบบแล้ว',
          [{ text: 'ตกลง', onPress: () => navigation.goBack() }] 
      );
      
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setLoading(false); 
    }
  };

  // --- [ 📍 6. เพิ่มหน้า Loading ] ---
  if (initialLoading) {
    return (
        <View style={styles.loadingFullContainer}>
            <ActivityIndicator size="large" color="#1E9E4F" />
            <Text style={styles.loadingText}>กำลังเตรียมข้อมูลผู้ใช้...</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {/* ... (ส่วน JSX ที่เหลือเหมือนเดิมทั้งหมด) ... */}
        
        <Text style={styles.label}>เกรดลำไยที่ต้องการรับซื้อ</Text>
        <View style={styles.gradeContainer}>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'AA' && styles.gradeButtonActive]}
            onPress={() => setGrade('AA')}
          >
            <Text style={[styles.gradeCircle, styles.gradeAA]}>AA</Text>
            <Text style={styles.gradeText}>เกรด AA</Text>
            <Text style={styles.gradeSubText}>พรีเมี่ยม</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'A' && styles.gradeButtonActive]}
            onPress={() => setGrade('A')}
          >
            <Text style={[styles.gradeCircle, styles.gradeA]}>A</Text>
            <Text style={styles.gradeText}>เกรด A</Text>
            <Text style={styles.gradeSubText}>คุณภาพดี</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'B' && styles.gradeButtonActive]}
            onPress={() => setGrade('B')}
          >
            <Text style={[styles.gradeCircle, styles.gradeB]}>B</Text>
            <Text style={styles.gradeText}>เกรด B</Text>
            <Text style={styles.gradeSubText}>มาตรฐานทั่วไป</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'C' && styles.gradeButtonActive]}
            onPress={() => setGrade('C')}
          >
            <Text style={[styles.gradeCircle, styles.gradeC]}>C</Text>
            <Text style={styles.gradeText}>เกรด C</Text>
            <Text style={styles.gradeSubText}>คุณภาพรอง</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'CC' && styles.gradeButtonActive]}
            onPress={() => setGrade('CC')}
          >
            <Text style={[styles.gradeCircle, styles.gradeCC]}>CC</Text>
            <Text style={styles.gradeText}>เกรด CC</Text>
            <Text style={styles.gradeSubText}>ลำไยร่วง/คละ</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>น้ำหนักที่ต้องการรับซื้อ (กก.)</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="จำนวนเป็นกิโลกรัม" keyboardType="numeric" onChangeText={setWeight} value={weight} />
          <Text style={styles.inputSuffix}>กก.</Text>
        </View>
        <Text style={styles.label}>ราคาที่เสนอซื้อ (บาท/กก.)</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="ราคาต่อกิโลกรัม" keyboardType="numeric" onChangeText={setPrice} value={price} />
          <Text style={styles.inputSuffix}>บาท/กก.</Text>
        </View>

        <Text style={styles.label}>จังหวัด</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น เชียงใหม่, ลำพูน" onChangeText={setProvince} value={province} />
        </View>
        <Text style={styles.label}>อำเภอ</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น เมือง, สารภี" onChangeText={setAmphoe} value={amphoe} />
        </View>

        <Text style={styles.label}>วันที่ต้องการให้มาส่ง/วันที่ต้องการรับของ</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น 15/12/2568 หรือ ภายในสัปดาห์นี้" onChangeText={setDeliveryDate} value={deliveryDate} />
        </View>
        <Text style={styles.label}>รายละเอียดเพิ่มเติม</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="ระบุข้อมูลสำคัญอื่นๆ ที่เกษตรกรควรทราบ (เช่น รับเฉพาะสวนที่...)"
            onChangeText={setDetails}
            value={details}
            multiline={true}
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* --- ปุ่ม Submit (เหมือนเดิม) --- */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, (loading || initialLoading) && styles.submitButtonDisabled]} // 📍 7. แก้ไข disable
          onPress={handleSubmit}
          disabled={loading || initialLoading} // 📍 8. แก้ไข disable
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>ยืนยันการสร้างประกาศรับซื้อ</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- [ StyleSheet ] ---
const styles = StyleSheet.create({
  // 📍 9. เพิ่ม Style สำหรับ Loading
  loadingFullContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  gradeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
  },
  gradeButton: {
    width: '30%', 
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginHorizontal: '1%', 
    marginBottom: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeButtonActive: { borderColor: '#1E9E4F', backgroundColor: '#E8F5E9', elevation: 4 },
  gradeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    textAlignVertical: 'center', 
    lineHeight: Platform.OS === 'ios' ? 40 : undefined, 
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  gradeAA: { backgroundColor: '#D32F2F' }, 
  gradeA:  { backgroundColor: '#1E9E4F' }, 
  gradeB:  { backgroundColor: '#0D6EfD' }, 
  gradeC:  { backgroundColor: '#FFA000' }, 
  gradeCC: { backgroundColor: '#616161' }, 
  
  gradeText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  gradeSubText: { fontSize: 12, color: '#888' },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5, 
  },
  input: { flex: 1, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 15 : 12, fontSize: 16, color: '#333' },
  inputSuffix: { fontSize: 16, color: '#888', paddingHorizontal: 15 },
  inputMultiline: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
  footer: { backgroundColor: '#FFFFFF', padding: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, borderTopWidth: 1, borderColor: '#E0E0E0' },
  submitButton: { backgroundColor: '#1E9E4F', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7', // (สีเขียวจางๆ)
  },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});