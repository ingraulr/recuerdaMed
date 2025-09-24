// app/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const clean = (s?: string) => (s ?? '').trim();

  async function handleRegister() {
    const e = clean(email);
    const p = clean(password);

    // Debug para verificar que NO van vacíos
    console.log('REGISTER ->', { email: e, passLen: p.length });

    if (!e || !p) {
      Alert.alert('Campos vacíos', 'Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email: e, password: p });
      if (error) throw error;
      Alert.alert('Registro iniciado', 'Si la confirmación por correo está activa, revisa tu email.');
    } catch (err: any) {
      console.log('signUp error ->', err?.message);
      Alert.alert('Error', err?.message ?? 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    const e = clean(email);
    const p = clean(password);

    // Debug para verificar que NO van vacíos
    console.log('LOGIN ->', { email: e, passLen: p.length });

    if (!e || !p) {
      Alert.alert('Campos vacíos', 'Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
      if (error) throw error;
      navigation.replace('Home');
    } catch (err: any) {
      console.log('signIn error ->', err?.message);
      Alert.alert('Error', err?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>RecuerdaMed</Text>

      <TextInput
        placeholder="Correo"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />

      <Button title={loading ? '...' : 'Iniciar sesión'} onPress={handleLogin} disabled={loading} />
      <Button title="Registrarse" onPress={handleRegister} disabled={loading} />
    </View>
  );
}