// app/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

// Configuración global de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface MedicationReminder {
  id: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  time: string; // HH:MM format
  scheduleId: string;
}

export class NotificationService {
  
  /**
   * Solicita permisos de notificación
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔧 DEBUG - Verificando si es dispositivo físico:', Device.isDevice);
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('🔧 DEBUG - Estado actual de permisos:', existingStatus);
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          console.log('🔧 DEBUG - Solicitando permisos...');
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log('🔧 DEBUG - Nuevo estado de permisos:', finalStatus);
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permisos requeridos',
            'Para recibir recordatorios de medicamentos, necesitas habilitar las notificaciones en la configuración de tu dispositivo.',
            [{ text: 'OK' }]
          );
          return false;
        }
        
        // Configurar el canal de notificación en Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('medication-reminders', {
            name: 'Recordatorios de Medicamentos',
            description: 'Notificaciones para recordar tomar medicamentos',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B6B',
          });
        }
        
        return true;
      } else {
        Alert.alert(
          'Simulador detectado',
          'Las notificaciones no funcionan en el simulador. Prueba en un dispositivo físico.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Programa una notificación de recordatorio
   */
  static async scheduleMedicationReminder(reminder: MedicationReminder): Promise<string | null> {
    try {
      console.log('🔧 DEBUG - Iniciando programación de recordatorio:', reminder);
      
      const hasPermission = await this.requestPermissions();
      console.log('🔧 DEBUG - ¿Tiene permisos?:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ DEBUG - No hay permisos, cancelando');
        return null;
      }

      const [hours, minutes] = reminder.time.split(':').map(Number);
      console.log('🔧 DEBUG - Hora programada:', { hours, minutes });
      
      // Crear la fecha para hoy
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // Si la hora ya pasó hoy, programar para mañana
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      console.log('🔧 DEBUG - Configuración de notificación:', {
        title: '💊 Hora de tu medicamento',
        body: `Es hora de tomar ${reminder.medicationName}${reminder.dose ? ` (${reminder.dose})` : ''}`,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        }
      });

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Hora de tu medicamento',
          body: `Es hora de tomar ${reminder.medicationName}${reminder.dose ? ` (${reminder.dose})` : ''}`,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'MEDICATION_REMINDER',
          data: {
            medicationId: reminder.medicationId,
            scheduleId: reminder.scheduleId,
            reminderTime: reminder.time,
            type: 'medication_reminder'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      console.log(`✅ DEBUG - Recordatorio programado para ${reminder.medicationName} a las ${reminder.time} (ID: ${identifier})`);
      return identifier;
    } catch (error) {
      console.error('❌ DEBUG - Error scheduling notification:', error);
      Alert.alert('Error', `No se pudo programar el recordatorio: ${error}`);
      return null;
    }
  }

  /**
   * Programa una notificación de prueba inmediata
   */
  static async scheduleTestNotification(): Promise<string | null> {
    try {
      console.log('🧪 DEBUG - Programando notificación de prueba...');
      
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Sin permisos', 'Se necesitan permisos de notificación');
        return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Prueba de RecuerdaMed',
          body: 'Si ves esto, las notificaciones funcionan correctamente',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });

      console.log('✅ DEBUG - Notificación de prueba programada (ID:', identifier, ')');
      Alert.alert('Prueba programada', 'En 2 segundos deberías ver la notificación');
      return identifier;
    } catch (error) {
      console.error('❌ DEBUG - Error en notificación de prueba:', error);
      Alert.alert('Error', `Error en prueba: ${error}`);
      return null;
    }
  }

  /**
   * Programa múltiples recordatorios para un horario
   */
  static async scheduleMultipleReminders(reminders: MedicationReminder[]): Promise<string[]> {
    const identifiers: string[] = [];
    
    console.log('🔧 DEBUG - Programando múltiples recordatorios:', reminders);
    
    for (const reminder of reminders) {
      const id = await this.scheduleMedicationReminder(reminder);
      if (id) {
        identifiers.push(id);
      }
    }
    
    console.log(`📱 Programados ${identifiers.length} recordatorios de ${reminders.length} solicitados`);
    return identifiers;
  }

  /**
   * Cancela una notificación específica
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`🗑️ Recordatorio cancelado: ${identifier}`);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancela todas las notificaciones programadas
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Todos los recordatorios cancelados');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Obtiene todas las notificaciones programadas
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Cancela notificaciones de un medicamento específico
   */
  static async cancelMedicationNotifications(medicationId: string): Promise<void> {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.medicationId === medicationId) {
          await this.cancelNotification(notification.identifier);
        }
      }
      
      console.log(`🗑️ Recordatorios cancelados para medicamento: ${medicationId}`);
    } catch (error) {
      console.error('Error canceling medication notifications:', error);
    }
  }

  /**
   * Cancela notificaciones de un horario específico
   */
  static async cancelScheduleNotifications(scheduleId: string): Promise<void> {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.scheduleId === scheduleId) {
          await this.cancelNotification(notification.identifier);
        }
      }
      
      console.log(`🗑️ Recordatorios cancelados para horario: ${scheduleId}`);
    } catch (error) {
      console.error('Error canceling schedule notifications:', error);
    }
  }

  /**
   * Configura las acciones de respuesta a notificaciones
   */
  static setupNotificationActions(): void {
    // Configurar categorías de notificaciones con acciones
    Notifications.setNotificationCategoryAsync('MEDICATION_REMINDER', [
      {
        identifier: 'MARK_TAKEN',
        buttonTitle: '✅ Tomado',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'SNOOZE',
        buttonTitle: '⏰ Recordar en 15 min',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'SKIP',
        buttonTitle: '⏭️ Omitir',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }

  /**
   * Programa un recordatorio de snooze (repetir en X minutos)
   */
  static async scheduleSnoozeReminder(
    reminder: MedicationReminder,
    delayMinutes: number = 15
  ): Promise<string | null> {
    try {
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + delayMinutes);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Recordatorio (Repetición)',
          body: `No olvides tomar ${reminder.medicationName}${reminder.dose ? ` (${reminder.dose})` : ''}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'MEDICATION_REMINDER',
          data: {
            medicationId: reminder.medicationId,
            scheduleId: reminder.scheduleId,
            reminderTime: reminder.time,
            type: 'medication_snooze',
            isSnooze: true
          },
        },
        trigger: {
          date: scheduledTime,
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      });

      console.log(`⏰ Recordatorio snooze programado para ${delayMinutes} minutos (ID: ${identifier})`);
      return identifier;
    } catch (error) {
      console.error('Error scheduling snooze notification:', error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  static async getNotificationStats(): Promise<{
    total: number;
    byMedication: { [medicationId: string]: number };
    nextReminder?: { time: Date; medicationName: string };
  }> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const stats = {
        total: scheduled.length,
        byMedication: {} as { [medicationId: string]: number },
        nextReminder: undefined as { time: Date; medicationName: string } | undefined,
      };

      let nextReminderTime: Date | null = null;
      let nextReminderName = '';

      for (const notification of scheduled) {
        const medicationId = notification.content.data?.medicationId as string;
        if (medicationId) {
          stats.byMedication[medicationId] = (stats.byMedication[medicationId] || 0) + 1;
        }

        // Encontrar el próximo recordatorio
        if (notification.trigger && 'date' in notification.trigger) {
          const triggerDate = new Date(notification.trigger.date as number);
          if (!nextReminderTime || triggerDate < nextReminderTime) {
            nextReminderTime = triggerDate;
            nextReminderName = notification.content.title || 'Medicamento';
          }
        }
      }

      if (nextReminderTime) {
        stats.nextReminder = {
          time: nextReminderTime,
          medicationName: nextReminderName,
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        byMedication: {},
      };
    }
  }
}

export default NotificationService;
