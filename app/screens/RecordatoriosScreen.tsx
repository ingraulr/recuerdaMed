// app/screens/RecordatoriosScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Modal,
  TextInput,
  RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { GlobalStyles, Colors, Layout, Typography } from '../constants/GlobalStyles';
import LoadingAnimation from '../components/LoadingAnimation';
import { NotificationService } from '../services/NotificationService';
import * as Notifications from 'expo-notifications';
import { GradientBackground } from '../components/GradientBackground';

interface Recordatorio {
  id: string;
  medication_id: string;
  schedule_id: string;
  medication_name: string;
  dose: string;
  unit: string;
  time: string;
  enabled: boolean;
  notification_id?: string;
  created_at: string;
}

export default function RecordatoriosScreen() {
  const navigation = useNavigation<any>();
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecordatorio, setEditingRecordatorio] = useState<Recordatorio | null>(null);
  const [newTime, setNewTime] = useState('');
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadRecordatorios();
    loadScheduledNotifications();
  }, []);

  async function loadRecordatorios() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener todos los horarios con información de medicamentos
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select(`
          id,
          medication_id,
          fixed_times,
          medications (
            id,
            name,
            dose,
            unit
          )
        `)
        .eq('patient_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convertir horarios a recordatorios individuales
      const recordatoriosFlat: Recordatorio[] = [];
      
      (schedules || []).forEach((schedule: any) => {
        const medication = schedule.medications;
        if (medication && schedule.fixed_times) {
          schedule.fixed_times.forEach((time: string) => {
            recordatoriosFlat.push({
              id: `${schedule.id}-${time}`,
              medication_id: schedule.medication_id,
              schedule_id: schedule.id,
              medication_name: medication.name,
              dose: medication.dose || '',
              unit: medication.unit || '',
              time: time,
              enabled: true,
              created_at: new Date().toISOString(),
            });
          });
        }
      });

      setRecordatorios(recordatoriosFlat);
    } catch (error) {
      console.error('Error loading recordatorios:', error);
      Alert.alert('Error', 'No se pudieron cargar los recordatorios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledNotifications(notifications);
      console.log('📱 Notificaciones programadas:', notifications.length);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([loadRecordatorios(), loadScheduledNotifications()]);
  }, []);

  async function toggleRecordatorio(recordatorio: Recordatorio) {
    try {
      const newEnabled = !recordatorio.enabled;
      
      if (newEnabled) {
        // Activar recordatorio - programar notificación
        const hasPermission = await NotificationService.requestPermissions();
        if (!hasPermission) {
          Alert.alert('Permisos requeridos', 'Necesitas habilitar las notificaciones.');
          return;
        }

        const reminder = {
          id: recordatorio.id,
          medicationId: recordatorio.medication_id,
          medicationName: recordatorio.medication_name,
          dose: recordatorio.dose && recordatorio.unit ? 
            `${recordatorio.dose} ${recordatorio.unit}` : '',
          time: recordatorio.time,
          scheduleId: recordatorio.schedule_id,
        };

        await NotificationService.scheduleMedicationReminder(reminder);
        Alert.alert('✅ Activado', `Recordatorio para ${recordatorio.medication_name} activado`);
      } else {
        // Desactivar recordatorio - cancelar notificación
        await NotificationService.cancelNotification(recordatorio.id);
        Alert.alert('🔕 Desactivado', `Recordatorio para ${recordatorio.medication_name} desactivado`);
      }

      // Actualizar estado local
      setRecordatorios(prev => 
        prev.map(r => 
          r.id === recordatorio.id 
            ? { ...r, enabled: newEnabled }
            : r
        )
      );

      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error toggling recordatorio:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del recordatorio');
    }
  }

  function editRecordatorio(recordatorio: Recordatorio) {
    setEditingRecordatorio(recordatorio);
    setNewTime(recordatorio.time);
    setShowEditModal(true);
  }

  async function saveEditRecordatorio() {
    if (!editingRecordatorio || !newTime) return;

    try {
      // Validar formato de hora
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(newTime)) {
        Alert.alert('Error', 'Formato de hora inválido. Use HH:MM');
        return;
      }

      // Obtener el horario actual de la base de datos
      const { data: schedule, error: fetchError } = await supabase
        .from('schedules')
        .select('fixed_times')
        .eq('id', editingRecordatorio.schedule_id)
        .single();

      if (fetchError) throw fetchError;

      // Actualizar los horarios
      const updatedTimes = (schedule.fixed_times || []).map((time: string) =>
        time === editingRecordatorio.time ? newTime : time
      );

      const { error: updateError } = await supabase
        .from('schedules')
        .update({ fixed_times: updatedTimes })
        .eq('id', editingRecordatorio.schedule_id);

      if (updateError) throw updateError;

      // Cancelar notificación anterior y programar nueva
      await NotificationService.cancelNotification(editingRecordatorio.id);
      
      if (editingRecordatorio.enabled) {
        const reminder = {
          id: `${editingRecordatorio.schedule_id}-${newTime}`,
          medicationId: editingRecordatorio.medication_id,
          medicationName: editingRecordatorio.medication_name,
          dose: editingRecordatorio.dose && editingRecordatorio.unit ? 
            `${editingRecordatorio.dose} ${editingRecordatorio.unit}` : '',
          time: newTime,
          scheduleId: editingRecordatorio.schedule_id,
        };

        await NotificationService.scheduleMedicationReminder(reminder);
      }

      Alert.alert('✅ Actualizado', 'Hora del recordatorio actualizada');
      setShowEditModal(false);
      setEditingRecordatorio(null);
      setNewTime('');
      await loadRecordatorios();
      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error updating recordatorio:', error);
      Alert.alert('Error', 'No se pudo actualizar el recordatorio');
    }
  }

  async function deleteRecordatorio(recordatorio: Recordatorio) {
    Alert.alert(
      'Eliminar Recordatorio',
      `¿Estás seguro de que quieres eliminar el recordatorio de ${recordatorio.medication_name} a las ${recordatorio.time}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Obtener horarios actuales
              const { data: schedule, error: fetchError } = await supabase
                .from('schedules')
                .select('fixed_times')
                .eq('id', recordatorio.schedule_id)
                .single();

              if (fetchError) throw fetchError;

              // Remover el horario específico
              const updatedTimes = (schedule.fixed_times || []).filter(
                (time: string) => time !== recordatorio.time
              );

              if (updatedTimes.length === 0) {
                // Si no quedan horarios, eliminar todo el schedule
                const { error: deleteError } = await supabase
                  .from('schedules')
                  .delete()
                  .eq('id', recordatorio.schedule_id);

                if (deleteError) throw deleteError;
              } else {
                // Actualizar con los horarios restantes
                const { error: updateError } = await supabase
                  .from('schedules')
                  .update({ fixed_times: updatedTimes })
                  .eq('id', recordatorio.schedule_id);

                if (updateError) throw updateError;
              }

              // Cancelar la notificación
              await NotificationService.cancelNotification(recordatorio.id);

              Alert.alert('✅ Eliminado', 'Recordatorio eliminado correctamente');
              await loadRecordatorios();
              await loadScheduledNotifications();
            } catch (error) {
              console.error('Error deleting recordatorio:', error);
              Alert.alert('Error', 'No se pudo eliminar el recordatorio');
            }
          }
        }
      ]
    );
  }

  function formatTime(time: string): string {
    try {
      const [hours, minutes] = time.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  }

  function getNotificationStatus(recordatorioId: string): boolean {
    return scheduledNotifications.some(n => n.identifier === recordatorioId);
  }

  if (loading) {
    return <LoadingAnimation message="Cargando recordatorios..." size="large" />;
  }

  return (
    <GradientBackground>
      <View style={[GlobalStyles.contentContainer, {
        paddingHorizontal: Layout.spacing.lg,
        paddingTop: Layout.spacing.md,
      }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Mis Recordatorios</Text>
        <Text style={styles.headerSubtitle}>
          {recordatorios.filter(r => r.enabled).length} de {recordatorios.length} activos
        </Text>
        <Text style={styles.notificationInfo}>
          📱 {scheduledNotifications.length} notificaciones programadas
        </Text>
      </View>

      {/* Lista de recordatorios */}
      <FlatList
        data={recordatorios}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: Layout.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isScheduled = getNotificationStatus(item.id);
          return (
            <View style={[GlobalStyles.card, styles.recordatorioCard]}>
              <View style={styles.recordatorioHeader}>
                <View style={styles.recordatorioInfo}>
                  <Text style={styles.medicationName}>{item.medication_name}</Text>
                  <Text style={styles.dosage}>
                    {item.dose && item.unit ? `${item.dose} ${item.unit}` : 'Sin dosis especificada'}
                  </Text>
                </View>
                <View style={styles.statusIndicator}>
                  <Text style={[styles.statusText, isScheduled && styles.statusActive]}>
                    {isScheduled ? '🟢' : '🔴'}
                  </Text>
                </View>
              </View>

              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>⏰ Hora:</Text>
                <Text style={styles.timeValue}>{formatTime(item.time)}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, item.enabled && styles.activeButton]}
                  onPress={() => toggleRecordatorio(item)}
                >
                  <Text style={styles.actionButtonText}>
                    {item.enabled ? '🔔 ON' : '🔕 OFF'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => editRecordatorio(item)}
                >
                  <Text style={styles.actionButtonText}>✏️ Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteRecordatorio(item)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>📅 No hay recordatorios configurados</Text>
            <Text style={styles.emptySubtext}>
              Ve a &ldquo;Horarios&rdquo; para crear tu primer recordatorio
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Horarios')}
            >
              <Text style={styles.createButtonText}>➕ Crear Horario</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de edición */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Editar Recordatorio</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {editingRecordatorio && (
              <View style={styles.editForm}>
                <Text style={styles.editMedicationName}>
                  {editingRecordatorio.medication_name}
                </Text>
                
                <Text style={styles.inputLabel}>Nueva Hora (HH:MM):</Text>
                <TextInput
                  style={styles.timeInput}
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="00:00"
                  keyboardType="numeric"
                  maxLength={5}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveEditRecordatorio}
                  >
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.medium,
  },

  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },

  headerSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },

  notificationInfo: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },

  recordatorioCard: {
    marginBottom: Layout.spacing.md,
  },

  recordatorioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.md,
  },

  recordatorioInfo: {
    flex: 1,
  },

  medicationName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },

  dosage: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  statusIndicator: {
    alignItems: 'center',
  },

  statusText: {
    fontSize: 20,
  },

  statusActive: {
    // Adicional styling if needed
  },

  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    backgroundColor: Colors.background,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },

  timeLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginRight: Layout.spacing.md,
  },

  timeValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginHorizontal: Layout.spacing.xs,
    alignItems: 'center',
  },

  activeButton: {
    backgroundColor: Colors.success,
  },

  editButton: {
    backgroundColor: Colors.warning,
  },

  deleteButton: {
    backgroundColor: Colors.error,
  },

  actionButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.surface,
  },

  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },

  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },

  emptySubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },

  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },

  createButtonText: {
    color: Colors.surface,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.base,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },

  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },

  closeButton: {
    padding: Layout.spacing.sm,
  },

  closeButtonText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
  },

  editForm: {
    gap: Layout.spacing.md,
  },

  editMedicationName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },

  inputLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },

  timeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
    backgroundColor: Colors.background,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.lg,
  },

  modalButton: {
    flex: 1,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginHorizontal: Layout.spacing.xs,
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },

  saveButton: {
    backgroundColor: Colors.primary,
  },

  saveButtonText: {
    color: Colors.surface,
    fontWeight: Typography.weights.semibold,
  },
});
