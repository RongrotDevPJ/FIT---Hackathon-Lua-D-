import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Image, TextInput, 
  TouchableOpacity, StatusBar, Platform, Alert,
  ActivityIndicator // [ 📍 1. Import ]
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// [ 📍 2. ตั้งค่า API URL (สำหรับ Web) ]
// (เพิ่มบรรทัดนี้แทน)
import { API_BASE_URL } from './apiConfig';

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState('farmer'); 
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // [ 📍 3. เพิ่ม State สำหรับ Loading ]
  const [loading, setLoading] = useState(false);

  // [ 📍 4. "ผ่าตัด" handleLogin ใหม่ทั้งหมด ]
  const handleLogin = async () => {

    // (A) เช็ค Input (เหมือนเดิม)
    if (phone.trim().length < 10) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก');
      return;
    }
    if (password.trim().length < 6) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (loading) return;
    setLoading(true);

    // (B) สร้าง Payload
    // (*** Backend ต้องมี API POST /login ที่รับค่านี้ ***)
    const payload = {
      phone: phone.trim(),
      password: password,
      // (ส่ง userType ไปด้วยเผื่อ Backend ใช้เช็ค)
      role: userType, 
    };
    
    try {
      // (C) ยิง API ไปที่ Backend
      // (*** เพื่อนคุณต้องสร้าง Endpoint นี้! ***)
      const response = await fetch(`${API_BASE_URL}/login`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
         // (Backend ควรตอบ 401 หรือ 404 ถ้า login ผิด)
        throw new Error(result.error || 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง');
      }

      // (D) ถ้าสำเร็จ...
      console.log('Login Success:', result);
      
      // (*** ตรงนี้สำคัญมาก ***)
      // (คุณต้องเก็บ Token หรือ User Data ที่ได้จาก API ไว้ใน State กลาง)
      // (เช่น AsyncStorage, Context API, Redux)
      // (ตอนนี้เราจะข้ามไปก่อน แล้วดีดตัวไปหน้าหลักเลย)
      
      // (E) แยกหน้าตาม Role ที่ได้จาก API (ไม่ใช่ userType ที่เลือก)
      const loggedInRole = result.user.role; // (สมมติ API คืนค่ามาแบบนี้)

      if (loggedInRole === 'farmer') {
        navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
      } else {
        // (เผื่อเป็น 'buyer' หรือ 'factory')
        navigation.reset({ index: 0, routes: [{ name: 'BuyerApp' }] });
      }
      
    } catch (error) {
      console.error(error);
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message);
    } finally {
      setLoading(false);
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
          maxLength={10} 
        />
        <Text style={styles.label}>รหัสผ่าน</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกรหัสผ่าน"
          secureTextEntry={true} 
          value={password}
          onChangeText={setPassword}
        />
        
        {/* --- [ 📍 5. อัปเกรดปุ่ม Login ] --- */}
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
          )}
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

// --- (Styles) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  header: { backgroundColor: '#1E9E4F', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, paddingBottom: 40, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  logo: { 
    width: 100, 
    height: 100, 
    resizeMode: 'contain', 
    marginBottom: 10 
  },
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
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  loginButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  registerLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { fontSize: 14, color: '#888' },
  registerLink: { color: '#1E9E4F', fontWeight: 'bold' },
});