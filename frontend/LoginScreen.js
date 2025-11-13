import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Image, TextInput, 
  TouchableOpacity, StatusBar, Platform, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState('farmer'); 
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // --- ฟังก์ชัน "ทางแยก" (The Fork) ---
  const handleLogin = () => {
    if (phone.trim() === '' || password.trim() === '') {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน');
      return;
    }
    
    console.log('Login Success:', { userType, phone });

    // --- นี่คือ "ทางแยก" ---
    if (userType === 'farmer') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }], 
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'BuyerApp' }], 
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Image source={require('./logo/Logo.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>ตลาดลำไย</Text>
        <Text style={styles.headerSubtitle}>แพลตฟอร์มซื้อขายลำไยออนไลน์</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.loginTitle}>เข้าสู่ระบบ</Text>
        <Text style={styles.label}>คุณเป็น</Text>
        <View style={styles.userTypeContainer}>
          <TouchableOpacity
            style={[ styles.userTypeButton, userType === 'farmer' && styles.userTypeButtonActive ]}
            onPress={() => setUserType('farmer')}
          >
            <Text style={[ styles.userTypeButtonText, userType === 'farmer' && styles.userTypeButtonTextActive ]}>เกษตรกร/ผู้ขาย</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ styles.userTypeButton, userType === 'buyer' && styles.userTypeButtonActive ]}
            onPress={() => setUserType('buyer')}
          >
            <Text style={[ styles.userTypeButtonText, userType === 'buyer' && styles.userTypeButtonTextActive ]}>ผู้ซื้อ</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>เบอร์โทรศัพท์</Text>
        <TextInput
          style={styles.input}
          placeholder="0xx-xxx-xxxx"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Text style={styles.label}>รหัสผ่าน</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกรหัสผ่าน"
          secureTextEntry={true} 
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin} 
        >
          <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>
        <View style={styles.registerLinkContainer}>
          <Text style={styles.registerText}>ไม่มีบัญชี?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.registerText, styles.registerLink]}> ลงทะเบียนที่นี่</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles (ฉบับเต็ม) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  header: { backgroundColor: '#1E9E4F', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, paddingBottom: 40, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  logo: { width: 80, height: 80, resizeMode: 'contain', marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 16, color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, padding: 25, borderRadius: 15, marginTop: -30, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  loginTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, color: '#555', marginBottom: 5, marginTop: 10 },
  userTypeContainer: { flexDirection: 'row', marginBottom: 15 },
  userTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginHorizontal: 5 },
  userTypeButtonActive: { backgroundColor: '#E8F5E9', borderColor: '#1E9E4F' },
  userTypeButtonText: { fontSize: 16, color: '#888' },
  userTypeButtonTextActive: { color: '#1E9E4F', fontWeight: 'bold' },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 10 },
  loginButton: { backgroundColor: '#1E9E4F', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  loginButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  registerLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { fontSize: 14, color: '#888' },
  registerLink: { color: '#1E9E4F', fontWeight: 'bold' },
});