import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

export default function CreateListingScreen({ navigation }) {
  const [productName, setProductName] = useState(''); 
  const [productVariety, setProductVariety] = useState(''); 
  const [grade, setGrade] = useState(''); 
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(''); 
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!productName || !productVariety || !grade || !weight || !price || !deliveryDate) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลสำคัญ (ชื่อ, พันธุ์, เกรด, น้ำหนัก, ราคา, วันที่ส่งมอบ) ให้ครบถ้วน');
      return;
    }
    console.log('Submitting:', { productName, productVariety, grade, weight, price, deliveryDate, details });
    Alert.alert(
        'ประกาศขายสำเร็จ', 
        'ประกาศของคุณจะถูกส่งไปยังโรงงานผู้ซื้อแล้ว',
        [{ text: 'ตกลง', onPress: () => navigation.goBack() }] 
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        <Text style={styles.label}>ชื่อผลผลิต (เช่น ลำไย)</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="ชื่อสินค้าที่ต้องการขาย" onChangeText={setProductName} value={productName} />
        </View>

        <Text style={styles.label}>พันธุ์ที่ปลูก</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น อีดอ, สีชมพู, เบี้ยวเขียว" onChangeText={setProductVariety} value={productVariety} />
        </View>

        <Text style={styles.label}>เลือกเกรดลำไย</Text>
        <View style={styles.gradeContainer}>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'B' && styles.gradeButtonActive]}
            onPress={() => setGrade('B')}
          >
            <Text style={[styles.gradeCircle, styles.gradeB]}>B</Text>
            <Text style={styles.gradeText}>เกรด B</Text>
            <Text style={styles.gradeSubText}>มาตฐานทั่วไป</Text>
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
            style={[styles.gradeButton, grade === 'AA' && styles.gradeButtonActive]}
            onPress={() => setGrade('AA')}
          >
            <Text style={[styles.gradeCircle, styles.gradeAA]}>AA</Text>
            <Text style={styles.gradeText}>เกรด AA</Text>
            <Text style={styles.gradeSubText}>คุณภาพพรีเมี่ยม</Text>
          </TouchableOpacity>
        </View>
        
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

// --- [ นี่คือ StyleSheet "ฉบับเต็ม" ที่ถูกต้อง ] ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 20 },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gradeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeButtonActive: {
    borderColor: '#1E9E4F',
    backgroundColor: '#E8F5E9',
    elevation: 4,
  },
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
  gradeB: { backgroundColor: '#FFA000' }, // (B)
  gradeA: { backgroundColor: '#0D6EfD' }, // (A)
  gradeAA: { backgroundColor: '#1E9E4F' }, // (AA)
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
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    fontSize: 16,
    color: '#333',
  },
  inputSuffix: { fontSize: 16, color: '#888', paddingHorizontal: 15 },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top', 
    paddingTop: 15, 
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, 
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#1E9E4F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
});