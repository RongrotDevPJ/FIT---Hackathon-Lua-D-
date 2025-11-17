import React, { 
  useState, 
  useEffect
} from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 

// [ 📍 ตั้งค่า API URL (สำหรับ Web) ]

import { API_BASE_URL } from './apiConfig';

// [ 📍 ID ของ User (ชั่วคราว) ]
// (สำคัญ! ใส่ ID ปลอมไปก่อน)
const MY_USER_ID = 'TEMP_USER_ID_123'; 

export default function ProfileScreen({ navigation }) {
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    if (!MY_USER_ID) {
      setError("ไม่ได้ระบุ User ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${MY_USER_ID}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }
      
      setUser(result);

    } catch (e) {
      console.error("Failed to fetch profile:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []); // (ทำครั้งเดียว)

  
  // (ฟังก์ชัน Logout... เหมือนเดิม)
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } else {
      Alert.alert(
        "ออกจากระบบ", 
        "คุณต้องการออกจากระบบใช่หรือไม่?",
        [
          { text: "ยกเลิก", style: "cancel" },
          { 
            text: "ตกลง", 
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }], 
              });
            }
          }
        ]
      );
    }
  };

  const formatUserRole = (role) => {
    if (role === 'farmer') return 'เกษตรกร/ผู้ขาย';
    if (role === 'buyer') return 'ผู้ซื้อ';
    if (role === 'admin') return 'ผู้ดูแลระบบ';
    return 'ไม่ระบุ';
  };

  const renderProfileHeader = () => {
    if (loading) {
      return (
        <View style={styles.profileHeader}>
          <ActivityIndicator size="small" color="#1E9E4F" />
        </View>
      );
    }

    if (error || !user) {
      return (
        <View style={styles.profileHeader}>
          <Text style={styles.userName}>เกิดข้อผิดพลาด</Text>
          <Text style={styles.userType}>{error || 'ไม่พบข้อมูลผู้ใช้'}</Text>
          <TouchableOpacity onPress={fetchUserProfile} style={{ marginTop: 10 }}>
            <Text style={{ color: '#0D6EfD' }}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // (ถ้าสำเร็จ... แสดงข้อมูลจริง)
    return (
      <View style={styles.profileHeader}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userType}>{formatUserRole(user.role)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {renderProfileHeader()} 

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuText}>แก้ไขข้อมูลส่วนตัว</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#AAA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuText}>การตั้งค่า</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#AAA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuText}>ศูนย์ช่วยเหลือ</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#AAA" />
          </TouchableOpacity>
        </View>
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout} 
          >
            <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- (Styles) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  container: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 100, 
    justifyContent: 'center', 
  },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userType: { fontSize: 16, color: '#1E9E4F', fontWeight: 'bold' },
  menuContainer: { marginTop: 20, backgroundColor: '#FFFFFF' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: { 
    flex: 1, 
    fontSize: 16, 
    color: '#333',
    marginLeft: 15, 
  },
  logoutContainer: { padding: 20, marginTop: 20 },
  logoutButton: {
    backgroundColor: '#FFCDD2', 
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F', 
  },
});