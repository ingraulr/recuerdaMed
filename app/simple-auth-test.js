// simple-auth-test.js
// Prueba más simple para verificar el estado de Supabase Auth

require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Configuración:');
console.log('URL:', SUPABASE_URL);
console.log('Key válida:', SUPABASE_ANON_KEY ? 'Sí' : 'No');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuthStatus() {
  try {
    // Verificar si podemos acceder a auth
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('\n✅ Auth API accesible');
    console.log('Sesión actual:', session ? 'Existe' : 'Ninguna');
    
    if (error) {
      console.log('Error:', error.message);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error accediendo a Auth:', err.message);
    return false;
  }
}

async function testWithDifferentEmails() {
  const emails = [
    'usuario@test.com',
    'test123@gmail.com',
    'ejemplo@hotmail.com',
    'user@supabase.com'
  ];
  
  console.log('\n🧪 Probando diferentes formatos de email...');
  
  for (const email of emails) {
    try {
      console.log(`\nProbando: ${email}`);
      const { error } = await supabase.auth.signUp({
        email: email,
        password: 'TestPassword123!',
      });
      
      if (error) {
        console.log(`❌ Error con ${email}:`, error.message);
        
        // Analizar tipos de error específicos
        if (error.message.includes('invalid')) {
          console.log('  → Email considerado inválido por Supabase');
        } else if (error.message.includes('already registered')) {
          console.log('  → Email ya existe (esto es bueno!)');
        } else if (error.message.includes('signup')) {
          console.log('  → Problema con configuración de signup');
        }
      } else {
        console.log(`✅ Email ${email} aceptado`);
      }
    } catch (err) {
      console.log(`❌ Error general con ${email}:`, err.message);
    }
  }
}

async function checkSupabaseConfig() {
  console.log('\n⚙️  Verificando configuración del proyecto...');
  
  try {
    // Intentar una operación que requiera configuración válida
    const { data, error } = await supabase
      .from('non_existent_table')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ Proyecto configurado correctamente (tabla no existe, pero conexión OK)');
      } else if (error.message.includes('JWT')) {
        console.log('❌ Problema con JWT/Auth token');
      } else if (error.message.includes('API key')) {
        console.log('❌ Problema con API key');
      } else {
        console.log('ℹ️  Respuesta:', error.message);
      }
    } else {
      console.log('✅ Configuración válida');
    }
  } catch (err) {
    console.log('❌ Error de configuración:', err.message);
  }
}

async function runDiagnostic() {
  console.log('🔧 Iniciando diagnóstico de Supabase Auth...\n');
  
  const authAccessible = await checkAuthStatus();
  
  if (!authAccessible) {
    console.log('\n❌ No se puede acceder a Supabase Auth');
    console.log('Verifica:');
    console.log('1. URL de Supabase correcta');
    console.log('2. API Key correcta');
    console.log('3. Proyecto de Supabase activo');
    return;
  }
  
  await checkSupabaseConfig();
  await testWithDifferentEmails();
  
  console.log('\n📋 RESUMEN:');
  console.log('Si todos los emails muestran "invalid", revisa:');
  console.log('1. Dashboard de Supabase → Authentication → Settings');
  console.log('2. ¿Está habilitado "Enable email confirmations"?');
  console.log('3. ¿Hay algún patrón de email permitido configurado?');
  console.log('4. ¿El proyecto está pausado o tiene límites?');
}

runDiagnostic().catch(console.error);
