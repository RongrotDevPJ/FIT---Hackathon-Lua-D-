import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert,
  ActivityIndicator // [ 📍 1. Import ตัวหมุนๆ ]
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

// [ 📍 2. ตั้งค่า API URL ]
// (แก้ URL นี้ให้เป็น URL ของ Backend API ที่คุณรันไว้)
const API_BASE_URL = 'http://10.0.2.2:5001/lua-database/us-central1/api';

export default function CreateBidScreen({ navigation }) {
  // --- State สำหรับฟอร์ม (เหมือนเดิม) ---
  const [grade, setGrade] = useState(''); 
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState(''); 
  const [deliveryDate, setDeliveryDate] = useState(''); 
  const [details, setDetails] = useState('');

  // --- [ 📍 3. เพิ่ม State ที่ Backend ต้องการ ] ---
  const [province, setProvince] = useState(''); // (เราจะเพิ่มช่องกรอก)
  const [amphoe, setAmphoe] = useState('');   // (เราจะเพิ่มช่องกรอก)
  
  // (สำคัญ! ปกติ ID นี้ต้องมาจาก State ของ User ที่ Login อยู่)
  // (ตอนนี้ผมใส่ค่าปลอมไปก่อน คุณต้องไปดึง ID จริงมาใส่แทน)
  const [ownerId, setOwnerId] = useState('TEMP_BUYER_ID_67890'); 

  const [loading, setLoading] = useState(false); // (สำหรับปุ่ม)

  // --- [ 📍 4. "ผ่าตัด" handleSubmit ] ---
  const handleSubmit = async () => { // (A) เปลี่ยนเป็น async
    
    // (B) เช็คข้อมูลที่เพิ่มเข้ามาด้วย
    if (!grade || !weight || !price || !deliveryDate || !province || !amphoe) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลสำคัญ (เกรด, น้ำหนัก, ราคา, จังหวัด, อำเภอ, วันที่ต้องการ) ให้ครบถ้วน');
      return;
    }

    if (loading) return; // กันกดย้ำๆ
    setLoading(true);
    
    // (C) สร้าง "Payload"
    const payload = {
      // [ 📍 5. เปลี่ยน type เป็น "buy" ]
      type: 'buy', // <--- บอก Backend ว่านี่คือ "ประกาศรับซื้อ"
      
      ownerId: ownerId, 
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
      const response = await fetch(`${API_BASE_URL}/orders`, { // <-- Endpoint เดิม (POST /orders)
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

      // (E) ถ้าสำเร็จ (เปลี่ยนข้อความ Alert)
      Alert.alert(
          'ประกาศรับซื้อสำเร็จ', 
          'ประกาศของคุณจะถูกส่งไปยังเกษตรกรในระบบแล้ว',
          [{ text: 'ตกลง', onPress: () => navigation.goBack() }] 
      );
      
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setLoading(false); // (คืนค่าปุ่ม)
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {/* --- [ 1. กลับไป 5 เกรด (AA, A, B, C, CC) ] --- */}
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
        
        {/* === ฟิลด์ตัวเลข === */}
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

        {/* --- [ 📍 6. เพิ่มช่องกรอก จังหวัด/อำเภอ ] --- */}
        <Text style={styles.label}>จังหวัด</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น เชียงใหม่, ลำพูน" onChangeText={setProvince} value={province} />
        </View>
        <Text style={styles.label}>อำเภอ</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น เมือง, สารภี" onChangeText={setAmphoe} value={amphoe} />
        </View>

        {/* === ฟิลด์วันที่และรายละเอียด === */}
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

      {/* --- [ 📍 7. อัปเกรดปุ่ม Submit ] --- */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
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

// --- [ StyleSheet (กลับไป 5 เกรด) ] ---
const styles = StyleSheet.create({
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
  
  // --- [ 📍 8. เพิ่ม Style สำหรับปุ่มตอน Loading ] ---
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7', // (สีเขียวจางๆ)
  },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});