// app/components/TimePickerModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { GlobalStyles, Colors, Layout, Typography } from '../constants/GlobalStyles';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (hour: number) => void;
  title: string;
  subtitle?: string;
}

export default function TimePickerModal({ 
  visible, 
  onClose, 
  onSelectTime, 
  title, 
  subtitle 
}: TimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const periods = ['AM', 'PM'];

  function handleConfirm() {
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    onSelectTime(hour24);
    onClose();
  }

  function formatTimeDisplay() {
    return `${selectedHour}:00 ${selectedPeriod}`;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleSection}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeDisplayText}>{formatTimeDisplay()}</Text>
            <Text style={styles.timeDisplayLabel}>Hora seleccionada</Text>
          </View>

          {/* Time Picker */}
          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Hora</Text>
              <ScrollView 
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      selectedHour === hour && styles.pickerItemSelected
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedHour === hour && styles.pickerItemTextSelected
                    ]}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Período</Text>
              <ScrollView 
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {periods.map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.pickerItem,
                      selectedPeriod === period && styles.pickerItemSelected
                    ]}
                    onPress={() => setSelectedPeriod(period as 'AM' | 'PM')}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedPeriod === period && styles.pickerItemTextSelected
                    ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[GlobalStyles.button, GlobalStyles.buttonSecondary, { flex: 1 }]}
              onPress={onClose}
            >
              <Text style={[GlobalStyles.buttonText, GlobalStyles.buttonTextSecondary]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <View style={{ width: 12 }} />
            
            <TouchableOpacity 
              style={[GlobalStyles.button, GlobalStyles.buttonPrimary, { flex: 1 }]}
              onPress={handleConfirm}
            >
              <Text style={GlobalStyles.buttonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    width: '100%' as const,
    maxWidth: 400,
    ...Layout.shadow.large,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start' as const,
    marginBottom: Layout.spacing.lg,
  },
  modalTitleSection: {
    flex: 1,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center' as const,
    marginLeft: Layout.spacing.sm,
  },
  closeButtonText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  timeDisplay: {
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  timeDisplayText: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  timeDisplayLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row' as const,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: Layout.spacing.sm,
  },
  pickerScroll: {
    height: 120,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
  },
  pickerItem: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center' as const,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  pickerItemTextSelected: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.weights.bold,
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: Layout.spacing.sm,
  },
});
