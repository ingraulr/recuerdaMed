// app/App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from './constants/Colors';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MedicationFormScreen from './screens/MedicationFormScreen';
import MedicamentosScreen from './screens/MedicamentosScreen';
import HorariosScreen from './screens/HorariosScreen';
import HorarioFormScreen from './screens/HorarioFormScreen';
import RecordatoriosScreen from './screens/RecordatoriosScreen';
import HistorialScreen from './screens/HistorialScreen';
import DebugScreen from './screens/DebugScreen';

const Stack = createNativeStackNavigator();

// Tema personalizado con los nuevos colores
const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.primary,
    primary: Colors.primary,
  },
};

export default function App() {
  useEffect(() => {
    console.log('🚀🚀🚀 APP INICIADA 🚀🚀🚀');
    console.log('📍 SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No encontrada');
    console.log('📍 SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No encontrada');
    
    // Test básico de notificaciones
    const testBasic = async () => {
      try {
        console.log('🔧 Device.isDevice:', Device.isDevice);
        
        const permissions = await Notifications.getPermissionsAsync();
        console.log('🔧 Current permissions:', permissions.status);
        
      } catch (error) {
        console.error('❌ Error en test básico:', error);
      }
    };
    
    testBasic();
  }, []);

  return (
    <NavigationContainer theme={CustomTheme}>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Medicamentos" component={MedicamentosScreen} options={{ title: 'Mis Medicamentos' }} />
        <Stack.Screen name="MedicationForm" component={MedicationFormScreen} options={{ title: 'Agregar Medicamento' }} />
        <Stack.Screen name="Horarios" component={HorariosScreen} options={{ title: 'Horarios' }} />
        <Stack.Screen name="HorarioForm" component={HorarioFormScreen} options={{ title: 'Nuevo Horario' }} />
        <Stack.Screen name="Recordatorios" component={RecordatoriosScreen} options={{ title: '🔔 Recordatorios' }} />
        <Stack.Screen name="Historial" component={HistorialScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Debug" component={DebugScreen} options={{ title: '🔧 Debug' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}