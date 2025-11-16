import React from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Image, Alert,
  Platform // <-- [1. Import] เพิ่ม Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // (ผมเปิดไอคอนให้เลย)

export default function ProfileScreen({ navigation }) {
  const userName = "สมชาย มั่นคง";
  const userType = "เกษตรกร/ผู้ขาย"; // (อันนี้เราต้องแก้ Logic ทีหลังว่ามาจาก User Type ไหน)

  // --- [2. อัปเกรด!] ฟังก์ชัน "ดีดตัว" (ฉบับ 2 ระบบ) ---
  const handleLogout = () => {
    // --- [ถ้าเป็น "เว็บ"] ---
    if (Platform.OS === 'web') {
      // (ใช้ window.confirm... มันจะเด้งป๊อปอัพ "ตกลง/ยกเลิก" ของเบราว์เซอร์)
      if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        // (ถ้าผู้ใช้กด "ตกลง")
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }], 
        });
      }
      // (ถ้าผู้ใช้กด "ยกเลิก"... มันก็จะไม่ทำอะไร... ซึ่งถูกต้องแล้ว)
    } 
    // --- [ถ้าเป็น "มือถือ"] ---
    else {
      // (ใช้ Alert.alert สวยๆ เหมือนเดิม)
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userType}>{userType}</Text>
        </View>
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

// --- Styles (ฉบับเต็ม + ไอคอน) ---
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
    flex: 1, // ดันลูกศรไปทางขวา
    fontSize: 16, 
    color: '#333',
    marginLeft: 15, // (เว้นระยะจากไอคอน)
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