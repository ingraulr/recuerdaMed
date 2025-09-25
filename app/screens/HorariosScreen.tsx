// app/screens/HorariosScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ScrollView, Modal, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { GlobalStyles, Colors, Layout, Typography } from '../constants/GlobalStyles';
import TimePickerModal from '../components/TimePickerModal';
import LoadingAnimation from '../components/LoadingAnimation';
import { NotificationService } from '../services/NotificationService';

type Row = { 
  id: string; 
  medication_id: string; 
  tz: string | null; 
  fixed_times: string[] | null; 
  medication_name: string;
  medication_image_url: string | null;
};

export default function HorariosScreen() {
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState<{ id: string; name: string }[]>([]);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<string>('');
  const [selectedFrequency, setSelectedFrequency] = useState(0);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<{[scheduleId: string]: boolean}>({});


  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const medRes = await supabase.from('medications').select('*').eq('patient_user_id', user!.id);
      setMeds(medRes.data ?? []);
      const schRes = await supabase
        .from('schedules')
        .select('id, medication_id, tz, fixed_times, medications(name, image_url)')
        .eq('patient_user_id', user!.id)
        .order('created_at', { ascending: false });
      const mapped = (schRes.data ?? []).map((r: any) => ({
        id: r.id, medication_id: r.medication_id, tz: r.tz, fixed_times: r.fixed_times,
        medication_name: r.medications?.name ?? '',
        medication_image_url: r.medications?.image_url ?? null,
      }));
      setRows(mapped);
      setLoading(false);
    })();
  }, []);

  





  async function reloadSchedules() {
    const { data: { user } } = await supabase.auth.getUser();
    const schRes = await supabase
      .from('schedules')
      .select('id, medication_id, tz, fixed_times, medications(name, image_url)')
      .eq('patient_user_id', user!.id)
      .order('created_at', { ascending: false });
    const mapped = (schRes.data ?? []).map((r: any) => ({
      id: r.id, medication_id: r.medication_id, tz: r.tz, fixed_times: r.fixed_times,
      medication_name: r.medications?.name ?? '',
      medication_image_url: r.medications?.image_url ?? null,
    }));
    setRows(mapped);
  }

  async function toggleNotifications(item: Row) {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permisos requeridos',
          'Necesitas habilitar las notificaciones para recibir recordatorios de medicamentos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const isCurrentlyEnabled = notificationsEnabled[item.id];
      
      if (isCurrentlyEnabled) {
        // Cancelar notificaciones
        await NotificationService.cancelScheduleNotifications(item.id);
        setNotificationsEnabled(prev => ({ ...prev, [item.id]: false }));
        Alert.alert('✅ Recordatorios desactivados', `Los recordatorios para ${item.medication_name} han sido cancelados.`);
      } else {
        // Activar notificaciones
        await scheduleNotificationsForSchedule(item);
        setNotificationsEnabled(prev => ({ ...prev, [item.id]: true }));
        Alert.alert('🔔 Recordatorios activados', `Los recordatorios para ${item.medication_name} han sido programados.`);
      }
    } catch (error: any) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado de las notificaciones');
    }
  }

  async function scheduleNotificationsForSchedule(schedule: Row) {
    try {
      // Obtener información completa del medicamento
      const { data: medicationData, error } = await supabase
        .from('medications')
        .select('name, dose, unit')
        .eq('id', schedule.medication_id)
        .single();

      if (error || !medicationData) {
        throw new Error('No se pudo obtener información del medicamento');
      }

      // Cancelar notificaciones existentes
      await NotificationService.cancelScheduleNotifications(schedule.id);

      // Programar nuevas notificaciones para cada horario
      const promises = (schedule.fixed_times || []).map(async (time) => {
        const reminder = {
          id: `${schedule.id}-${time}`,
          medicationId: schedule.medication_id,
          medicationName: medicationData.name,
          dose: medicationData.dose && medicationData.unit ? 
            `${medicationData.dose} ${medicationData.unit}` : '',
          time,
          scheduleId: schedule.id,
        };

        return await NotificationService.scheduleMedicationReminder(reminder);
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(id => id !== null).length;
      
      console.log(`📱 Programados ${successCount} recordatorios para ${medicationData.name}`);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      throw error;
    }
  }

  async function setupNotifications() {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permisos necesarios',
          'Para recibir recordatorios, necesitas habilitar las notificaciones en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurar', onPress: () => {
              // Aquí podrías abrir la configuración del sistema si es posible
              Alert.alert('Configuración', 'Ve a Configuración > Notificaciones > RecuerdaMed y habilita las notificaciones.');
            }}
          ]
        );
        return;
      }

      Alert.alert(
        '🔔 Recordatorios disponibles',
        'Puedes activar recordatorios individuales para cada medicamento usando el botón 🔔 en la lista de horarios.',
        [{ text: 'Entendido' }]
      );
    } catch (error) {
      console.error('Error setting up notifications:', error);
      Alert.alert('Error', 'No se pudo configurar las notificaciones');
    }
  }

  function handleTimeSelection(medId: string, frequency: number) {
    setSelectedMed(medId);
    setSelectedFrequency(frequency);
    setShowFrequencyModal(false);
    setShowTimePickerModal(true);
  }

  function getFrequencyText(freq: number): string {
    const texts = ['Una vez al día', 'Dos veces al día', 'Tres veces al día', 'Cuatro veces al día'];
    return texts[freq] || `${freq + 1} veces al día`;
  }

  async function saveQuickSchedule(times: string[]) {
    if (!selectedMed) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('schedules')
        .insert({
          medication_id: selectedMed,
          patient_user_id: user!.id,
          fixed_times: times,
        });

      if (error) throw error;

      Alert.alert('✅ Horario guardado', 'Tu horario se ha configurado correctamente');
      setShowTimePickerModal(false);
      setSelectedMed('');
      setSelectedTimes([]);
      await reloadSchedules();
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    }
  }

  function calculateScheduleTimes(frequency: number): string[] {
    const baseHour = 8; // Comenzar a las 8 AM
    const interval = Math.floor(12 / (frequency + 1)); // Distribuir en 12 horas (8 AM - 8 PM)
    
    const times: string[] = [];
    for (let i = 0; i <= frequency; i++) {
      const hour = baseHour + (i * interval);
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      times.push(timeString);
    }
    
    return times;
  }


  function formatTimezone(tz: string | null): string {
    if (!tz) return 'Sin zona horaria';
    
    // Extraer solo la ciudad de la zona horaria
    const parts = tz.split('/');
    if (parts.length > 1) {
      return parts[parts.length - 1].replace(/_/g, ' ');
    }
    return tz;
  }

  function editSchedule(item: Row) {
    Alert.alert(
      'Editar medicamento',
      `¿Qué quieres hacer con ${item.medication_name}?`,
      [
        { text: '❌ Cancelar', style: 'cancel' },
        { 
          text: '💊 Editar medicamento', 
          onPress: () => navigation.navigate('MedicationForm', { 
            medicationId: item.medication_id,
            onSaved: reloadSchedules
          })
        },
        { 
          text: '⏰ Editar horarios', 
          onPress: () => navigation.navigate('HorarioForm', { 
            scheduleId: item.id,
            medicationId: item.medication_id 
          })
        }
      ]
    );
  }

  function deleteSchedule(item: Row) {
    Alert.alert(
      'Eliminar horario',
      `¿Estás seguro de que quieres eliminar el horario de ${item.medication_name}?`,
      [
        { text: '❌ Cancelar', style: 'cancel' },
        { 
          text: '🗑️ Eliminar', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('schedules')
              .delete()
              .eq('id', item.id);
            
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Eliminado', 'Horario eliminado correctamente');
              await reloadSchedules();
            }
          }
        }
      ]
    );
  }

  if (loading) return <LoadingAnimation message="Cargando horarios..." size="large" />;

  return (
    <ScrollView style={GlobalStyles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Menú de configuración rápida */}
      <View style={styles.quickMenu}>
        <Text style={styles.quickMenuTitle}>💊 Configurar Horarios</Text>
        <Text style={styles.quickMenuSubtitle}>Elige la frecuencia de tu medicamento</Text>
        
        {/* Botón de configuración de notificaciones */}
        <TouchableOpacity 
          style={styles.notificationSetupButton}
          onPress={setupNotifications}
        >
          <Text style={styles.notificationSetupText}>🔔 Configurar Recordatorios</Text>
          <Text style={styles.notificationSetupSubtext}>Recibe notificaciones para no olvidar tus medicamentos</Text>
        </TouchableOpacity>
        
        {/* Botones de frecuencia */}
        <View style={styles.frequencyGrid}>
          {[
            { frequency: 0, icon: '🌅', time: '8:00 AM' },
            { frequency: 1, icon: '🌅🌙', time: '8:00 AM • 8:00 PM' },
            { frequency: 2, icon: '🌅🌆🌙', time: '8:00 AM • 4:00 PM • 12:00 AM' },
            { frequency: 3, icon: '🌅🌤️🌆🌙', time: '6:00 AM • 12:00 PM • 6:00 PM • 12:00 AM' }
          ].map(({ frequency, icon, time }) => (
            <TouchableOpacity 
              key={frequency}
              style={styles.frequencyOption}
              onPress={() => {
                setSelectedFrequency(frequency);
                setShowFrequencyModal(true);
              }}
            >
              <Text style={[GlobalStyles.title, {fontSize: 24, color: Colors.primary}]}>{frequency + 1}x</Text>
              <Text style={[GlobalStyles.subtitle, {fontSize: 12}]}>al día</Text>
              <Text style={{fontSize: 16, marginTop: 4}}>{icon}</Text>
              <Text style={{fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 2}}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón de horario personalizado */}
        <TouchableOpacity 
          style={styles.customButton}
          onPress={() => {
            navigation.navigate('HorarioForm', { onSaved: reloadSchedules });
          }}
        >
          <Text style={styles.customButtonText}>⚙️ Configurar Horario Personalizado</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Agenda de Medicamentos */}
      <View style={styles.agendaSection}>
        <Text style={styles.agendaTitle}>📋 Agenda de Medicamentos</Text>
        <Text style={styles.agendaSubtitle}>Horarios ya configurados</Text>
        
        <FlatList
          data={rows}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={[GlobalStyles.card, { marginBottom: 12 }]}>
              <View style={styles.scheduleContent}>
                {/* Imagen del medicamento */}
                {item.medication_image_url ? (
                  <View style={styles.scheduleMedicationImageContainer}>
                    <Image 
                      source={{ uri: item.medication_image_url }} 
                      style={styles.scheduleMedicationImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.scheduleMedicationImagePlaceholder}>
                    <Text style={styles.scheduleMedicationImagePlaceholderText}>💊</Text>
                  </View>
                )}
                
                {/* Información del horario */}
                <View style={styles.scheduleInfo}>
                  <View style={styles.scheduleHeader}>
                    <Text style={GlobalStyles.title}>{item.medication_name}</Text>
                    <View style={styles.scheduleActions}>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton, 
                          notificationsEnabled[item.id] && styles.notificationButtonActive
                        ]}
                        onPress={() => toggleNotifications(item)}
                      >
                        <Text style={styles.actionButtonText}>
                          {notificationsEnabled[item.id] ? '🔔' : '🔕'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => editSchedule(item)}
                      >
                        <Text style={styles.actionButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteSchedule(item)}
                      >
                        <Text style={styles.actionButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={GlobalStyles.muted}>
                    📍 Hora de {formatTimezone(item.tz)}
                  </Text>
                  <Text style={{ marginTop: 4 }}>
                    ⏰ {item.fixed_times?.map(t => t.slice(0,5)).join(' · ') || '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={[GlobalStyles.center, { paddingVertical: Layout.spacing.xl }]}>
              <Text style={styles.emptyAgendaText}>📅 Sin horarios configurados</Text>
              <Text style={styles.emptyAgendaSubtext}>Usa los botones de arriba para crear tu primer horario</Text>
            </View>
          }
          scrollEnabled={false}
        />
      </View>

      {/* Modal de selección de medicamento */}
      <Modal
        visible={showFrequencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={[GlobalStyles.center, {backgroundColor: 'rgba(0,0,0,0.5)', flex: 1}]}>
          <View style={styles.quickModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowFrequencyModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={{fontSize: 20, color: Colors.textSecondary}}>✕</Text>
              </TouchableOpacity>
              <Text style={[GlobalStyles.title, {textAlign: 'center'}]}>Seleccionar Medicamento</Text>
            </View>
            
            <Text style={styles.quickModalDescription}>
              Elige el medicamento para el cual quieres configurar el horario
            </Text>
            
            <ScrollView style={styles.quickModalScrollView}>
              <View style={styles.quickMedicationList}>
                {meds.map((med) => (
                  <TouchableOpacity
                    key={med.id}
                    style={styles.quickMedicationItem}
                    onPress={() => handleTimeSelection(med.id, selectedFrequency)}
                  >
                    <Text style={styles.quickMedicationText}>{med.name}</Text>
                    <Text style={styles.quickMedicationArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de selección de horarios */}
      <TimePickerModal
        visible={showTimePickerModal}
        onClose={() => setShowTimePickerModal(false)}
        onSelectTime={(hour) => {
          const times = calculateScheduleTimes(selectedFrequency);
          saveQuickSchedule(times);
        }}
        title={`Configurar ${getFrequencyText(selectedFrequency)}`}
        subtitle="Selecciona los horarios para tomar tu medicamento"
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickMenu: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.medium,
  },
  
  quickMenuTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  
  quickMenuSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  
  quickButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    justifyContent: 'space-between',
  },
  
  quickButton: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    justifyContent: 'center',
  },
  
  quickButtonEmoji: {
    fontSize: Typography.sizes.lg,
    marginBottom: Layout.spacing.xs,
  },
  
  quickButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  
  quickButtonDetail: {
    fontSize: Typography.sizes.xs,
    color: Colors.textLight,
    textAlign: 'center',
  },
  
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.xs,
  },
  
  scheduleActions: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  deleteButton: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },

  notificationButtonActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },

  notificationSetupButton: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },

  notificationSetupText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },

  notificationSetupSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  actionButtonText: {
    fontSize: Typography.sizes.sm,
  },
  
  customButton: {
    minHeight: 80, // Más alto que los botones normales
    borderRadius: Layout.borderRadius.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.lg,
    backgroundColor: Colors.primary,
    marginTop: Layout.spacing.xl,
    width: '100%',
    ...Layout.shadow.medium,
  },
  
  customButtonText: {
    fontSize: Typography.sizes.lg, // Más grande
    fontWeight: Typography.weights.bold,
    color: Colors.textOnPrimary,
    marginBottom: 4,
    textAlign: 'center', // Centrar texto
  },
  
  customButtonSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textOnPrimary + 'CC', // Más transparente
    fontStyle: 'italic',
    textAlign: 'center', // Centrar texto
  },

  // Estilos para el nuevo botón principal
  mainCustomButton: {
    minHeight: 120,
    borderRadius: Layout.borderRadius.xl,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.xl,
    backgroundColor: Colors.primary,
    marginTop: Layout.spacing.lg,
    width: '100%',
    ...Layout.shadow.large,
  },

  buttonIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.textOnPrimary + '20',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Layout.spacing.md,
  },

  buttonIcon: {
    fontSize: 32,
  },

  mainCustomButtonText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textOnPrimary,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center' as const,
  },

  mainCustomButtonSubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.textOnPrimary + 'DD',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.xl,
    width: '90%',
    maxWidth: 400,
    minHeight: 700,
    maxHeight: '92%',
    ...Layout.shadow.large,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.md,
  },
  
  modalCloseText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  
  modalScrollView: {
    flex: 1,
    paddingBottom: Layout.spacing.lg,
  },
  
  modalDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    padding: Layout.spacing.lg,
    textAlign: 'center',
    backgroundColor: Colors.background,
    marginBottom: Layout.spacing.md,
  },
  
  modalActions: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  
  modalActionButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    ...Layout.shadow.medium,
  },
  
  modalSecondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  modalActionText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnPrimary,
  },
  
  modalSecondaryText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  
  // Estilos para la selección de medicamentos en el modal
  noMedicationsContainer: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  
  noMedicationsText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.warning,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  
  noMedicationsSubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  
  medicationSelection: {
    padding: Layout.spacing.lg,
    minHeight: 200,
    flex: 1,
  },
  
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  
  medicationOption: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    ...Layout.shadow.small,
  },
  
  medicationOptionText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  
  medicationOptionArrow: {
    fontSize: Typography.sizes.lg,
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  
  // Estilos para la sección de agenda
  agendaSection: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.medium,
  },
  
  agendaTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  
  agendaSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  
  emptyAgendaText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  
  emptyAgendaSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textLight,
    textAlign: 'center',
  },
  
  // Estilos del dropdown
  dropdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    ...Layout.shadow.small,
  },
  
  dropdownText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  dropdownArrow: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
    marginLeft: Layout.spacing.sm,
  },
  
  dropdownList: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.lg,
    maxHeight: 400,
    ...Layout.shadow.medium,
  },
  
  dropdownScrollView: {
    maxHeight: 400,
  },
  
  dropdownItem: {
    padding: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  dropdownItemText: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    alignItems: 'center',
    ...Layout.shadow.medium,
  },
  
  continueButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnPrimary,
  },
  
  continueButtonSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textOnPrimary + 'CC',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Estilos para la selección de frecuencia
  frequencySection: {
    paddingTop: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
    marginTop: Layout.spacing.lg,
  },
  
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  
  frequencyOption: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 90,
    justifyContent: 'center',
  },
  
  frequencyOptionSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  frequencyEmoji: {
    fontSize: Typography.sizes.lg,
    marginBottom: Layout.spacing.xs,
  },
  
  frequencyLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  
  frequencyLabelSelected: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  
  frequencyDetail: {
    fontSize: Typography.sizes.xs,
    color: Colors.textLight,
    textAlign: 'center',
  },
  
  frequencyDetailSelected: {
    color: Colors.primary + 'CC',
  },
  
  // Estilos para dropdowns de horarios rápidos
  quickButtonActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  quickDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 1000,
    ...Layout.shadow.medium,
  },
  
  quickDropdownScrollView: {
    maxHeight: 250,
  },
  
  quickDropdownItem: {
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  quickDropdownItemText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  
  // Estilos para el modal rápido de selección de medicamentos
  quickModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.xl,
    width: '85%',
    maxWidth: 350,
    minHeight: 500,
    maxHeight: '80%',
    ...Layout.shadow.large,
  },
  
  quickModalScrollView: {
    flex: 1,
    paddingBottom: Layout.spacing.md,
  },
  
  quickModalDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    padding: Layout.spacing.lg,
    textAlign: 'center',
    backgroundColor: Colors.background,
    marginBottom: Layout.spacing.md,
  },
  
  quickMedicationList: {
    padding: Layout.spacing.lg,
  },
  
  quickMedicationItem: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    ...Layout.shadow.small,
  },
  
  quickMedicationText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  
  quickMedicationArrow: {
    fontSize: Typography.sizes.lg,
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  
  // Estilos específicos para el dropdown del modal rápido
  quickDropdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    ...Layout.shadow.small,
  },
  
  quickDropdownText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  quickDropdownArrow: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
    marginLeft: Layout.spacing.sm,
  },
  
  quickContinueButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
    alignItems: 'center',
    ...Layout.shadow.medium,
  },
  
  quickContinueButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnPrimary,
  },
  
  quickContinueButtonSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textOnPrimary + 'CC',
    marginTop: 4,
    textAlign: 'center',
  },

  // Estilos para horarios con imagen
  scheduleContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  scheduleInfo: {
    flex: 1,
    paddingLeft: Layout.spacing.sm,
  },

  scheduleMedicationImageContainer: {
    width: 50,
    height: 50,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  scheduleMedicationImage: {
    width: '100%',
    height: '100%',
  },

  scheduleMedicationImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scheduleMedicationImagePlaceholderText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
});