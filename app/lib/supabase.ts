// app/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const fromEnv = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

const fromExtra = (Constants.expoConfig?.extra ?? {}) as {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
};

const SUPABASE_URL = fromEnv.url ?? fromExtra.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = fromEnv.key ?? fromExtra.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('EXTRA =>', Constants.expoConfig?.extra); // debug
  throw new Error('Faltan variables: SUPABASE_URL o SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true },
});