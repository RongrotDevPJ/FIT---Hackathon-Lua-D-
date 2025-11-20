import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebaseConfig'; // ตรวจสอบ path ให้ตรงกับโปรเจคของคุณ
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NegotiationDetailScreen({ route, navigation }) {
  // รับค่า item ที่ส่งมาจากหน้า ListingDetailScreen
  const { item } = route.params;
  
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      // ดึง User ID จาก AsyncStorage หรือ auth
      const id = await AsyncStorage.getItem('userId') || auth.currentUser?.uid;
      setCurrentUserId(id);
      
      // ตั้งราคาเสนอเริ่มต้นเท่ากับราคาที่ตั้งไว้ (เพื่อความสะดวก)
      if (item.requestedPrice) {
        setOfferedPrice(item.requestedPrice.toString());
      }
    };
    loadUser();
  }, []);

  const handleCreateNegotiation = async () => {
    if (!offeredPrice.trim()) {
      Alert.alert('กรุณาระบุราคา', 'โปรดใส่ราคาที่คุณต้องการเสนอ');
      return;
    }

    if (!currentUserId) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setIsSubmitting(true);

    try {
      let targetBuyerId;
      let targetFarmerId;
      let targetOwnerId = item.ownerId || item.farmerId || item.buyerId; // รับค่า ownerId จาก field ที่มี

      // ==========================================
      // 🔥 FIX: Logic การระบุตัวตนที่ถูกต้อง
      // ==========================================
      if (item.type === 'buy') {
        // กรณี 1: "ประกาศรับซื้อ" (Buy Request)
        // - เจ้าของโพสต์ คือ ผู้รับซื้อ (Buyer)
        // - คนที่กดเข้ามา (เรา) คือ เกษตรกร (Farmer) ที่จะขายของให้
        targetBuyerId = targetOwnerId;   
        targetFarmerId = currentUserId;  
      } else {
        // กรณี 2: "ประกาศขาย" (Sell Request)
        // - เจ้าของโพสต์ คือ เกษตรกร (Farmer)
        // - คนที่กดเข้ามา (เรา) คือ ผู้รับซื้อ (Buyer) ที่จะซื้อของ
        targetFarmerId = targetOwnerId;  
        targetBuyerId = currentUserId;   
      }

      // ตรวจสอบข้อมูลก่อนบันทึก (Debug)
      console.log("Creating Negotiation:", {
        type: item.type,
        buyerId: targetBuyerId,
        farmerId: targetFarmerId,
        itemId: item.id
      });

      // บันทึกลง Collection 'negotiations'
      await addDoc(collection(db, 'negotiations'), {
        itemId: item.id,
        itemName: item.plantType || 'สินค้าเกษตร', // ชื่อสินค้า
        itemImage: item.image || null,            // รูปสินค้า (ถ้ามี)
        
        buyerId: targetBuyerId,
        farmerId: targetFarmerId,
        
        // เก็บ ID ของผู้เริ่มเจรจา เพื่อใช้แยกแยะว่าใครเป็นคนทัก
        initiatorId: currentUserId, 
        
        status: 'pending', // สถานะเริ่มต้น: รอการตอบรับ
        
        // ข้อมูลข้อเสนอ
        originalPrice: Number(item.requestedPrice || 0),
        offeredPrice: Number(offeredPrice),
        amountKg: Number(item.amountKg || 0),
        
        // ข้อความแรก (ถ้ามี)
        lastMessage: message || 'เริ่มการเจรจา',
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('สำเร็จ', 'ส่งคำขอเจรจาเรียบร้อยแล้ว', [
        { 
          text: 'ตกลง', 
          onPress: () => {
            // กลับไปหน้าก่อนหน้า หรือไปหน้ารายการเจรจา
            navigation.navigate('Offers'); // หรือชื่อหน้าตามที่คุณตั้งไว้สำหรับรายการเจรจา
          } 
        }
      ]);

    } catch (error) {
      console.error("Error creating negotiation:", error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างการเจรจาได้ ลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>เสนอราคา / ต่อรอง</Text>
            <View style={{width: 24}} />
          </View>

          <View style={styles.itemCard}>
            <Text style={styles.itemTitle}>
              {item.type === 'buy' ? 'ประกาศรับซื้อ: ' : 'ประกาศขาย: '} 
              {item.plantType}
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>ราคาตั้งต้น:</Text>
              <Text style={styles.value}>{item.requestedPrice} บาท/กก.</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ปริมาณ:</Text>
              <Text style={styles.value}>{item.amountKg} กก.</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>ราคาที่คุณต้องการเสนอ (บาท/กก.)</Text>
            <TextInput
              style={styles.input}
              value={offeredPrice}
              onChangeText={setOfferedPrice}
              keyboardType="numeric"
              placeholder="ระบุราคา"
            />

            <Text style={styles.inputLabel}>ข้อความเพิ่มเติม (ถ้ามี)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="เช่น สนใจสินค้า, สะดวกนัดรับที่ไหน..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
            onPress={handleCreateNegotiation}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันข้อเสนอ'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { padding: 20 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 20 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  backButton: { padding: 5 },
  
  itemCard: {
    backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E9E4F', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, color: '#333', fontWeight: '600' },

  formContainer: { marginBottom: 30 },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    padding: 12, fontSize: 16, color: '#333'
  },
  textArea: { height: 100 },

  submitButton: {
    backgroundColor: '#1E9E4F', padding: 15, borderRadius: 10, alignItems: 'center',
    elevation: 3
  },
  disabledButton: { backgroundColor: '#A5D6A7' },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});