import React from 'react';
import { Platform, View } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// --- [ 1. Import ไอคอน (ถูกต้อง!) ] ---
import { Ionicons } from '@expo/vector-icons'; 

// --- Import หน้าจอ (เหมือนเดิม) ---
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import HomeScreen from './HomeScreen'; 
import CreateListingScreen from './CreateListingScreen'; 
import OffersScreen from './OffersScreen'; 
import ProfileScreen from './ProfileScreen'; 

// --- สร้าง "กล่อง" (เหมือนเดิม) ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 3. "บ้าน" ที่รวม 4 แท็บล่าง (ฉบับ "พอดี"!) ---
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E9E4F' }, 
        headerTintColor: '#FFFFFF', 
        tabBarActiveTintColor: '#1E9E4F', 
        tabBarInactiveTintColor: '#888', 
        
        // --- [ 1. แก้ไข Label Style ] ---
        tabBarLabelStyle: {
          paddingBottom: Platform.OS === 'android' ? 8 : 0, // <-- ดันชื่อขึ้น (จาก 5 เป็น 8)
          fontSize: 12,
        },
        
        // --- [ 2. แก้ไข Bar Style ] ---
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 75, // <-- "ความสูงที่พอดี" (คงไว้ 75)
          paddingBottom: Platform.OS === 'android' ? 5 : 0, // <-- ดันไอคอนขึ้น (จาก 10 เหลือ 5)
        }
        // ---------------------------------------------
      }}
    >
      {/* แท็บที่ 1: หน้าหลัก */}
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          title: 'หน้าหลัก',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }} 
      />
      
      {/* แท็บที่ 2: ข้อเสนอ */}
      <Tab.Screen 
        name="OffersTab" 
        component={OffersScreen} 
        options={{ 
          title: 'ข้อเสนอ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }} 
      />
      
      {/* แท็บที่ 3: ลงประกาศ (ปุ่มบวก) */}
      <Tab.Screen
        name="PostTab"
        component={CreateListingScreen} // *หลอก*
        options={{ 
          title: 'ลงประกาศ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size * 1.3} /> 
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); 
            navigation.navigate('CreateListing'); 
          },
        })}
      />
      
      {/* แท็บที่ 4: โปรไฟล์ */}
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ 
          title: 'โปรไฟล์',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

// --- 4. นี่คือ App หลัก (ฉบับ "คืนค่า" ที่ถูกต้อง!) ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        
        {/* === กลุ่มที่ 1: "Login" ต้องอยู่บนสุด! === */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
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

        {/* === กลุ่มที่ 2: "บ้าน" หลังล็อกอิน === */}
        <Stack.Screen 
          name="MainApp"
          component={MainAppTabs} 
          options={{ headerShown: false }} 
        />

        {/* === กลุ่มที่ 3: หน้า "เด้ง" ทับแท็บ === */}
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
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}