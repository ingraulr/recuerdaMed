// app/test-notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Simple notification test
export const testNotifications = async () => {
  console.log('🔧 Testing notifications...');
  
  try {
    console.log('Device.isDevice:', Device.isDevice);
    
    if (!Device.isDevice) {
      console.log('❌ Notifications only work on physical devices');
      return false;
    }

    // Check current permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      console.log('Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('New permission status:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Permission denied');
      return false;
    }

    console.log('✅ Permissions granted, scheduling test notification...');

    // Schedule a simple notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 Test Notification",
        body: "If you see this, notifications work!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });

    console.log('✅ Notification scheduled with ID:', notificationId);
    return true;

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
    return false;
  }
};

// Call the test
testNotifications();
