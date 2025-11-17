import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// [ 📍 ตั้งค่า API URL (สำหรับ Web) ]
import { API_BASE_URL } from './apiConfig';

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); 
  
  // 📍 ลบ State ที่เกี่ยวข้องกับการแสดงรายการออก

  const fetchUserProfile = async (userId) => { 
    if (!userId) { 
        setLoading(false);
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/usersApi/${userId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ${response.status}`);
      }

      setUserProfile(result);
      
    } catch (e) {
      console.error("Fetch Profile Error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserId = async () => {
        const storedId = await AsyncStorage.getItem('userId');
        setCurrentUserId(storedId); 
        fetchUserProfile(storedId);
    };
    loadUserId();
  }, []);

  // --- (Render Functions) ---

  const renderUserInfo = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E9E4F" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>ข้อผิดพลาด: {error}</Text>
          <TouchableOpacity onPress={() => fetchUserProfile(currentUserId)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!userProfile) {
        return <Text style={styles.loadingText}>ไม่พบข้อมูลผู้ใช้ (กรุณาล็อกอิน)</Text>;
    }

    return (
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userProfile.name ? userProfile.name[0] : 'U'}
          </Text>
        </View>
        <Text style={styles.nameText}>{userProfile.name || 'ชื่อผู้ใช้'}</Text>
        <Text style={styles.roleText}>{userProfile.role === 'farmer' ? 'เกษตรกร (ผู้ขาย)' : 'ผู้ซื้อ/โรงงาน'}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color="#555" />
          <Text style={styles.infoText}>{userProfile.phone || 'ไม่ระบุเบอร์โทร'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#555" />
          <Text style={styles.infoText}>
            {userProfile.amphoe && userProfile.province 
                ? `${userProfile.amphoe}, ${userProfile.province}` 
                : 'ไม่ระบุที่อยู่'
            }
          </Text>
        </View>
      </View>
    );
  };
  
  // 📍 renderOrders ถูกลบออก

  // --- (Logout Function) ---
  const handleLogout = () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณต้องการออกจากระบบหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ยืนยัน", 
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } 
        }
      ]
    );
  };

  // --- (Main Render) ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>ข้อมูลส่วนตัว</Text>

        {renderUserInfo()}

        {/* 📍 ส่วนแสดงรายการถูกลบออก */}
        
        <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color="#1E9E4F" />
            <Text style={styles.editButtonText}>แก้ไขข้อมูลส่วนตัว</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E9E4F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#1E9E4F',
    fontWeight: '600',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  
  // Loading & Error styles
  loadingContainer: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#888', marginTop: 10 },
  errorText: { fontSize: 16, color: '#D32F2F', textAlign: 'center' },
  retryButton: { backgroundColor: '#E8F5E9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 10 },
  retryButtonText: { color: '#1E9E4F', fontWeight: 'bold' },
  
  // Action Buttons
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  editButtonText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E9E4F',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE', 
    padding: 15,
    borderRadius: 15,
    marginBottom: 40,
    marginTop: 10,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F', 
  },
});