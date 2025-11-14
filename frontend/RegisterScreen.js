import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Image, TextInput,
  TouchableOpacity, ScrollView, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen({ navigation }) {
  const [userType, setUserType] = useState('farmer');
  const [name, setName] = useState(''); 
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน!'); 
      return;
    }
    console.log('Register Info:', { userType, name, phone, password }); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- [ 1. เพิ่ม Header + Logo ] --- */}
        <View style={styles.header}>
            <Image source={require('./logo/Logo.png')} style={styles.logo} />
            <Text style={styles.headerTitle}>สร้างบัญชีใหม่</Text>
        </View>

        <View style={styles.card}>
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
            onPress={handleRegister} 
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

// --- Styles (ฉบับเต็ม + Logo) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  header: { // [แก้แล้ว]
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
  logo: { // [แก้แล้ว]
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  headerTitle: { // [แก้แล้ว]
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