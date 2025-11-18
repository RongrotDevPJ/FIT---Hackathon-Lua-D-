import React from 'react';
import { Platform, View, TouchableOpacity } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; //

// --- 1. Import ทุกหน้าจอ (ครบ!) ---
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

// (บ้านเกษตรกร)
import HomeScreen from './HomeScreen'; 
import CreateListingScreen from './CreateListingScreen'; 
import OffersScreen from './OffersScreen'; 
import ProfileScreen from './ProfileScreen'; 
// (MyListingsScreen ไม่ได้ใช้แล้ว)

// (บ้านผู้ซื้อ)
import MarketScreen from './MarketScreen'; 
import MyBidsScreen from './MyBidsScreen'; // 📍 [หมายเหตุ] ไฟล์นี้ไม่ได้ใช้ในแท็บแล้ว แต่ CreateBidScreen ยังใช้ชื่อนี้อยู่
import CreateBidScreen from './CreateBidScreen'; 
// (MyOrdersScreen ไม่ได้ใช้แล้ว)

// (ห้องที่ใช้ร่วมกัน)
import NewsScreen from './NewsScreen'; // <-- [สำคัญ!] ห้องข่าวสาร

// --- 2. สร้าง "กล่อง" ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 3. สร้าง "ปุ่มบวก" ลอย (ที่กลางเป๊ะ) ---
const CustomTabButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -20, 
      justifyContent: 'center', 
      alignItems: 'center', 
      shadowColor: '#1E9E4F',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    }}
    onPress={onPress}
  >
    <View style={{
      width: 60, 
      height: 60,
      borderRadius: 30,
      backgroundColor: '#1E9E4F', 
      justifyContent: 'center', 
      alignItems: 'center', 
    }}>
      {children}
    </View>
  </TouchableOpacity>
);

// --- 4. "บ้านเกษตรกร" (5 แท็บ - [แก้แล้ว!]) ---
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E9E4F' }, 
        headerTintColor: '#FFFFFF', 
        tabBarActiveTintColor: '#1E9E4F', 
        tabBarInactiveTintColor: '#888', 
        tabBarLabelStyle: {
          paddingBottom: Platform.OS === 'android' ? 8 : 0,
          fontSize: 12,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 80, 
          paddingBottom: Platform.OS === 'android' ? 10 : 0, 
        }
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'หน้าหลัก', tabBarIcon: ({ color, size }) => (<Ionicons name="home-outline" color={color} size={size} />), }} />
      <Tab.Screen name="OffersTab" component={OffersScreen} options={{ title: 'ข้อเสนอ', tabBarIcon: ({ color, size }) => (<Ionicons name="chatbubbles-outline" color={color} size={size} />), }} />
      <Tab.Screen
        name="PostTab"
        component={CreateListingScreen}
        options={{ 
          title: 'ลงประกาศ',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="add" color="#FFFFFF" size={30} />
          ),
          tabBarButton: (props) => (
            <CustomTabButton {...props} />
          ),
          tabBarLabel: () => null, 
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); 
            navigation.navigate('CreateListing'); 
          },
        })}
      />
      {/* --- [แก้แล้ว!] เปลี่ยน "รายการขาย" เป็น "ข่าวสาร" --- */}
      <Tab.Screen 
        name="NewsTab" 
        component={NewsScreen} 
        options={{ 
          title: 'ข่าวสาร',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" color={color} size={size} />
          ),
        }} 
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'โปรไฟล์', tabBarIcon: ({ color, size }) => (<Ionicons name="person-outline" color={color} size={size} />), }} />
    </Tab.Navigator>
  );
}

// --- 5. "บ้านผู้ซื้อ" (5 แท็บ - ข่าวสาร) ---
// [ 📍📍📍 START: EDIT 📍📍📍 ]
// แก้ไข 'MyBidsTab'
function BuyerAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E9E4F' }, 
        headerTintColor: '#FFFFFF', 
        tabBarActiveTintColor: '#1E9E4F', 
        tabBarInactiveTintColor: '#888', 
        tabBarLabelStyle: {
          paddingBottom: Platform.OS === 'android' ? 8 : 0,
          fontSize: 12,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 80, 
          paddingBottom: Platform.OS === 'android' ? 10 : 0, 
        }
      }}
    >
      <Tab.Screen name="MarketTab" component={MarketScreen} options={{ title: 'ตลาดลำไย', tabBarIcon: ({ color, size }) => (<Ionicons name="storefront-outline" color={color} size={size} />), }} />
      
      {/* --- [ 📍 FIXED! ] --- */}
      {/* เปลี่ยนจาก MyBidsScreen เป็น OffersScreen เพราะ OffersScreen รองรับทั้ง 2 role */}
      <Tab.Screen 
        name="MyBidsTab" 
        component={OffersScreen}  // <-- แก้ไขตรงนี้
        options={{ 
          title: 'รายการเจรจา', // <-- แก้ไขชื่อ Title
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-ellipses-outline" color={color} size={size} />
          ), 
        }} 
      />
      {/* ---------------------- */}

      <Tab.Screen
        name="PostBidTab"
        component={CreateBidScreen}
        options={{ 
          title: 'โพสต์รับซื้อ',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="add" color="#FFFFFF" size={30} />
          ),
          tabBarButton: (props) => (
            <CustomTabButton {...props} />
          ),
          tabBarLabel: () => null, 
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); 
            navigation.navigate('CreateBid'); 
          },
        })}
      />
      {/* --- (แท็บข่าวสาร - เหมือนกัน) --- */}
      <Tab.Screen 
        name="NewsTab" 
        component={NewsScreen} 
        options={{ 
          title: 'ข่าวสาร',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" color={color} size={size} />
          ),
        }} 
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'โปรไฟล์', tabBarIcon: ({ color, size }) => (<Ionicons name="person-outline" color={color} size={size} />), }} />
    </Tab.Navigator>
  );
}
// [ 📍📍📍 END: EDIT 📍📍📍 ]


// --- 6. App หลัก (ฉบับสมบูรณ์) ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ 
            title: 'สร้างบัญชีใหม่',
            presentation: 'modal',
            headerStyle: { backgroundColor: '#1E9E4F' },
            headerTintColor: '#FFFFFF',
          }} 
        />
        <Stack.Screen name="MainApp" component={MainAppTabs} options={{ headerShown: false }} />
        <Stack.Screen name="BuyerApp" component={BuyerAppTabs} options={{ headerShown: false }} />
        <Stack.Screen 
          name="CreateListing" 
          component={CreateListingScreen} 
          options={{ 
            title: 'ลงประกาศขาย',
            presentation: 'modal', 
            headerStyle: { backgroundColor: '#1E9E4F' },
            headerTintColor: '#FFFFFF',
          }} 
        />
        <Stack.Screen 
          name="CreateBid" 
          component={CreateBidScreen} 
          options={{ 
            title: 'ลงประกาศรับซื้อ',
            presentation: 'modal', 
            headerStyle: { backgroundColor: '#1E9E4F' },
            headerTintColor: '#FFFFFF',
          }} 
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}พrr