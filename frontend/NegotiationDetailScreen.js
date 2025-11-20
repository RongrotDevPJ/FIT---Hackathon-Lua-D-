import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 1. Import ฟังก์ชันสำหรับ Modular SDK (Firestore & Auth)
import { collection, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 2. Import 'firebase' object ตัวหลักจาก Config เดิม
import { firebase } from './firebaseConfig'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// 3. สร้าง Instance ของ db และ auth สำหรับหน้านี้
const db = getFirestore(firebase.app());
const auth = getAuth(firebase.app());

export default function NegotiationDetailScreen({ route, navigation }) {
  // รับค่า item ที่ส่งมาจากหน้า ListingDetailScreen
  const { item } = route.params;
  
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountKg, setAmountKg] = useState(''); // เพิ่ม State สำหรับปริมาณ (ถ้าต้องการต่อรอง)

  useEffect(() => {
    // ตั้งค่าเริ่มต้น
    if (item.requestedPrice) {
      setOfferedPrice(item.requestedPrice.toString());
    }
    if (item.amountKg) {
      setAmountKg(item.amountKg.toString());
    }
  }, [item]);

  const handleCreateNegotiation = async () => {
    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!offeredPrice.trim()) {
      Alert.alert('กรุณาระบุราคา', 'โปรดใส่ราคาที่คุณต้องการเสนอ');
      return;
    }

    // 2. ตรวจสอบการล็อกอิน (สำคัญมากสำหรับ Security Rules)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. กำหนดบทบาท (Role Assignment)
      // targetOwnerId คือเจ้าของโพสต์ (อาจจะเป็นคนขาย หรือ คนรับซื้อ ก็ได้)
      const targetOwnerId = item.ownerId || item.farmerId || item.factoryId || item.buyerId;
      
      let finalFarmerId;
      let finalFactoryId;

      if (item.type === 'buy') {
        // กรณี "ประกาศรับซื้อ" (Buy Request)
        // - เจ้าของโพสต์ = โรงงาน/ผู้ซื้อ (Factory)
        // - เรา (คนกด) = เกษตรกร (Farmer)
        finalFactoryId = targetOwnerId;
        finalFarmerId = currentUser.uid;
      } else {
        // กรณี "ประกาศขาย" (Sell Request)
        // - เจ้าของโพสต์ = เกษตรกร (Farmer)
        // - เรา (คนกด) = โรงงาน/ผู้ซื้อ (Factory)
        finalFarmerId = targetOwnerId;
        finalFactoryId = currentUser.uid;
      }

      // ตรวจสอบว่าไม่ได้คุยกับตัวเอง
      if (finalFarmerId === finalFactoryId) {
         Alert.alert('ข้อผิดพลาด', 'คุณไม่สามารถเจรจากับโพสต์ของตัวเองได้');
         setIsSubmitting(false);
         return;
      }

      // 4. เตรียมข้อมูลสำหรับบันทึก (Payload)
      // ใช้ชื่อ field ให้ตรงกับ backend (factoryId, farmerId)
      const negotiationData = {
        orderId: item.id, // สำคัญ: เชื่อมโยงกับ Order ต้นฉบับ
        itemId: item.id,  // (สำรอง)
        itemName: item.plantType || 'สินค้าเกษตร',
        itemImage: item.image || null,
        
        // ข้อมูลคู่กรณี
        factoryId: finalFactoryId, // ใช้ factoryId ตาม Data Model
        buyerId: finalFactoryId,   // (สำรอง) เผื่อบางจุดใช้ buyerId
        farmerId: finalFarmerId,
        
        // ข้อมูลสำหรับ Security Rules
        initiatorId: currentUser.uid, 
        
        status: 'open', // หรือ 'pending' ตามที่ backend ใช้
        
        // รายละเอียดข้อเสนอ
        originalPrice: Number(item.requestedPrice || 0),
        requestedPrice: Number(item.requestedPrice || 0),
        offeredPrice: Number(offeredPrice),
        amountKg: Number(amountKg || item.amountKg || 0),
        
        // ข้อมูลอื่นๆ
        province: item.province || '',
        amphoe: item.amphoe || '',
        grade: item.grade || '',
        
        // ข้อความแรก (ถ้ามี)
        lastMessage: message || 'เริ่มการเจรจา',
        lastSide: (currentUser.uid === finalFarmerId) ? 'farmer' : 'factory',
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("Sending Negotiation Data:", negotiationData);

      // 5. บันทึกลง Firestore
      await addDoc(collection(db, 'negotiations'), negotiationData);

      Alert.alert('สำเร็จ', 'ส่งคำขอเจรจาเรียบร้อยแล้ว', [
        { 
          text: 'ตกลง', 
          onPress: () => {
            // กลับไปหน้ารายการเจรจา หรือหน้า OffersScreen
            // ตรวจสอบว่าใน Stack Navigator ของคุณชื่อ 'Offers' หรือไม่
            navigation.navigate('Offers'); 
          } 
        }
      ]);

    } catch (error) {
      console.error("Error creating negotiation:", error);
      
      if (error.code === 'permission-denied') {
        Alert.alert('สิทธิ์การเข้าถึงถูกปฏิเสธ', 'กรุณาตรวจสอบว่าคุณล็อกอินถูกต้อง หรือกฎความปลอดภัยของระบบ (Rules) ได้รับการอัปเดตแล้ว');
      } else {
        Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถสร้างการเจรจาได้: ${error.message}`);
      }
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
            <View style={styles.row}>
              <Text style={styles.label}>พื้นที่:</Text>
              <Text style={styles.value}>{item.amphoe}, {item.province}</Text>
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

            <Text style={styles.inputLabel}>ปริมาณ (กก.)</Text>
            <TextInput
              style={styles.input}
              value={amountKg}
              onChangeText={setAmountKg}
              keyboardType="numeric"
              placeholder="ระบุปริมาณ"
              editable={false} // ปิดไว้ก่อนถ้าไม่ต้องการให้แก้ปริมาณในรอบแรก
            />
            <Text style={styles.hint}>*ปริมาณอ้างอิงจากประกาศ</Text>

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
  hint: { fontSize: 12, color: '#999', marginTop: 5, marginBottom: 10 },

  submitButton: {
    backgroundColor: '#1E9E4F', padding: 15, borderRadius: 10, alignItems: 'center',
    elevation: 3
  },
  disabledButton: { backgroundColor: '#A5D6A7' },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});