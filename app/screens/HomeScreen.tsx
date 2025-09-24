// app/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }: any) {
  async function logout() {
    await supabase.auth.signOut();
    navigation.replace('Login');
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Bienvenido a RecuerdaMed 🎉</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}