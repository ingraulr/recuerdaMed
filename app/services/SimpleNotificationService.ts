// app/services/SimpleNotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

// Configuración global más simple
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class SimpleNotificationService {
  
  static async requestPermissions(): Promise<boolean> {
    console.log('🔧 === REQUESTING PERMISSIONS ===');
    console.log('🔧 Device.isDevice:', Device.isDevice);
    console.log('🔧 Platform:', Platform.OS);
    
    if (!Device.isDevice) {
      console.log('❌ Not a physical device - notifications may not work');
      // En desarrollo con Expo Go, continuamos pero advertimos
      console.log('⚠️ Continuing anyway for development testing...');
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔧 Current status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('🔧 Requesting new permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔧 New status:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Permission denied');
        Alert.alert('Permisos requeridos', 'Necesitas habilitar las notificaciones en la configuración');
        return false;
      }

      // Configurar canal para Android de forma simple
      if (Platform.OS === 'android') {
        console.log('🔧 Setting up Android channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('✅ Android channel configured');
      }
      
      console.log('✅ Permissions granted');
      return true;

    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      Alert.alert('Error', `No se pudieron solicitar permisos: ${error}`);
      return false;
    }
  }

  static async scheduleTestNotification(): Promise<string | null> {
    console.log('🧪 === SCHEDULING TEST NOTIFICATION ===');
    
    try {
      console.log('🔧 Step 1: Requesting permissions...');
      const hasPermission = await this.requestPermissions();
      console.log('🔧 Permission result:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ No permissions, aborting');
        Alert.alert('Sin permisos', 'No se pudieron obtener permisos de notificación');
        return null;
      }

      console.log('🔧 Step 2: Creating notification content...');
      const notificationContent = {
        title: '🧪 Test RecuerdaMed',
        body: 'Si ves esto, las notificaciones funcionan!',
      };
      console.log('🔧 Notification content:', notificationContent);

      console.log('🔧 Step 3: Creating trigger...');
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      } as const;
      console.log('🔧 Trigger:', trigger);

      console.log('🔧 Step 4: Calling scheduleNotificationAsync...');
      
      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: trigger,
      });

      console.log('✅ Notification scheduled successfully!');
      console.log('✅ Notification ID:', identifier);
      
      Alert.alert('🎉 Prueba programada', `Notificación programada con ID: ${identifier.substring(0, 8)}...\n\nDeberías verla en 3 segundos!`);
      return identifier;

    } catch (error) {
      console.error('❌ Error scheduling test:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      Alert.alert('❌ Error', `Error en prueba:\n${error}`);
      return null;
    }
  }

  static async listScheduledNotifications(): Promise<void> {
    console.log('📋 === LISTING SCHEDULED NOTIFICATIONS ===');
    
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`Total scheduled: ${scheduled.length}`);
      
      if (scheduled.length === 0) {
        console.log('No notifications scheduled');
        Alert.alert('Sin notificaciones', 'No hay notificaciones programadas');
        return;
      }

      scheduled.forEach((notif, index) => {
        console.log(`${index + 1}. ID: ${notif.identifier}`);
        console.log(`   Title: ${notif.content.title}`);
        console.log(`   Body: ${notif.content.body}`);
      });

      Alert.alert('Notificaciones', `Hay ${scheduled.length} notificaciones programadas. Ve la consola para detalles.`);

    } catch (error) {
      console.error('❌ Error listing notifications:', error);
      Alert.alert('Error', `Error listando: ${error}`);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    console.log('🗑️ === CANCELING ALL NOTIFICATIONS ===');
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications canceled');
      Alert.alert('Limpiado', 'Todas las notificaciones han sido canceladas');
    } catch (error) {
      console.error('❌ Error canceling notifications:', error);
      Alert.alert('Error', `Error cancelando: ${error}`);
    }
  }
}
