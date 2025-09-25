// app/app.config.ts
import 'dotenv/config'; // <-- IMPORTANTE para que cargue .env en dev

export default {
  expo: {
    name: 'RecuerdaMed',
    slug: 'recuerdamed-workspace',
    version: '1.0.0',
    projectId: 'a6a3671a-63e3-4f71-990f-ee18993b9574',
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    developmentClient: {
      silentLaunch: true,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.recuerdamed.app'
    },
    android: { 
      package: 'com.recuerdamed.app',
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png'
      }
    },
    web: {
      bundler: 'metro',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-dev-client',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#ffffff',
          defaultChannel: 'default'
        }
      ]
    ],
    extra: {
      eas: {
        projectId: 'a6a3671a-63e3-4f71-990f-ee18993b9574'
      },
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};