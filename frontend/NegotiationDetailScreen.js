import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Import API Config
import { API_BASE_URL } from './apiConfig'; 

export default function NegotiationDetailScreen({ route, navigation }) {
  const { item } = route.params;
  
  const [offeredPrice, setOfferedPrice] = useState('');
  const [amountKg, setAmountKg] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item.requestedPrice) {
      setOfferedPrice(item.requestedPrice.toString());
    }
    if (item.amountKg) {
      setAmountKg(item.amountKg.toString());
    }
  }, [item]);

  const handleCreateNegotiation = async () => {
    // 1. ตรวจสอบข้อมูล
    if (!offeredPrice.trim()) {
      Alert.alert('กรุณาระบุราคา', 'โปรดใส่ราคาที่คุณต้องการเสนอ');
      return;
    }

    // 2. ดึง User ID และ Role
    const userId = await AsyncStorage.getItem('userId');
    const userRole = await AsyncStorage.getItem('userRole'); // ดึง Role เพื่อเลือกหน้าปลายทาง
    
    if (!userId) {
      Alert.alert('แจ้งเตือน', 'ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. เตรียมข้อมูลสำหรับ API
      const payload = {
        actorId: userId, 
        offeredPrice: Number(offeredPrice),
        amountKg: Number(amountKg || item.amountKg || 0),
        details: message 
      };

      console.log("Sending API Request:", payload);

      // 4. ยิง API
      const response = await fetch(`${API_BASE_URL}/orderApi/orders/${item.id}/negotiations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      }

      // 5. สำเร็จ -> Navigate ไปยัง Tab ที่ถูกต้องตาม App.js
      Alert.alert('สำเร็จ', 'ส่งคำขอเจรจาเรียบร้อยแล้ว', [
        { 
          text: 'ตกลง', 
          onPress: () => {
            // ✅ แก้ไขจุดที่ Error: เช็ค Role แล้วไปให้ถูกชื่อ Tab
            if (userRole === 'buyer') {
                // ผู้ซื้อ -> ไปที่ BuyerApp -> MyBidsTab
                navigation.navigate('BuyerApp', { screen: 'MyBidsTab' });
            } else {
                // เกษตรกร -> ไปที่ MainApp -> OffersTab
                navigation.navigate('MainApp', { screen: 'OffersTab' });
            }
          } 
        }
      ]);

    } catch (error) {
      console.error("Error creating negotiation:", error);
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถส่งคำขอได้: ${error.message}`);
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
              editable={false} 
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