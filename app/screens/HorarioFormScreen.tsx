// app/screens/HorarioFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { GlobalStyles, Colors, Layout, Typography } from '../constants/GlobalStyles';
import TimePickerModal from '../components/TimePickerModal';
import LoadingAnimation from '../components/LoadingAnimation';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationService } from '../services/NotificationService';

type Medication = {
  id: string;
  name: string;
};

export default function HorarioFormScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved = route.params?.onSaved;
  const { requestPermissions } = useNotifications();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<string>('');

  const [customHours, setCustomHours] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  useEffect(() => {
    loadMedications();
  }, []);

  // Recargar medicamentos cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadMedications();
    }, [])
  );

  async function loadMedications() {
    try {
      setLoadingMedications(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingMedications(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('medications')
        .select('id, name')
        .eq('patient_user_id', user.id)
        .order('name');
      
      if (error) {
        console.error('Error loading medications:', error);
        Alert.alert('Error', 'No se pudieron cargar los medicamentos');
        setLoadingMedications(false);
        return;
      }
      
      setMedications(data || []);
      console.log('Medications loaded:', data?.length || 0);
      setLoadingMedications(false);
    } catch (err) {
      console.error('Error in loadMedications:', err);
      Alert.alert('Error', 'Error al cargar medicamentos');
      setLoadingMedications(false);
    }
  }

  function formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }

  function getTimesArray(hours: number[]): string[] {
    return hours.map(hour => {
      const h = hour.toString().padStart(2, '0');
      return `${h}:00:00`;
    });
  }

  async function save() {
    if (!selectedMedication) {
      return Alert.alert('Error', 'Selecciona un medicamento');
    }
    if (customHours.length === 0) {
      return Alert.alert('Error', 'Agrega al menos un horario personalizado');
    }

    const finalHours = customHours;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Insertar el horario en la base de datos
    const { data: scheduleData, error } = await supabase
      .from('schedules')
      .insert({
        patient_user_id: user!.id,
        medication_id: selectedMedication,
        tz,
        fixed_times: getTimesArray(finalHours),
        tolerance_minutes: 30,
      })
      .select()
      .single();

    if (error) {
      setSaving(false);
      return Alert.alert('Error', error.message);
    }

    // Obtener información del medicamento para las notificaciones
    const selectedMed = medications.find(m => m.id === selectedMedication);
    
    if (selectedMed && scheduleData) {
      try {
        // Solicitar permisos de notificaciones
        const hasPermission = await requestPermissions();
        
        if (hasPermission) {
          // Programar notificaciones para cada horario
          const reminders = finalHours.map(hour => ({
            id: `${scheduleData.id}-${hour}`,
            medicationId: selectedMedication,
            medicationName: selectedMed.name,
            dose: '', // Podemos obtener esto de la BD si es necesario
            time: `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`,
            scheduleId: scheduleData.id,
          }));
          
          const scheduledIds = await NotificationService.scheduleMultipleReminders(reminders);
          console.log(`📱 Programadas ${scheduledIds.length} notificaciones para ${selectedMed.name}`);
        } else {
          Alert.alert(
            'Recordatorios no configurados',
            'Se guardó el horario pero no se pudieron programar las notificaciones. Puedes habilitarlas en la configuración de tu dispositivo.',
            [{ text: 'OK' }]
          );
        }
      } catch (notificationError) {
        console.error('Error programming notifications:', notificationError);
        Alert.alert(
          'Horario guardado',
          'El horario se guardó correctamente, pero hubo un problema configurando los recordatorios.',
          [{ text: 'OK' }]
        );
      }
    }

    setSaving(false);
    Alert.alert('¡Listo!', 'Horario y recordatorios configurados correctamente');
    onSaved?.();
    nav.goBack();
  }

  function addCustomHour() {
    setShowTimeModal(true);
  }
  
  function handleTimeSelection(hour: number) {
    if (!customHours.includes(hour)) {
      setCustomHours([...customHours, hour].sort((a, b) => a - b));
    }
    setShowTimeModal(false);
  }

  function removeCustomHour(hour: number) {
    setCustomHours(customHours.filter(h => h !== hour));
  }

  return (
    <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={GlobalStyles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: 100, // Más espacio para scroll
            flexGrow: 1 
          }}
          keyboardShouldPersistTaps="handled"
        >
        <Text style={GlobalStyles.subtitle}>Nuevo Horario de Medicamento</Text>

      {/* Indicador de carga */}
      {loadingMedications && (
        <LoadingAnimation message="Cargando medicamentos..." size="medium" />
      )}

      {/* Selección de medicamento */}
      {!loadingMedications && (
        <>
          {medications.length > 0 ? (
            <View style={styles.dropdownContainer}>
              <Text style={GlobalStyles.label}>Selecciona un medicamento ({medications.length} disponible{medications.length > 1 ? 's' : ''})</Text>
              
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity
                  style={[styles.selectDropdown, dropdownOpen && styles.selectDropdownOpen]}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Text style={[styles.selectText, selectedMedication ? {} : { color: Colors.textSecondary }]}>
                    {selectedMedication ? 
                      `💊 ${medications.find(m => m.id === selectedMedication)?.name || 'Medicamento no encontrado'}` : 
                      'Toca aquí para seleccionar medicamento'
                    }
                  </Text>
                  <Text style={[styles.selectArrow, dropdownOpen && styles.selectArrowOpen]}>▼</Text>
                </TouchableOpacity>
                
                {/* Dropdown desplegable - más cerca del select */}
                {dropdownOpen && (
                  <View style={[styles.dropdownList, { marginTop: -20 }]}>
                    {medications.map(med => (
                      <TouchableOpacity
                        key={med.id}
                        style={[
                          styles.dropdownItem,
                          selectedMedication === med.id && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setSelectedMedication(med.id);
                          setDropdownOpen(false);
                          console.log('Selected medication:', med.name, med.id);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          selectedMedication === med.id && styles.dropdownItemTextSelected
                        ]}>
                          💊 {med.name}
                        </Text>
                        {selectedMedication === med.id && (
                          <Text style={styles.dropdownItemCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {selectedMedication && !dropdownOpen && (
                <Text style={styles.selectedMedicationConfirm}>
                  ✅ Medicamento seleccionado: {medications.find(m => m.id === selectedMedication)?.name}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.noMedicationsContainer}>
              <Text style={styles.noMedicationsIcon}>💊❌</Text>
              <Text style={[GlobalStyles.subtitle, { textAlign: 'center', marginBottom: 8 }]}>
                Sin medicamentos
              </Text>
              <Text style={[GlobalStyles.bodyText, { textAlign: 'center', marginBottom: 20 }]}>
                Necesitas crear al menos un medicamento antes de configurar horarios
              </Text>
              <TouchableOpacity
                style={[GlobalStyles.button, GlobalStyles.buttonPrimary]}
                onPress={() => {
                  console.log('Navigating to MedicationForm');
                  nav.navigate('MedicationForm', {
                    onSaved: () => {
                      console.log('Medication saved, reloading...');
                      loadMedications();
                    }
                  });
                }}
              >
                <Text style={GlobalStyles.buttonText}>
                  ➕ Crear mi primer medicamento
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Horarios personalizados */}
      {medications.length > 0 && selectedMedication && (
        <View style={styles.customScheduleContainer}>
          <Text style={GlobalStyles.label}>Tus horarios personalizados</Text>
          
          {customHours.length > 0 && (
            <View style={styles.customHoursList}>
              {customHours.map(hour => (
                <View key={hour} style={styles.customHourItem}>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeText}>{formatHour(hour)}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeCustomHour(hour)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton]}
            onPress={addCustomHour}
          >
            <Text style={styles.addButtonText}>
              🕐 Agregar horario personalizado
            </Text>
          </TouchableOpacity>

          {customHours.length === 0 && (
            <Text style={styles.customHelpText}>
              Agrega los horarios específicos en los que tomas este medicamento
            </Text>
          )}
        </View>
      )}

      {/* Botón guardar - siempre visible */}
      <View style={styles.saveSection}>
        {selectedMedication && (
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? '⏳ Guardando horario...' : '💾 Guardar horario del medicamento'}
            </Text>
          </TouchableOpacity>
        )}

        {!selectedMedication && medications.length > 0 && (
          <View style={styles.incompleteContainer}>
            <Text style={styles.incompleteText}>
              👆 Selecciona un medicamento
            </Text>
          </View>
        )}
      </View>
      </ScrollView>

      {/* Modal para seleccionar hora personalizada */}
      <TimePickerModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSelectTime={handleTimeSelection}
        title="Horario Personalizado"
        subtitle="Selecciona la hora para tu medicamento"
      />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  // Select dropdown personalizado
  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.padding.card,
    marginBottom: 20,
    minHeight: 50,
  },
  selectText: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  selectArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  noMedicationsContainer: {
    alignItems: 'center',
    padding: Layout.padding.card + 8,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  
  // Grid de frecuencias
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  frequencyOption: {
    width: '48%',  // Dos columnas
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.padding.section,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  frequencyOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  frequencyLabelSelected: {
    color: Colors.textOnPrimary,
  },
  frequencyDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  frequencyDescriptionSelected: {
    color: Colors.textOnPrimary,
  },
  frequencyTimes: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },
  frequencyTimesSelected: {
    color: Colors.textOnPrimary,
  },

  // Horarios personalizados
  customScheduleContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.padding.card,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customHoursList: {
    gap: 12,
    marginVertical: 16,
  },
  customHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.sm,
    padding: Layout.padding.section,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  timeDisplay: {
    flex: 1,
  },
  timeText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  removeButton: {
    padding: 8,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.errorLight,
  },
  removeButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: Typography.weights.bold,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    width: '100%',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
    ...Layout.shadow.medium,
  },
  addButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  customHelpText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Sección de guardar
  saveSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.padding.card,
    minHeight: Layout.button.height.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  incompleteContainer: {
    backgroundColor: Colors.warningLight,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.padding.section,
    alignItems: 'center',
  },
  incompleteText: {
    fontSize: Typography.sizes.base,
    color: Colors.warning,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },

  // Confirmación de medicamento seleccionado
  selectedMedicationConfirm: {
    fontSize: Typography.sizes.sm,
    color: Colors.success,
    fontWeight: Typography.weights.medium,
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: Colors.successLight,
    padding: 8,
    borderRadius: Layout.borderRadius.sm,
  },

  // Icono para sin medicamentos
  noMedicationsIcon: {
    fontSize: Typography.sizes['4xl'],
    textAlign: 'center',
    marginBottom: 16,
  },

  // Dropdown personalizado desplegable
  dropdownContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1000,
  },
  dropdownWrapper: {
    position: 'relative',
  },
  selectDropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: Colors.primary,
  },
  selectArrowOpen: {
    transform: [{ rotate: '180deg' }],
    color: Colors.primary,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderTopWidth: 0,
    borderBottomLeftRadius: Layout.borderRadius.md,
    borderBottomRightRadius: Layout.borderRadius.md,
    maxHeight: 350,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.padding.section,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primaryLight + '20',
  },
  dropdownItemText: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  dropdownItemCheck: {
    fontSize: Typography.sizes.lg,
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },

  // Indicador de carga
  loadingContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.padding.card,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
