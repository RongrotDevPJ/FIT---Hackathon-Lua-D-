import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {

  const userName = "สมชาย มั่นคง";
  const userType = "เกษตรกร/ผู้ขาย";

  // --- 2. ฟังก์ชัน "ดีดตัว" กลับประตูหน้า (ตัวจริง!) ---
  const handleLogout = () => {
    Alert.alert(
      "ออกจากระบบ", 
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ตกลง", 
          onPress: () => {
            // --- นี่คือโค้ด "ดีดตัว" กลับ (Login) ---
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }], 
            });
          }
        }
      ]
    );
  };

  // --- 3. JSX ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          {/* (สามารถเพิ่ม Avatar ได้ตรงนี้) */}
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userType}>{userType}</Text>
        </View>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>แก้ไขข้อมูลส่วนตัว</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>การตั้งค่า</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>ศูนย์ช่วยเหลือ</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout} // <-- เรียก "ตัวจริง" แล้ว
          >
            <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- 4. StyleSheet (เหมือนเดิม) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  container: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userType: {
    fontSize: 16,
    color: '#1E9E4F', 
    fontWeight: 'bold',
  },
  menuContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
  },
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
  },
  logoutContainer: {
    padding: 20,
    marginTop: 20,
  },
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