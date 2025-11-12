import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Platform,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

export default function CreateListingScreen({ navigation }) {
  const [grade, setGrade] = useState(''); 
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!grade || !weight || !price) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอก เกรด, น้ำหนัก, และราคา ให้ครบถ้วน');
      return;
    }
    console.log('Submitting:', { grade, weight, price, details });
    navigation.goBack(); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        <Text style={styles.label}>เลือกเกรดลำไย</Text>
        <View style={styles.gradeContainer}>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'B' && styles.gradeButtonActive]}
            onPress={() => setGrade('B')}
          >
            <Text style={[styles.gradeCircle, styles.gradeB]}>B</Text>
            <Text style={styles.gradeText}>เกรด B</Text>
            <Text style={styles.gradeSubText}>คุณภาพดีเยี่ยม</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'C' && styles.gradeButtonActive]}
            onPress={() => setGrade('C')}
          >
            <Text style={[styles.gradeCircle, styles.gradeC]}>C</Text>
            <Text style={styles.gradeText}>เกรด C</Text>
            <Text style={styles.gradeSubText}>คุณภาพดี</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradeButton, grade === 'CC' && styles.gradeButtonActive]}
            onPress={() => setGrade('CC')}
          >
            <Text style={[styles.gradeCircle, styles.gradeCC]}>CC</Text>
            <Text style={styles.gradeText}>เกรด CC</Text>
            <Text style={styles.gradeSubText}>คุณภาพปานกลาง</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>น้ำหนัก (กิโลกรัม)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="ระบุน้ำหนัก"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <Text style={styles.inputSuffix}>กก.</Text>
        </View>
        <Text style={styles.exampleText}>ตัวอย่าง: 500 กก.</Text>

        <Text style={styles.label}>ราคาที่ต้องการขาย</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="ระบุราคา"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <Text style={styles.inputSuffix}>บาท/กก.</Text>
        </View>
        <Text style={styles.exampleText}>ตัวอย่าง: 45 บาท/กก.</Text>

        <Text style={styles.label}>รายละเอียดเพิ่มเติม (ถ้ามี)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="เช่น สภาพลำไย, วิธีการเก็บเกี่ยว, สถานที่จัดส่ง..."
          multiline={true}
          numberOfLines={4}
          value={details}
          onChangeText={setDetails}
        />
        
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit} 
        >
          <Text style={styles.submitButtonText}>ลงประกาศขาย</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()} 
        >
          <Text style={styles.cancelButtonText}>ยกเลิก</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 20 },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gradeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeButtonActive: {
    borderColor: '#1E9E4F',
    backgroundColor: '#E8F5E9',
    elevation: 4,
  },
  gradeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    textAlignVertical: 'center', 
    lineHeight: Platform.OS === 'ios' ? 40 : undefined, 
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  gradeB: { backgroundColor: '#1E9E4F' }, 
  gradeC: { backgroundColor: '#0D6EfD' }, 
  gradeCC: { backgroundColor: '#FFA000' }, 
  gradeText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  gradeSubText: { fontSize: 12, color: '#888' },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    fontSize: 16,
    color: '#333',
  },
  inputSuffix: { fontSize: 16, color: '#888', paddingHorizontal: 15 },
  exampleText: { fontSize: 12, color: '#888', marginTop: 5, marginLeft: 5 },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top', 
    paddingTop: 15, 
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, 
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  submitButton: {
    backgroundColor: '#1E9E4F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#1E9E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  cancelButton: { paddingVertical: 10, alignItems: 'center', marginTop: 5 },
  cancelButtonText: { fontSize: 16, color: '#888' },
});