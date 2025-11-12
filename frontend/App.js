import React from 'react';
// 1. Import ทุกอย่างที่ต้องใช้
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 2. Import สกรีนของเรา (ไฟล์อยู่ในระดับเดียวกัน)
import LoginScreen from './LoginScreen'; 
import RegisterScreen from './RegisterScreen';

// 3. สร้างตัวสลับหน้า
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // 4. หุ้มแอปทั้งหมดด้วย NavigationContainer
    <NavigationContainer>
      {/* 5. ประกาศหน้าต่างๆ ที่เราจะใช้ */}
      <Stack.Navigator>
        <Stack.Screen 
          name="Login" // นี่คือชื่อที่ใช้เรียก (เช่น navigation.navigate('Login'))
          component={LoginScreen} 
          options={{ headerShown: false }} // 6. ซ่อนหัวกระดาษ (Header) ของหน้า Login
        />
        <Stack.Screen 
          name="Register" // นี่คือชื่อที่ใช้เรียก
          component={RegisterScreen} 
          options={{ title: 'สร้างบัญชีใหม่' }} // 7. ตั้งชื่อหัวกระดาษให้หน้า Register
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}