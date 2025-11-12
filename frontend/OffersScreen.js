import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons'; 

export default function OffersScreen({ navigation }) {
  
  const offers = []; // <-- ตอนนี้ว่างเปล่า

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            {/* <Ionicons name="chatbubbles-outline" size={80} color="#CCCCCC" /> */}
            <Text style={styles.emptyText}>ยังไม่มีข้อเสนอ</Text>
            <Text style={styles.emptySubText}>
              เมื่อมีผู้ซื้อยื่นข้อเสนอรับซื้อประกาศของคุณ
            </Text>
            <Text style={styles.emptySubText}>
              ข้อเสนอจะปรากฏที่นี่
            </Text>
          </View>
        ) : (
          <View>
            <Text>นี่คือรายการข้อเสนอ (List of offers)</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F4', 
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100, 
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 5,
    textAlign: 'center',
  },
});