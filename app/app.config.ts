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
      },
      permissions: [
        'NOTIFICATIONS',
        'WAKE_LOCK',
        'RECEIVE_BOOT_COMPLETED'
      ]
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
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsewaxjelmyiwuyogquf.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZXdheGplbG15aXd1eW9ncXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Nzk2OTgsImV4cCI6MjA3NDI1NTY5OH0.jjNhP7TRmhJDBE1qN82DTQBetxcNtGadPofiTDRduto',
    },
  },
};