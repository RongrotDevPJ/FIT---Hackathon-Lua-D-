import React, { useState, useCallback } from 'react'; // <--- 1. แก้ 'in' เป็น 'from'
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from './apiConfig'; 

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ใช้ useFocusEffect เพื่อให้ดึงข้อมูลใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        
        if (!userId) {
          Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่");
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        try {
          // [อิงจาก usersRoutes.ts] GET /users/:id
          const response = await fetch(`${API_BASE_URL}/usersApi/${userId}`);
          const userData = await response.json();

          if (response.ok) {
            setUser(userData);
          } else {
            throw new Error(userData.error || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
          }
        } catch (error) {
          console.error("Fetch User Error:", error);
          Alert.alert("เกิดข้อผิดพลาด", error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ตกลง", 
          style: "destructive",
          onPress: async () => {
            // เคลียร์ข้อมูลทั้งหมดใน AsyncStorage
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userRole');
            
            // กลับไปหน้า Login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  // 2. แก้ไขฟังก์ชันให้รับ isLast เพื่อเช็คว่าใช่แถวสุดท้ายหรือไม่
  const renderInfoRow = (icon, label, value, isLast = false) => (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Ionicons name={icon} size={24} color="#555" style={styles.icon} />
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1E9E4F" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle-outline" size={80} color="#1E9E4F" />
          <Text style={styles.nameText}>{user?.name}</Text>
          <Text style={styles.roleText}>
            {user?.role === 'farmer' ? 'เกษตรกร/ผู้ขาย' : 'ผู้ซื้อ'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          {/* 3. ส่ง isLast=true ให้แถวสุดท้าย */}
          {renderInfoRow("call-outline", "เบอร์โทรศัพท์", user?.phone)}
          {renderInfoRow("location-outline", "จังหวัด", user?.province)}
          {renderInfoRow("map-outline", "อำเภอ", user?.amphoe, true)} 
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  roleText: {
    fontSize: 16,
    color: '#1E9E4F',
    marginTop: 4,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  // 4. สร้าง Style สำหรับแถวสุดท้าย (ไม่มีเส้นขอบล่าง)
  infoRowLast: {
    borderBottomWidth: 0,
  },
  icon: {
    marginHorizontal: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F1',
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FDCACA',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});