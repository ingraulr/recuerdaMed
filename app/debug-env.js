// Debug para verificar variables de entorno
console.log('🔍 Debugging variables de entorno:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY existe:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY length:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length);

import { supabase } from './lib/supabase';
console.log('✅ Supabase client creado correctamente');

// Test básico de conectividad
supabase.auth.getSession().then(({data, error}) => {
  console.log('🔐 Sesión actual:', data.session ? 'Existe' : 'No existe');
  if (error) console.log('❌ Error getting session:', error);
});
