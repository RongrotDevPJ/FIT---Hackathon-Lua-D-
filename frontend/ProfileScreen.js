import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// [ 📍 ตั้งค่า API URL (สำหรับ Web) ]
import { API_BASE_URL } from './apiConfig';

// (*** สำคัญ: MY_USER_ID ควรจะถูกดึงมาจาก Global State หลังจาก Login! ***)
// (ตอนนี้ใช้ ID ปลอมไปก่อน เพื่อให้โค้ดรันได้)
const MY_USER_ID = 'TEMP_USER_ID_123'; 

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showOrders, setShowOrders] = useState(true);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // (*** แก้ไข path ตรงนี้ ***)
      const response = await fetch(`${API_BASE_URL}/usersApi/${MY_USER_ID}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
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
    fetchUserProfile();
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
          <TouchableOpacity onPress={fetchUserProfile} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!userProfile) {
        return <Text style={styles.loadingText}>ไม่พบข้อมูลผู้ใช้</Text>;
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
          {/* [ 📍 แสดง จังหวัด/อำเภอ ที่เพิ่มเมื่อกี้ ] */}
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
  
  // (*** ส่วนจัดการรายการคำสั่งซื้อของคุณ ***)
  // (อันนี้เป็น Mock Data เพราะยังไม่มี API ดึง Orders ที่ตรงกับ User ID)
  const renderOrders = () => {
    const mockOrders = [
      { id: 'O001', type: 'sell', grade: 'AA', amount: 500, price: 35.5, status: 'open' },
      { id: 'O002', type: 'buy', grade: 'A', amount: 1000, price: 30.0, status: 'matched' },
      { id: 'O003', type: 'sell', grade: 'B', amount: 200, price: 25.0, status: 'closed' },
    ];
    
    // (*** ต้องดึงข้อมูลจริงจาก API /orderApi/users/:userId/orders ***)
    
    return (
      <View style={styles.listSection}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, showOrders && styles.tabButtonActive]}
            onPress={() => setShowOrders(true)}
          >
            <Text style={[styles.tabText, showOrders && styles.tabTextActive]}>ประกาศของฉัน</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, !showOrders && styles.tabButtonActive]}
            onPress={() => setShowOrders(false)}
          >
            <Text style={[styles.tabText, !showOrders && styles.tabTextActive]}>คำเสนอซื้อ/ขาย</Text>
          </TouchableOpacity>
        </View>
        
        {/* --- Mock List --- */}
        <View style={styles.orderList}>
          {mockOrders.filter(o => o.type === (showOrders ? 'sell' : 'buy')).map(order => (
            <View key={order.id} style={styles.orderItem}>
              <Text style={styles.orderGrade}>{order.grade}</Text>
              <Text style={styles.orderDetail}>
                {order.type === 'sell' ? 'ขาย' : 'รับซื้อ'} {order.amount} กก.
              </Text>
              <Text style={styles.orderPrice}>{order.price} บ./กก.</Text>
              <View style={[styles.statusBadge, styles[`status_${order.status}`]]}>
                <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
              </View>
            </View>
          ))}
          {mockOrders.filter(o => o.type === (showOrders ? 'sell' : 'buy')).length === 0 && (
            <Text style={styles.emptyOrderText}>ไม่มีรายการในตอนนี้</Text>
          )}
        </View>
        
      </View>
    );
  }

  // --- (Logout Function) ---
  const handleLogout = () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณต้องการออกจากระบบหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ยืนยัน", 
          onPress: () => {
            // (*** ตรงนี้ต้องเคลียร์ Token / User State ในระบบจริง ***)
            // (ตอนนี้แค่ navigate กลับหน้า Login)
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

        {renderOrders()} 
        
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
  
  // Order/Listing Section styles (Mock)
  listSection: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 2 },
  tabContainer: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 3, borderBottomColor: '#1E9E4F' },
  tabText: { fontSize: 16, color: '#888' },
  tabTextActive: { color: '#1E9E4F', fontWeight: 'bold' },
  
  orderList: { marginTop: 10 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  orderGrade: { fontSize: 16, fontWeight: 'bold', width: 50 },
  orderDetail: { flex: 1, fontSize: 14, color: '#555' },
  orderPrice: { fontSize: 16, fontWeight: 'bold', color: '#333', width: 70, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 15, marginLeft: 10 },
  status_open: { backgroundColor: '#FFF3E0' },
  status_matched: { backgroundColor: '#E8F5E9' },
  status_closed: { backgroundColor: '#F0F0F0' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  emptyOrderText: { textAlign: 'center', color: '#AAA', paddingVertical: 20 },
  
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