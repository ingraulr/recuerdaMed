// test-supabase.js
// Script para probar la conexión con Supabase desde Node.js

require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verificando configuración de Supabase...');
console.log('URL:', SUPABASE_URL);
console.log('ANON KEY:', SUPABASE_ANON_KEY ? 'Configurada ✅' : 'NO configurada ❌');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('\n🔗 Probando conexión básica...');
  try {
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    if (error) {
      console.log('ℹ️  La tabla _health no existe (normal), pero la conexión funciona');
    } else {
      console.log('✅ Conexión exitosa');
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}

async function testAuth() {
  console.log('\n🔐 Probando sistema de autenticación...');
  
  const testEmail = 'test@gmail.com';
  const testPassword = 'TestPassword123!';
  
  console.log(`Registrando usuario de prueba: ${testEmail}`);
  
  try {
    // Intentar registrar
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.error('❌ Error en registro:', signUpError.message);
      return;
    }
    
    console.log('✅ Registro exitoso');
    console.log('Usuario ID:', signUpData.user?.id);
    console.log('Email confirmado:', signUpData.user?.email_confirmed_at ? 'Sí' : 'No');
    
    // Si la confirmación por email está desactivada, intentar login
    if (signUpData.user?.email_confirmed_at) {
      console.log('\n🚀 Probando login...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.error('❌ Error en login:', signInError.message);
        return;
      }
      
      console.log('✅ Login exitoso');
      console.log('Access Token presente:', signInData.session?.access_token ? 'Sí' : 'No');
      
      // Cerrar sesión
      await supabase.auth.signOut();
      console.log('✅ Logout exitoso');
    } else {
      console.log('ℹ️  Email no confirmado automáticamente - revisa la configuración de Supabase Auth');
    }
    
  } catch (err) {
    console.error('❌ Error general en auth:', err.message);
  }
}

async function checkAuthSettings() {
  console.log('\n⚙️  Verificando configuración de Auth...');
  
  try {
    // Intentar obtener configuración de auth (esto puede fallar con anon key)
    const { data: session } = await supabase.auth.getSession();
    console.log('Sesión actual:', session.session ? 'Existe' : 'No existe');
  } catch (err) {
    console.log('ℹ️  No se pudo obtener información de sesión');
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando pruebas de Supabase...\n');
  
  await testConnection();
  await checkAuthSettings();
  await testAuth();
  
  console.log('\n✅ Pruebas completadas');
  console.log('\n💡 Para resolver problemas de login:');
  console.log('1. Verifica que la confirmación por email esté configurada correctamente en Supabase');
  console.log('2. Revisa las políticas RLS (Row Level Security)');
  console.log('3. Confirma que la URL y las keys sean correctas');
}

runAllTests().catch(console.error);
