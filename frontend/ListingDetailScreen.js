import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, 
  TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ListingDetailScreen({ route, navigation }) {
  // รับค่า item ที่ส่งมาจากหน้า Home หรือ Market
  const { item, source } = route.params || {};
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id);
    };
    loadUser();
  }, []);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{textAlign:'center', marginTop:20}}>ไม่พบข้อมูลสินค้า</Text>
      </SafeAreaView>
    );
  }

  // เช็คว่าเป็นประกาศของตัวเองหรือไม่?
  const isOwner = currentUserId === (item.ownerId || item.farmerId || item.buyerId);

  // ฟังก์ชันไปหน้าเจรจา
  const handleStartNegotiation = () => {
    if (isOwner) {
      Alert.alert("แจ้งเตือน", "คุณไม่สามารถเจรจากับประกาศของตัวเองได้");
      return;
    }
    // ส่งข้อมูล item ไปที่หน้า NegotiationDetail เพื่อเริ่มดีลใหม่
    // (ตรงนี้ส่งข้อมูลถูกต้องแล้วครับ ปัญหาที่เลข 0 น่าจะอยู่ที่ไฟล์รับ)
    navigation.navigate('NegotiationDetail', { item: item });
  };

  // จัดการวันที่
  let dateString = '...';
  if (item.createdAt && item.createdAt._seconds) {
     dateString = new Date(item.createdAt._seconds * 1000).toLocaleDateString("th-TH");
  } else if (item.createdAt) {
     dateString = new Date(item.createdAt).toLocaleDateString("th-TH");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header Image / Icon */}
        <View style={styles.imageContainer}>
          <Ionicons name="leaf" size={80} color="#1E9E4F" />
          <Text style={styles.headerTitle}>
            {item.type === 'buy' ? 'ประกาศรับซื้อ' : 'ประกาศขาย'}
          </Text>
          <View style={styles.gradeBadge}>
             <Text style={styles.gradeText}>เกรด {item.grade}</Text>
          </View>
        </View>

        {/* รายละเอียดหลัก */}
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>ราคา (บาท/กก.)</Text>
                    <Text style={styles.valueHighlight}>
                        {item.requestedPrice ? Number(item.requestedPrice).toFixed(2) : '-'}
                    </Text>
                </View>
                <View style={styles.dividerV} />
                <View style={styles.infoBox}>
                    <Text style={styles.label}>ปริมาณ (กก.)</Text>
                    <Text style={styles.value}>
                        {item.amountKg ? Number(item.amountKg).toLocaleString() : '-'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.dividerH} />
            
            <View style={styles.rowBetween}>
                <Text style={styles.totalLabel}>มูลค่ารวมประมาณ</Text>
                <Text style={styles.totalValue}>
                    {((item.amountKg || 0) * (item.requestedPrice || 0)).toLocaleString()} บาท
                </Text>
            </View>
        </View>

        {/* ข้อมูลเพิ่มเติม */}
        <View style={styles.section}>
            <View style={styles.rowDetail}>
                <Ionicons name="location-sharp" size={20} color="#666" />
                <Text style={styles.detailText}>
                    {item.province || 'ไม่ระบุจังหวัด'} {item.amphoe ? `• ${item.amphoe}` : ''}
                </Text>
            </View>
            <View style={styles.rowDetail}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.detailText}>ลงประกาศเมื่อ: {dateString}</Text>
            </View>
            <View style={styles.rowDetail}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
                <Text style={styles.detailText}>
                    {item.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </Text>
            </View>
        </View>

      </ScrollView>

      {/* ปุ่ม Action Bar ด้านล่าง */}
      {!isOwner && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.negotiateButton} onPress={handleStartNegotiation}>
                {/* ลบ Icon ตรงนี้ออกแล้ว เพื่อไม่ให้ขึ้นตัว ? */}
                <Text style={styles.negotiateButtonText}>สนใจ / ต่อรองราคา</Text>
            </TouchableOpacity>
          </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  imageContainer: {
      alignItems: 'center', padding: 30, backgroundColor: '#FFF',
      borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
      marginBottom: 15, elevation: 3
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 10 },
  gradeBadge: { 
      backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 5, 
      borderRadius: 20, marginTop: 10, borderWidth:1, borderColor:'#C8E6C9' 
  },
  gradeText: { color: '#1E9E4F', fontWeight: 'bold', fontSize: 16 },
  
  card: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 20, borderRadius: 15, elevation: 2, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  infoBox: { alignItems: 'center', flex: 1 },
  label: { fontSize: 14, color: '#888', marginBottom: 5 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  valueHighlight: { fontSize: 22, fontWeight: 'bold', color: '#1E9E4F' },
  dividerV: { width: 1, height: '100%', backgroundColor: '#EEE' },
  dividerH: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, color: '#555' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#1E9E4F' },

  section: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 20, borderRadius: 15, elevation: 2, marginBottom: 100 },
  rowDetail: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  detailText: { marginLeft: 10, fontSize: 16, color: '#444', flex: 1, lineHeight: 22 },

  footer: { 
      position: 'absolute', bottom: 0, left: 0, right: 0, 
      backgroundColor: '#FFF', padding: 20, 
      borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 
  },
  negotiateButton: {
      backgroundColor: '#1E9E4F', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
      paddingVertical: 15, borderRadius: 10,
  },
  negotiateButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});