import React from 'react';
import { Platform, View } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; //

// --- 1. Import ทุกหน้าจอ (รวมของใหม่!) ---
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

// (บ้านเกษตรกร)
import HomeScreen from './HomeScreen'; 
import CreateListingScreen from './CreateListingScreen'; 
import OffersScreen from './OffersScreen'; 
import ProfileScreen from './ProfileScreen'; 

// (บ้านผู้ซื้อ... ที่เราเพิ่งสร้าง)
import MarketScreen from './MarketScreen'; 
import MyBidsScreen from './MyBidsScreen'; 

// --- 2. สร้าง "กล่อง" ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 3. "บ้านเกษตรกร" (MainAppTabs) ---
// (โค้ดนี้คือฉบับ "พอดี" ที่เราแก้กันล่าสุด)
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
          height: Platform.OS === 'ios' ? 90 : 75, 
          paddingBottom: Platform.OS === 'android' ? 5 : 0, 
        }
      }}
    >
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
      <Tab.Screen
        name="PostTab"
        component={CreateListingScreen}
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

// --- 4. [ ใหม่! ] "บ้านผู้ซื้อ" (BuyerAppTabs) ---
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
          height: Platform.OS === 'ios' ? 90 : 75, 
          paddingBottom: Platform.OS === 'android' ? 5 : 0, 
        }
      }}
    >
      <Tab.Screen 
        name="MarketTab" 
        component={MarketScreen} 
        options={{ 
          title: 'ตลาดลำไย',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" color={color} size={size} />
          ),
        }} 
      />
      <Tab.Screen 
        name="MyBidsTab" 
        component={MyBidsScreen} 
        options={{ 
          title: 'ข้อเสนอของฉัน',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-ellipses-outline" color={color} size={size} />
          ),
        }} 
      />
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


// --- 5. App หลัก (ที่รู้จัก "บ้าน" 2 หลัง!) ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        
        {/* === กลุ่มที่ 1: "ก่อน" ล็อกอิน === */}
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

        {/* === กลุ่มที่ 2: "หลัง" ล็อกอิน (บ้าน 2 หลัง) === */}
        <Stack.Screen 
          name="MainApp" // บ้านเกษตรกร
          component={MainAppTabs} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="BuyerApp" // บ้านผู้ซื้อ
          component={BuyerAppTabs} 
          options={{ headerShown: false }} 
        />

        {/* === กลุ่มที่ 3: หน้า "เด้ง" ทับแท็บ (ของเกษตรกร) === */}
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