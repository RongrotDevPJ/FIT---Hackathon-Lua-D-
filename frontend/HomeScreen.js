import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

// import { Ionicons } from '@expo/vector-icons'; 

export default function HomeScreen({ navigation }) {
  const userName = "สมชาย"; 
  const totalListings = 0;
  const totalOffers = 0;
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.headerGreeting}>สวัสดี คุณ{userName}</Text>
          <Text style={styles.headerTitle}>จัดการประกาศขายของคุณ</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, {borderLeftColor: '#0D6EfD'}]}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalListings}</Text>
              <Text style={styles.statLabel}>รายการทั้งหมด</Text>
            </View>
          </View>
          <View style={[styles.statCard, {borderLeftColor: '#1E9E4F'}]}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalOffers}</Text>
              <Text style={styles.statLabel}>ข้อเสนอรับซื้อ</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.postButton}
          onPress={() => navigation.navigate('CreateListing')} 
        >
          <Text style={styles.postButtonText}>+ ลงประกาศขายใหม่</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>รายการขายของคุณ</Text>
        
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyText}>ยังไม่มีรายการขาย</Text>
          <Text style={styles.emptySubText}>กดปุ่มด้านบนเพื่อเริ่มลงประกาศ</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F4F4' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#1E9E4F',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerGreeting: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerTitle: { fontSize: 16, color: '#E0E0E0' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginTop: -15, 
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 10,
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5, 
  },
  statContent: { marginLeft: 10 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 14, color: '#555' },
  postButton: {
    backgroundColor: '#1E9E4F',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    flexDirection: 'row', 
    justifyContent: 'center',
    shadowColor: '#1E9E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 5, 
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#888', marginTop: 10 },
  emptySubText: { fontSize: 14, color: '#AAA', marginTop: 5 },
});