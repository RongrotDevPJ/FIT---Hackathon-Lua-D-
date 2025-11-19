import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig'; 

export default function CreateBidScreen({ navigation }) {
  // --- State ---
  const [grade, setGrade] = useState(''); 
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState(''); 
  const [deliveryDate, setDeliveryDate] = useState(''); 
  const [details, setDetails] = useState('');
  const [province, setProvince] = useState('');
  const [amphoe, setAmphoe] = useState('');   
  
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // --- Load User ID ---
  useEffect(() => {
    const loadUserId = async () => {
        const storedId = await AsyncStorage.getItem('userId');
        if (storedId) {
            setOwnerId(storedId);
        } else {
            Alert.alert("ข้อผิดพลาด", "ไม่พบ ID ผู้ใช้ กรุณาล็อกอินใหม่");
            navigation.goBack();
        }
        setInitialLoading(false);
    };
    loadUserId();
  }, [navigation]);


  // --- Submit Logic ---
  const handleSubmit = async () => { 
    if (!ownerId || initialLoading) {
      Alert.alert("ข้อผิดพลาด", "กำลังโหลดข้อมูลผู้ใช้ กรุณารอสักครู่");
      return;
    }
    
    if (!grade || !weight || !price || !deliveryDate || !province || !amphoe) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }

    if (loading) return; 
    setLoading(true);
    
    const payload = {
      type: 'buy', 
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
      const response = await fetch(`${API_BASE_URL}/orderApi/orders`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      Alert.alert(
          'สำเร็จ', 
          'ประกาศรับซื้อของคุณถูกสร้างเรียบร้อยแล้ว',
          [{ text: 'ตกลง', onPress: () => navigation.goBack() }] 
      );
      
    } catch (error) {
      console.error('Error submitting bid:', error);
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setLoading(false); 
    }
  };

  if (initialLoading) {
    return (
        <View style={styles.loadingFullContainer}>
            <ActivityIndicator size="large" color="#1E9E4F" />
            <Text style={styles.loadingText}>กำลังเตรียมข้อมูล...</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {/* [📍 แก้ไขส่วนนี้] เปลี่ยน UI ปุ่มเลือกเกรดให้เหมือนหน้าขายเป๊ะๆ */}
        <Text style={styles.label}>เกรดลำไยที่ต้องการรับซื้อ</Text>
        <View style={styles.gradeContainer}>
          {['AA', 'A', 'B', 'C', 'CC'].map((g) => (
            <TouchableOpacity 
              key={g} 
              style={[
                styles.gradeButton, 
                grade === g && styles.gradeButtonActive,
                styles[`grade${g}`] // เรียกใช้ style สีตามชื่อเกรด
              ]}
              onPress={() => setGrade(g)}
            >
              <Text style={styles.gradeButtonText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* ส่วน input อื่นๆ เหมือนเดิม */}
        <Text style={styles.label}>น้ำหนักที่ต้องการรับซื้อ (กก.)</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="จำนวนเป็นกิโลกรัม" keyboardType="numeric" onChangeText={setWeight} value={weight} />
          <Text style={styles.inputSuffix}>กก.</Text>
        </View>

        <Text style={styles.label}>ราคาที่เสนอซื้อ (บาท/กก.)</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="ราคาต่อกิโลกรัม" keyboardType="numeric" onChangeText={setPrice} value={price} />
          <Text style={styles.inputSuffix}>บาท</Text>
        </View>

        <Text style={styles.label}>จังหวัด</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น เชียงใหม่" onChangeText={setProvince} value={province} />
        </View>

        <Text style={styles.label}>อำเภอ</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น เมือง" onChangeText={setAmphoe} value={amphoe} />
        </View>

        <Text style={styles.label}>วันที่ต้องการรับของ</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="เช่น 15/12/2568" onChangeText={setDeliveryDate} value={deliveryDate} />
        </View>

        <Text style={styles.label}>รายละเอียดเพิ่มเติม</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="ระบุข้อมูลสำคัญอื่นๆ..."
            onChangeText={setDetails}
            value={details}
            multiline={true}
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, (loading || initialLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || initialLoading}
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

// --- Styles (ก๊อปปี้ style ของเกรดมาจากหน้าขาย) ---
const styles = StyleSheet.create({
  loadingFullContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  
  // [📍 Styles ใหม่สำหรับปุ่มเลือกเกรด (แบบแถวเดียว)]
  gradeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  gradeButton: {
    flex: 1, 
    height: 60,
    marginHorizontal: 4,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  gradeButtonActive: { 
    borderWidth: 3, 
    borderColor: '#1E9E4F' 
  },
  gradeAA: { backgroundColor: '#FBE8E8' }, 
  gradeA:  { backgroundColor: '#E8F5E9' }, 
  gradeB:  { backgroundColor: '#E0F7FF' }, 
  gradeC:  { backgroundColor: '#FFFDE7' }, 
  gradeCC: { backgroundColor: '#F0F0F0' },
  gradeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

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