// test-login-after-fix.js
// Ejecutar después de desactivar email confirmations

require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testAfterFix() {
  console.log('🔧 Probando después de desactivar confirmación de email...');
  
  const testEmail = 'prueba' + Date.now() + '@gmail.com';
  const testPassword = 'TestPassword123';
  
  try {
    // Registro
    console.log('📝 Registrando:', testEmail);
    const { error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) throw signUpError;
    console.log('✅ Registro exitoso');
    
    // Login inmediato
    console.log('🔑 Haciendo login...');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) throw signInError;
    
    console.log('🎉 ¡LOGIN EXITOSO!');
    console.log('Usuario:', data.user?.email);
    console.log('Sesión activa:', data.session ? 'Sí' : 'No');
    console.log('\\n✅ Tu app ya debería funcionar correctamente');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testAfterFix();
