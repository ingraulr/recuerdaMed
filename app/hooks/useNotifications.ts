// app/hooks/useNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { NotificationService, MedicationReminder } from '../services/NotificationService';
import { supabase } from '../lib/supabase';

export interface UseNotificationsReturn {
  hasPermission: boolean;
  isLoading: boolean;
  scheduledCount: number;
  requestPermissions: () => Promise<boolean>;
  scheduleRemindersForSchedule: (scheduleId: string) => Promise<void>;
  cancelScheduleReminders: (scheduleId: string) => Promise<void>;
  cancelAllReminders: () => Promise<void>;
  refreshScheduledCount: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const refreshScheduledCount = useCallback(async () => {
    try {
      const scheduled = await NotificationService.getScheduledNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('Error refreshing scheduled count:', error);
      setScheduledCount(0);
    }
  }, []);

  // Verificar permisos al inicializar
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('Error checking notification permissions:', error);
        setHasPermission(false);
      }
    };

    const handleMarkTaken = async (data: any) => {
      try {
        const { scheduleId } = data;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && scheduleId) {
          const now = new Date();
          const { error } = await supabase
            .from('doses')
            .insert({
              patient_user_id: user.id,
              schedule_id: scheduleId,
              planned_at: now.toISOString(),
              status: 'done'
            });

          if (error) {
            console.error('Error marking dose as taken:', error);
          } else {
            console.log('✅ Dosis marcada como tomada desde notificación');
          }
        }
      } catch (error) {
        console.error('Error handling mark taken:', error);
      }
    };

    const handleSnooze = async (data: any) => {
      try {
        const reminder = {
          id: data.scheduleId || '',
          medicationId: data.medicationId || '',
          medicationName: data.medicationName || 'Medicamento',
          dose: data.dose || '',
          time: data.reminderTime || '',
          scheduleId: data.scheduleId || '',
        };

        await NotificationService.scheduleSnoozeReminder(reminder, 15);
        console.log('⏰ Recordatorio reagendado para 15 minutos');
      } catch (error) {
        console.error('Error handling snooze:', error);
      }
    };

    const handleSkip = async (data: any) => {
      try {
        const { scheduleId } = data;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && scheduleId) {
          const now = new Date();
          const { error } = await supabase
            .from('doses')
            .insert({
              patient_user_id: user.id,
              schedule_id: scheduleId,
              planned_at: now.toISOString(),
              status: 'skipped'
            });

          if (error) {
            console.error('Error marking dose as skipped:', error);
          } else {
            console.log('⏭️ Dosis marcada como omitida desde notificación');
          }
        }
      } catch (error) {
        console.error('Error handling skip:', error);
      }
    };

    const setupNotificationActions = () => {
      NotificationService.setupNotificationActions();

      // Listener para respuestas a notificaciones
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const { actionIdentifier, notification } = response;
          const data = notification.request.content.data;

          switch (actionIdentifier) {
            case 'MARK_TAKEN':
              await handleMarkTaken(data);
              break;
            case 'SNOOZE':
              await handleSnooze(data);
              break;
            case 'SKIP':
              await handleSkip(data);
              break;
            default:
              // Abrir la app
              console.log('Notification tapped, opening app');
          }
        }
      );

      return () => {
        responseSubscription.remove();
      };
    };

    checkPermissions();
    refreshScheduledCount();
    const cleanup = setupNotificationActions();
    return cleanup;
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const granted = await NotificationService.requestPermissions();
      setHasPermission(granted);
      return granted;
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleRemindersForSchedule = async (scheduleId: string) => {
    setIsLoading(true);
    try {
      // Obtener información del horario
      const { data: schedule, error } = await supabase
        .from('schedules')
        .select(`
          id,
          medication_id,
          fixed_times,
          medications (
            name,
            dose,
            unit
          )
        `)
        .eq('id', scheduleId)
        .single();

      if (error || !schedule) {
        throw new Error('No se pudo encontrar el horario');
      }

      // Cancelar notificaciones existentes para este horario
      await NotificationService.cancelScheduleNotifications(scheduleId);

      // Crear recordatorios para cada hora
      const reminders: MedicationReminder[] = [];
      const medication = schedule.medications as any;
      
      for (const time of schedule.fixed_times || []) {
        reminders.push({
          id: `${scheduleId}-${time}`,
          medicationId: schedule.medication_id,
          medicationName: medication?.name || 'Medicamento',
          dose: medication?.dose && medication?.unit ? 
            `${medication.dose} ${medication.unit}` : '',
          time,
          scheduleId: scheduleId,
        });
      }

      // Programar todos los recordatorios
      const scheduledIds = await NotificationService.scheduleMultipleReminders(reminders);
      
      Alert.alert(
        '✅ Recordatorios programados',
        `Se programaron ${scheduledIds.length} recordatorios para ${medication?.name || 'tu medicamento'}.`,
        [{ text: 'OK' }]
      );

      await refreshScheduledCount();
    } catch (error: any) {
      console.error('Error scheduling reminders:', error);
      Alert.alert('Error', error.message || 'No se pudieron programar los recordatorios');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelScheduleReminders = async (scheduleId: string) => {
    setIsLoading(true);
    try {
      await NotificationService.cancelScheduleNotifications(scheduleId);
      await refreshScheduledCount();
      
      Alert.alert(
        '🗑️ Recordatorios cancelados',
        'Los recordatorios para este horario han sido cancelados.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error canceling schedule reminders:', error);
      Alert.alert('Error', 'No se pudieron cancelar los recordatorios');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAllReminders = async () => {
    setIsLoading(true);
    try {
      await NotificationService.cancelAllNotifications();
      await refreshScheduledCount();
      
      Alert.alert(
        '🗑️ Todos los recordatorios cancelados',
        'Se han cancelado todos los recordatorios de medicamentos.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error canceling all reminders:', error);
      Alert.alert('Error', 'No se pudieron cancelar todos los recordatorios');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasPermission,
    isLoading,
    scheduledCount,
    requestPermissions,
    scheduleRemindersForSchedule,
    cancelScheduleReminders,
    cancelAllReminders,
    refreshScheduledCount,
  };
};

export default useNotifications;
