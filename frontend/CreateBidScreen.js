import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

// [ 📍 ตั้งค่า API URL (สำหรับ Web) ]
import { API_BASE_URL } from './apiConfig';

export default function CreateBidScreen({ navigation }) {
  const [grade, setGrade] = useState(''); 
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState(''); 
  const [deliveryDate, setDeliveryDate] = useState(''); 
  const [details, setDetails] = useState('');

  // --- [ 📍 เพิ่ม State ที่ Backend ต้องการ ] ---
  const [province, setProvince] = useState('');
  const [amphoe, setAmphoe] = useState('');   
  
  // (สำคัญ! ใส่ ID ปลอมไปก่อน)
  const [ownerId, setOwnerId] = useState('TEMP_BUYER_ID_456'); 

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    
    if (!grade || !weight || !price || !deliveryDate || !province || !amphoe) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลสำคัญ (เกรด, น้ำหนัก, ราคา, จังหวัด, อำเภอ, วันที่ต้องการ) ให้ครบถ้วน');
      return;
    }

    if (loading) return;
    setLoading(true);
    
    const payload = {
      type: 'buy', // (นี่คือ "ประกาศรับซื้อ")
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
      // (*** แก้ไข path ตรงนี้ ***)
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {/* --- (ส่วนเลือกเกรด) --- */}
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

        {/* --- [ 📍 เพิ่มช่องกรอก จังหวัด/อำเภอ ] --- */}
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

      {/* --- (ปุ่ม Submit) --- */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>ยืนันการสร้างประกาศรับซื้อ</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- (Styles) ---
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
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});