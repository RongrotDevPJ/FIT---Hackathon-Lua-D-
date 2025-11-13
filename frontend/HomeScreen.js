import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons'; //

export default function HomeScreen({ navigation }) {
  const userName = "สมชาย"; 
  const totalListings = 5; 
  const totalOffers = 3;  
  
  const goToCreateListing = () => {
    navigation.navigate('CreateListing'); //
  };
  const goToOffers = () => {
    navigation.navigate('OffersTab'); // <-- แก้ให้ไปที่แท็บ 'OffersTab' (ตาม App.js)
  };
  const goToProfile = () => {
    navigation.navigate('ProfileTab'); // <-- แก้ให้ไปที่แท็บ 'ProfileTab' (ตาม App.js)
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>สวัสดี คุณ{userName}</Text>
            <Text style={styles.headerTitle}>จัดการประกาศขายของคุณ</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={goToProfile} 
          >
            <Ionicons name="person-circle-outline" size={32} color="#1E9E4F" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, {borderLeftColor: '#0D6EfD'}]}>
            <Ionicons name="list" size={32} color="#0D6EfD" />
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalListings}</Text>
              <Text style={styles.statLabel}>รายการทั้งหมด</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.statCard, {borderLeftColor: '#1E9E4F'}]}
            onPress={goToOffers} 
          >
            <Ionicons name="chatbubbles" size={32} color="#1E9E4F" />
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalOffers}</Text>
              <Text style={styles.statLabel}>ข้อเสนอรับซื้อ</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.postButton}
          onPress={goToCreateListing} 
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.postButtonText}>สร้างประกาศขายผลผลิต</Text>
        </TouchableOpacity>
        
        <View style={styles.listingHeader}>
            <Text style={styles.listingTitle}>รายการขายล่าสุด</Text>
            <TouchableOpacity onPress={goToOffers}><Text style={styles.viewAll}>ดูทั้งหมด</Text></TouchableOpacity>
        </View>
        
        <View style={styles.listingContainer}>
            <View style={styles.emptyListing}>
                <Ionicons name="leaf-outline" size={40} color="#CCCCCC" />
                <Text style={styles.emptyText}>ยังไม่มีประกาศขาย</Text>
                <Text style={styles.emptySubText}>กดปุ่ม "สร้างประกาศขายผลผลิต" เพื่อเริ่มต้น</Text>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- [ นี่คือ StyleSheet "ฉบับเต็ม" ที่ถูกต้อง ] ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // พื้นหลังสีขาวตามดีไซน์ใหม่
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTitle: {
    fontSize: 16,
    color: '#888',
  },
  profileButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    marginTop: 10,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
  },
  statContent: {
    marginLeft: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  postButton: {
    backgroundColor: '#1E9E4F',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 15,
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
    marginLeft: 10,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    fontSize: 14,
    color: '#1E9E4F',
    fontWeight: 'bold',
  },
  listingContainer: {
    paddingHorizontal: 20,
  },
  emptyListing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 5,
  },
});