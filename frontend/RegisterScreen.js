import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Image, TextInput,
  TouchableOpacity, ScrollView, Platform, StatusBar,
  Alert // <-- [1. Import] เพิ่ม Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- [2. Import "เครื่องมือ" Firebase] ---
import { auth, db } from './firebaseConfig'; // (ปลั๊กไฟของเรา)
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 

export default function RegisterScreen({ navigation }) {
  const [userType, setUserType] = useState('farmer');
  const [name, setName] = useState(''); 
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 

  // --- [3. "ผ่าตัด" ฟังก์ชัน handleRegister!] ---
  const handleRegister = async () => { // <-- (A) เพิ่ม async
    if (password !== confirmPassword) {
      Alert.alert('รหัสผ่านไม่ตรงกัน!'); 
      return;
    }
    if (phone.trim() === '' || password.trim() === '' || name.trim() === '') {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอก ชื่อ, เบอร์โทร, และรหัสผ่าน');
      return;
    }

    try {
      // (B) สร้าง User ใน Auth
      // (Firebase Auth ชอบ Email... เราเลยแปลง "เบอร์โทร" ให้เป็น Email ปลอมๆ)
      const userCredential = await createUserWithEmailAndPassword(auth, phone.trim() + "@tempdomain.com", password);
      const user = userCredential.user;

      // (C) "บันทึก" ข้อมูล (ชื่อ, Role) ลงใน "ตู้เอกสาร" (Firestore)
      // โดยใช้ ID (uid) ของคนที่เพิ่งสมัคร เป็น "ชื่อแฟ้ม"
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        phone: phone.trim(),
        userType: userType, // 'farmer' หรือ 'buyer'
        createdAt: new Date(), // (แถมวันที่สมัคร)
      });

      // (D) (ถ้าสำเร็จ... ก็ดีดตัวไปหน้าหลัก... แบบเดียวกับ Login)
      if (userType === 'farmer') {
        navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'BuyerApp' }] });
      }
      
    } catch (error) {
      // (E) (ถ้า Firebase พัง... เช่น "รหัสผ่านสั้นไป")
      console.error(error);
      Alert.alert('ลงทะเบียนไม่สำเร็จ', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
            <Image source={require('./logo/Logo.png')} style={styles.logo} />
            <Text style={styles.headerTitle}>สร้างบัญชีใหม่</Text>
        </View>

        <View style={styles.card}>
          {/* ... (JSX/Styles ที่เหลือ... เหมือนเดิมเป๊ะ) ... */}
          <Text style={styles.label}>คุณเป็น</Text>
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[ styles.userTypeButton, userType === 'farmer' && styles.userTypeButtonActive ]}
              onPress={() => setUserType('farmer')}>
              <Text style={[ styles.userTypeButtonText, userType === 'farmer' && styles.userTypeButtonTextActive ]}>
                เกษตรกร/ผู้ขาย
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ styles.userTypeButton, userType === 'buyer' && styles.userTypeButtonActive ]}
              onPress={() => setUserType('buyer')}>
              <Text style={[ styles.userTypeButtonText, userType === 'buyer' && styles.userTypeButtonTextActive ]}>
                ผู้ซื้อ
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>ชื่อ-นามสกุล</Text>
          <TextInput style={styles.input} placeholder="กรอกชื่อ-นามสกุล" value={name} onChangeText={setName} />
          <Text style={styles.label}>เบอร์โทรศัพท์</Text>
          <TextInput style={styles.input} placeholder="0xx-xxx-xxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <Text style={styles.label}>รหัสผ่าน</Text>
          <TextInput style={styles.input} placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)" secureTextEntry={true} value={password} onChangeText={setPassword} />
          <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
          <TextInput style={styles.input} placeholder="กรอกรหัสผ่านอีกครั้ง" secureTextEntry={true} value={confirmPassword} onChangeText={setConfirmPassword} />

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister} // <-- (เรียก "ตัวจริง" แล้ว)
          >
            <Text style={styles.registerButtonText}>ลงทะเบียน</Text>
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>มีบัญชีอยู่แล้ว?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.loginText, styles.loginLink]}> กลับไปเข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- (Styles... เหมือนเดิมเป๊ะ) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  header: { 
    backgroundColor: '#1E9E4F', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: -30, 
    zIndex: 1,
  },
  logo: { 
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  headerTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 0, 
  },
  label: { fontSize: 14, color: '#555', marginBottom: 5, marginTop: 10 },
  userTypeContainer: { flexDirection: 'row', marginBottom: 15 },
  userTypeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  userTypeButtonActive: { backgroundColor: '#E8F5E9', borderColor: '#1E9E4F' },
  userTypeButtonText: { fontSize: 16, color: '#888' },
  userTypeButtonTextActive: { color: '#1E9E4F', fontWeight: 'bold' },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  registerButton: {
    backgroundColor: '#1E9E4F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { fontSize: 14, color: '#888' },
  loginLink: { color: '#1E9E4F', fontWeight: 'bold' },
});