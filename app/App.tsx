// app/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MedicationFormScreen from './screens/MedicationFormScreen';
import MedicamentosScreen from './screens/MedicamentosScreen';
import HorariosScreen from './screens/HorariosScreen';
import HorarioFormScreen from './screens/HorarioFormScreen';
import HistorialScreen from './screens/HistorialScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Medicamentos" component={MedicamentosScreen} options={{ title: 'Mis Medicamentos' }} />
        <Stack.Screen name="MedicationForm" component={MedicationFormScreen} options={{ title: 'Agregar Medicamento' }} />
        <Stack.Screen name="Horarios" component={HorariosScreen} options={{ title: 'Horarios' }} />
        <Stack.Screen name="HorarioForm" component={HorarioFormScreen} options={{ title: 'Nuevo Horario' }} />
        <Stack.Screen name="Historial" component={HistorialScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}