// app/screens/DebugScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { GlobalStyles } from '../constants/GlobalStyles';
import { Colors } from '../constants/Colors';

export default function DebugScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      addLog(`Sesión inicial: ${session ? 'Existe' : 'No existe'}`);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      addLog(`Auth evento: ${event}`);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN') {
        addLog('Usuario logueado correctamente');
      } else if (event === 'SIGNED_OUT') {
        addLog('Usuario cerró sesión');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      addLog('Probando conexión a Supabase...');
      const { error } = await supabase.from('_health').select('*').limit(1);
      if (error) {
        addLog(`Error de conexión: ${error.message}`);
      } else {
        addLog('Conexión exitosa a Supabase');
      }
    } catch (err: any) {
      addLog(`Error general: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    try {
      addLog(`Intentando registrar: ${testEmail}`);
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      
      if (error) {
        addLog(`Error en registro: ${error.message}`);
      } else {
        addLog(`Registro exitoso. Usuario: ${data.user?.id}`);
        addLog(`Email confirmado: ${data.user?.email_confirmed_at ? 'Sí' : 'No'}`);
      }
    } catch (err: any) {
      addLog(`Error general en registro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      addLog(`Intentando login: ${testEmail}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (error) {
        addLog(`Error en login: ${error.message}`);
      } else {
        addLog(`Login exitoso. Usuario: ${data.user?.id}`);
      }
    } catch (err: any) {
      addLog(`Error general en login: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const listUsers = async () => {
    setLoading(true);
    try {
      addLog('Intentando listar usuarios desde auth.users...');
      // Esta consulta solo funciona si tienes RLS configurado o si usas service_role key
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        addLog(`Error listando usuarios: ${error.message}`);
      } else {
        addLog(`Usuarios encontrados: ${data.users.length}`);
        data.users.forEach((user, index) => {
          addLog(`Usuario ${index + 1}: ${user.email} (confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'})`);
        });
      }
    } catch (err: any) {
      addLog(`Error general listando usuarios: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthConfig = () => {
    addLog('=== CONFIGURACIÓN DE AUTENTICACIÓN ===');
    addLog(`SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Configurada' : 'NO configurada'}`);
    addLog(`SUPABASE_ANON_KEY: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'NO configurada'}`);
    addLog(`Usuario actual: ${user?.email || 'Ninguno'}`);
    addLog(`ID Usuario: ${user?.id || 'N/A'}`);
    addLog(`Email confirmado: ${user?.email_confirmed_at ? 'Sí' : 'No'}`);
    addLog(`Sesión válida: ${session ? 'Sí' : 'No'}`);
  };

  return (
    <ScrollView style={GlobalStyles.container}>
      <View style={{ padding: 20 }}>
        <Text style={GlobalStyles.title}>Debug Supabase</Text>

        {/* Estado actual */}
        <View style={[GlobalStyles.card, { marginBottom: 20 }]}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Estado Actual
          </Text>
          <Text>Usuario: {user?.email || 'No logueado'}</Text>
          <Text>Email confirmado: {user?.email_confirmed_at ? 'Sí' : 'No'}</Text>
          <Text>Sesión: {session ? 'Activa' : 'Inactiva'}</Text>
        </View>

        {/* Campos de prueba */}
        <View style={[GlobalStyles.card, { marginBottom: 20 }]}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Datos de Prueba
          </Text>
          <TextInput
            placeholder="Email de prueba"
            value={testEmail}
            onChangeText={setTestEmail}
            style={GlobalStyles.input}
          />
          <TextInput
            placeholder="Contraseña de prueba"
            value={testPassword}
            onChangeText={setTestPassword}
            style={GlobalStyles.input}
            secureTextEntry
          />
        </View>

        {/* Botones de prueba */}
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={[GlobalStyles.button, GlobalStyles.buttonPrimary, { marginBottom: 10 }]}
            onPress={checkAuthConfig}
            disabled={loading}
          >
            <Text style={GlobalStyles.buttonText}>Verificar Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.button, GlobalStyles.buttonSecondary, { marginBottom: 10 }]}
            onPress={testConnection}
            disabled={loading}
          >
            <Text style={[GlobalStyles.buttonText, GlobalStyles.buttonTextSecondary]}>
              Probar Conexión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.button, GlobalStyles.buttonSecondary, { marginBottom: 10 }]}
            onPress={testRegister}
            disabled={loading}
          >
            <Text style={[GlobalStyles.buttonText, GlobalStyles.buttonTextSecondary]}>
              Probar Registro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.button, GlobalStyles.buttonSecondary, { marginBottom: 10 }]}
            onPress={testLogin}
            disabled={loading}
          >
            <Text style={[GlobalStyles.buttonText, GlobalStyles.buttonTextSecondary]}>
              Probar Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.button, GlobalStyles.buttonSecondary, { marginBottom: 10 }]}
            onPress={() => supabase.auth.signOut()}
            disabled={loading}
          >
            <Text style={[GlobalStyles.buttonText, GlobalStyles.buttonTextSecondary]}>
              Cerrar Sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.button, { backgroundColor: Colors.warning }, { marginBottom: 10 }]}
            onPress={() => setLogs([])}
          >
            <Text style={GlobalStyles.buttonText}>Limpiar Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[GlobalStyles.button, { backgroundColor: Colors.error }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={GlobalStyles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <View style={GlobalStyles.card}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Logs ({logs.length}/20)
          </Text>
          {logs.map((log, index) => (
            <Text 
              key={index} 
              style={{ 
                fontSize: 12, 
                fontFamily: 'monospace',
                color: Colors.textSecondary,
                marginBottom: 2 
              }}
            >
              {log}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
