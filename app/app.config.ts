// app/app.config.ts
import 'dotenv/config'; // <-- IMPORTANTE para que cargue .env en dev

export default {
  expo: {
    name: 'RecuerdaMed',
    slug: 'recuerdamed',
    android: { package: 'com.tuempresa.recuerdamed' },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};