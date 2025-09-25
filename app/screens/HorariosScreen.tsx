// app/screens/HorariosScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { GlobalStyles, Colors, Layout, Typography } from '../constants/GlobalStyles';
import TimePickerModal from '../components/TimePickerModal';

type Row = { id: string; medication_id: string; tz: string | null; fixed_times: string[] | null; medication_name: string };

export default function HorariosScreen() {
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<Row[]>([]);
  const [meds, setMeds] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<{ id: string; name: string } | null>(null);
  const [selectedTimesPerDay, setSelectedTimesPerDay] = useState(1);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickScheduleFrequency, setQuickScheduleFrequency] = useState<number>(1);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const medsRes = await supabase.from('medications').select('id,name').eq('patient_user_id', user!.id);
      const schRes = await supabase
        .from('schedules')
        .select('id, medication_id, tz, fixed_times, medications(name)')
        .eq('patient_user_id', user!.id)
        .order('created_at', { ascending: false });
      setMeds((medsRes.data ?? []) as any);
      const mapped = (schRes.data ?? []).map((r: any) => ({
        id: r.id, medication_id: r.medication_id, tz: r.tz, fixed_times: r.fixed_times,
        medication_name: r.medications?.name ?? '',
      }));
      setRows(mapped);
      setLoading(false);
    })();
  }, []);

  function calculateScheduleTimes(timesPerDay: number, firstHour: number): string[] {
    const times: string[] = [];
    const hoursInterval = 24 / timesPerDay;
    
    for (let i = 0; i < timesPerDay; i++) {
      const hour = (firstHour + (hoursInterval * i)) % 24;
      const h = Math.floor(hour).toString().padStart(2, '0');
      times.push(`${h}:00:00`);
    }
    
    return times.sort();
  }

  function formatHourDisplay(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }

  async function createQuickSchedule(timesPerDay: number) {
    if (!meds.length) {
      return Alert.alert('Medicamentos necesarios', 'Primero crea un medicamento antes de configurar horarios.');
    }

    // Seleccionar medicamento si hay varios
    if (meds.length === 1) {
      askForFirstDose(meds[0], timesPerDay);
    } else {
      // Mostrar modal para seleccionar medicamento
      setQuickScheduleFrequency(timesPerDay);
      setSelectedMedication(null);
      setShowMedicationDropdown(false);
      setShowQuickModal(true);
    }
  }

  function selectMedicationForQuickSchedule(medication: { id: string; name: string }) {
    askForFirstDose(medication, quickScheduleFrequency);
    setShowQuickModal(false);
  }

  function askForFirstDose(medication: { id: string; name: string }, timesPerDay: number) {
    setSelectedMedication(medication);
    setSelectedTimesPerDay(timesPerDay);
    setShowTimeModal(true);
  }

  function handleTimeSelection(hour: number) {
    if (!selectedMedication) return;
    
    const times = calculateScheduleTimes(selectedTimesPerDay, hour);
    const frequencyText = getFrequencyText(selectedTimesPerDay);
    const timeDisplays = times.map(time => {
      const h = parseInt(time.split(':')[0]);
      return formatHourDisplay(h);
    }).join(', ');
    
    setShowTimeModal(false);
    
    Alert.alert(
      'Confirmar horarios',
      `${selectedMedication.name}\nFrecuencia: ${frequencyText}\nHorarios: ${timeDisplays}\n\n¿Confirmas este horario?`,
      [
        { text: '❌ Cancelar', style: 'cancel' },
        { 
          text: '✅ Confirmar', 
          onPress: () => saveQuickSchedule(selectedMedication.id, times)
        }
      ]
    );
  }

  function getFrequencyText(timesPerDay: number): string {
    switch(timesPerDay) {
      case 1: return '1 vez al día';
      case 2: return '2 veces al día (cada 12h)';
      case 3: return '3 veces al día (cada 8h)';
      case 4: return '4 veces al día (cada 6h)';
      default: return `${timesPerDay} veces al día`;
    }
  }

  async function saveQuickSchedule(medicationId: string, times: string[]) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { error } = await supabase.from('schedules').insert({
      patient_user_id: (await supabase.auth.getUser()).data.user!.id,
      medication_id: medicationId,
      tz,
      fixed_times: times,
      tolerance_minutes: 30,
    });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('¡Listo!', 'Horario configurado correctamente');
      await reloadSchedules();
    }
  }

  async function reloadSchedules() {
    const { data: { user } } = await supabase.auth.getUser();
    const schRes = await supabase
      .from('schedules')
      .select('id, medication_id, tz, fixed_times, medications(name)')
      .eq('patient_user_id', user!.id)
      .order('created_at', { ascending: false });
    const mapped = (schRes.data ?? []).map((r: any) => ({
      id: r.id, medication_id: r.medication_id, tz: r.tz, fixed_times: r.fixed_times,
      medication_name: r.medications?.name ?? '',
    }));
    setRows(mapped);
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
      'Editar horario',
      `¿Qué quieres hacer con el horario de ${item.medication_name}?`,
      [
        { text: '❌ Cancelar', style: 'cancel' },
        { 
          text: '✏️ Editar tiempos', 
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

  if (loading) return <View style={GlobalStyles.center}><Text>Cargando…</Text></View>;

  return (
    <ScrollView style={GlobalStyles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Menú de acceso rápido */}
      <View style={styles.quickMenu}>
        <Text style={styles.quickMenuTitle}>⏰⚡ Horarios Rápidos</Text>
        <Text style={styles.quickMenuSubtitle}>Configura horarios comunes en segundos</Text>
        
        <View style={styles.quickButtonsGrid}>
          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => createQuickSchedule(1)}
          >
            <Text style={styles.quickButtonEmoji}>🌅</Text>
            <Text style={styles.quickButtonText}>1 vez al día</Text>
            <Text style={styles.quickButtonDetail}>Por la mañana</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => createQuickSchedule(2)}
          >
            <Text style={styles.quickButtonEmoji}>🌅🌙</Text>
            <Text style={styles.quickButtonText}>2 veces al día</Text>
            <Text style={styles.quickButtonDetail}>Cada 12 horas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => createQuickSchedule(3)}
          >
            <Text style={styles.quickButtonEmoji}>🌅🌞🌙</Text>
            <Text style={styles.quickButtonText}>3 veces al día</Text>
            <Text style={styles.quickButtonDetail}>Cada 8 horas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => createQuickSchedule(4)}
          >
            <Text style={styles.quickButtonEmoji}>🌅🌞🌆🌙</Text>
            <Text style={styles.quickButtonText}>4 veces al día</Text>
            <Text style={styles.quickButtonDetail}>Cada 6 horas</Text>
          </TouchableOpacity>
        </View>
        
        {/* Botón de horario personalizado dentro del menú rápido */}
        <TouchableOpacity 
          style={styles.customButton}
          onPress={() => {
            console.log('🔍 Medicamentos disponibles:', meds.length, meds);
            setSelectedMedication(null);
            setSelectedTimesPerDay(1);
            setShowMedicationDropdown(false);
            setShowCustomModal(true);
          }}
        >
          <Text style={styles.customButtonText}>⚙️ Configurar Horario Personalizado</Text>
          <Text style={styles.customButtonSubtext}>Horarios específicos y flexibles</Text>
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
              <View style={styles.scheduleHeader}>
                <Text style={GlobalStyles.title}>{item.medication_name}</Text>
                <View style={styles.scheduleActions}>
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

      {/* Modal para horario personalizado */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Horario Personalizado</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                Selecciona un medicamento y configura horarios específicos
              </Text>
              
              {meds.length === 0 ? (
                <View style={styles.noMedicationsContainer}>
                  <Text style={styles.noMedicationsText}>⚠️ No hay medicamentos disponibles</Text>
                  <Text style={styles.noMedicationsSubtext}>Primero necesitas crear un medicamento</Text>
                  
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => {
                      setShowCustomModal(false);
                      navigation.navigate('MedicationForm', { onSaved: () => {
                        // Recargar medicamentos después de crear uno nuevo
                        (async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          const medsRes = await supabase.from('medications').select('id,name').eq('patient_user_id', user!.id);
                          setMeds((medsRes.data ?? []) as any);
                        })();
                      }});
                    }}
                  >
                    <Text style={styles.modalActionText}>➕ Crear Medicamento</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.medicationSelection}>
                  <Text style={styles.sectionTitle}>💊 Selecciona un medicamento:</Text>
                  
                  {/* Dropdown para medicamentos */}
                  <TouchableOpacity 
                    style={styles.dropdownContainer}
                    onPress={() => setShowMedicationDropdown(!showMedicationDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {selectedMedication ? `🔹 ${selectedMedication.name}` : '📋 Seleccionar medicamento...'}
                    </Text>
                    <Text style={styles.dropdownArrow}>
                      {showMedicationDropdown ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Lista desplegable con scroll */}
                  {showMedicationDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView 
                        style={styles.dropdownScrollView}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      >
                        {meds.map((med, index) => (
                          <TouchableOpacity 
                            key={med.id}
                            style={[
                              styles.dropdownItem,
                              index === meds.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={() => {
                              setSelectedMedication(med);
                              setShowMedicationDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>🔹 {med.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  {/* Selección de frecuencia cuando se selecciona un medicamento */}
                  {selectedMedication && (
                    <View style={styles.frequencySection}>
                      <Text style={styles.sectionTitle}>⏰ Frecuencia de administración:</Text>
                      
                      <View style={styles.frequencyGrid}>
                        {[
                          { times: 1, label: '1 vez al día', detail: 'Por la mañana', emoji: '🌅' },
                          { times: 2, label: '2 veces al día', detail: 'Cada 12 horas', emoji: '🌅🌙' },
                          { times: 3, label: '3 veces al día', detail: 'Cada 8 horas', emoji: '🌅🌞🌙' },
                          { times: 4, label: '4 veces al día', detail: 'Cada 6 horas', emoji: '🌅🌞🌆🌙' },
                        ].map((freq) => (
                          <TouchableOpacity 
                            key={freq.times}
                            style={[
                              styles.frequencyOption,
                              selectedTimesPerDay === freq.times && styles.frequencyOptionSelected
                            ]}
                            onPress={() => setSelectedTimesPerDay(freq.times)}
                          >
                            <Text style={styles.frequencyEmoji}>{freq.emoji}</Text>
                            <Text style={[
                              styles.frequencyLabel,
                              selectedTimesPerDay === freq.times && styles.frequencyLabelSelected
                            ]}>
                              {freq.label}
                            </Text>
                            <Text style={[
                              styles.frequencyDetail,
                              selectedTimesPerDay === freq.times && styles.frequencyDetailSelected
                            ]}>
                              {freq.detail}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.continueButton}
                        onPress={() => {
                          setShowCustomModal(false);
                          setShowTimeModal(true);
                        }}
                      >
                        <Text style={styles.continueButtonText}>
                          ✅ Configurar Horarios - {selectedMedication.name}
                        </Text>
                        <Text style={styles.continueButtonSubtext}>
                          {getFrequencyText(selectedTimesPerDay)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.modalActionButton, styles.modalSecondaryButton]}
                      onPress={() => {
                        setShowCustomModal(false);
                        navigation.navigate('HorarioForm', { onSaved: reloadSchedules });
                      }}
                    >
                      <Text style={styles.modalSecondaryText}>⚙️ Configuración Avanzada</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para selección rápida de medicamentos */}
      <Modal
        visible={showQuickModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuickModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quickModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                💊 Seleccionar Medicamento
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowQuickModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.quickModalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.quickModalDescription}>
                Selecciona el medicamento para configurar {getFrequencyText(quickScheduleFrequency)}
              </Text>
              
              <View style={styles.quickMedicationList}>
                {/* Dropdown para seleccionar medicamento */}
                <TouchableOpacity 
                  style={styles.quickDropdownContainer}
                  onPress={() => setShowMedicationDropdown(!showMedicationDropdown)}
                >
                  <Text style={styles.quickDropdownText}>
                    {selectedMedication ? `💊 ${selectedMedication.name}` : '💊 Medicamentos'}
                  </Text>
                  <Text style={styles.quickDropdownArrow}>
                    {showMedicationDropdown ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                {/* Lista desplegable con scroll */}
                {showMedicationDropdown && (
                  <View style={styles.quickDropdownList}>
                    <ScrollView 
                      style={styles.quickDropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {meds.map((med, index) => (
                        <TouchableOpacity 
                          key={med.id}
                          style={[
                            styles.quickDropdownItem,
                            index === meds.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setSelectedMedication(med);
                            setShowMedicationDropdown(false);
                          }}
                        >
                          <Text style={styles.quickDropdownItemText}>💊 {med.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {/* Botón para continuar cuando se seleccione un medicamento */}
                {selectedMedication && (
                  <TouchableOpacity 
                    style={styles.quickContinueButton}
                    onPress={() => selectMedicationForQuickSchedule(selectedMedication)}
                  >
                    <Text style={styles.quickContinueButtonText}>
                      ✅ Continuar con {selectedMedication.name}
                    </Text>
                    <Text style={styles.quickContinueButtonSubtext}>
                      {getFrequencyText(quickScheduleFrequency)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TimePickerModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSelectTime={handleTimeSelection}
        title={selectedMedication ? `${selectedMedication.name} - ${getFrequencyText(selectedTimesPerDay)}` : ''}
        subtitle="Selecciona la hora de la primera dosis"
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
});