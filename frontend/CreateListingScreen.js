import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

export default function CreateListingScreen({ navigation }) {
  // --- [1. State (กลับไป 5 เกรด)] ---
  const [grade, setGrade] = useState(''); // AA, A, B, C, CC
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(''); 
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    // --- [2. "ผ่าตัด 2 ระบบ" (Cross-platform)] ---
    if (!grade || !weight || !price || !deliveryDate) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลสำคัญ (เกรด, น้ำหนัก, ราคา, วันที่ส่งมอบ) ให้ครบถ้วน');
      return;
    }
    
    // (*** นี่คือ "โค้ดจริง" ... แต่เรายังไม่ได้ต่อท่อ API ***)
    console.log('Submitting:', { grade, weight, price, deliveryDate, details });

    if (Platform.OS === 'web') {
      window.alert('ประกาศขายสำเร็จ!\nประกาศของคุณจะถูกส่งไปยังโรงงานผู้ซื้อแล้ว');
      navigation.goBack();
    } else {
      Alert.alert(
          'ประกาศขายสำเร็จ', 
          'ประกาศของคุณจะถูกส่งไปยังโรงงานผู้ซื้อแล้ว',
          [{ text: 'ตกลง', onPress: () => navigation.goBack() }] 
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {/* --- [ 3. กลับไป 5 เกรด (AA, A, B, C, CC) ] --- */}
        <Text style={styles.label}>เลือกเกรดลำไย</Text>
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
          {/* (ช่องว่างอันที่ 6... หายไปแล้ว) */}
        </View>
        
        {/* === (ฟิลด์ที่เหลือ... เหมือนเดิม) === */}
        <Text style={styles.label}>น้ำหนักที่เสนอขาย (กก.)</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="จำนวนเป็นกิโลกรัม" keyboardType="numeric" onChangeText={setWeight} value={weight} />
          <Text style={styles.inputSuffix}>กก.</Text>
        </View>
        <Text style={styles.label}>ราคาที่ต้องการขาย (บาท/กก.)</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="ราคาต่อกิโลกรัม" keyboardType="numeric" onChangeText={setPrice} value={price} />
          <Text style={styles.inputSuffix}>บาท/กก.</Text>
        </View>
        <Text style={styles.label}>วันที่ต้องการให้รับซื้อ/วันที่คาดว่าจะเก็บเกี่ยว</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น 15/12/2568 หรือ ช่วงกลางเดือนธันวาคม" onChangeText={setDeliveryDate} value={deliveryDate} />
        </View>
        <Text style={styles.label}>รายละเอียดเพิ่มเติม</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="ระบุข้อมูลสำคัญอื่นๆ ที่ผู้ซื้อควรทราบ (เช่น สวนปลอดสาร)"
            onChangeText={setDetails}
            value={details}
            multiline={true}
            numberOfLines={4}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>ยืนยันการสร้างประกาศขาย</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- [ 4. StyleSheet (กลับไป 5 เกรด) ] ---
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
  // --- [ 5. สีเกรด (5 เกรด) ] ---
  gradeAA: { backgroundColor: '#D32F2F' }, // แดง (พรีเมี่ยม)
  gradeA:  { backgroundColor: '#1E9E4F' }, // เขียว (A)
  gradeB:  { backgroundColor: '#0D6EfD' }, // น้ำเงิน (B)
  gradeC:  { backgroundColor: '#FFA000' }, // ส้ม (C)
  gradeCC: { backgroundColor: '#616161' }, // เทา (CC)
  
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
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});