// app/screens/MedicationFormScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { GlobalStyles, Colors, Layout, Typography } from '../constants/GlobalStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import LoadingAnimation from '../components/LoadingAnimation';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function MedicationFormScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved = route.params?.onSaved;
  const medicationToEdit = route.params?.medication;
  const isEditing = !!medicationToEdit;

  const [name, setName] = useState(medicationToEdit?.name || '');
  const [dose, setDose] = useState<string>(medicationToEdit?.dose?.toString() || '');
  const [unit, setUnit] = useState(medicationToEdit?.unit || 'mg');
  const [notes, setNotes] = useState(medicationToEdit?.notes || '');
  const [imageUri, setImageUri] = useState<string | null>(medicationToEdit?.image_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function pickImage() {
    try {
      // Solicitar permisos
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permisos necesarios',
          'Necesitas dar permisos para acceder a la galería de fotos.'
        );
        return;
      }

      // Mostrar opciones
      Alert.alert(
        'Seleccionar imagen',
        '¿De dónde quieres obtener la imagen?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: '📷 Cámara', onPress: () => openCamera() },
          { text: '🖼️ Galería', onPress: () => openGallery() }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo acceder a las imágenes');
    }
  }

  async function openCamera() {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Error', 'Se necesita permiso para usar la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  }

  async function openGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  }

  async function uploadImage(uri: string) {
    try {
      setUploadingImage(true);
      
      // Obtener información del archivo
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('El archivo no existe');
      }

      // Crear un nombre único para el archivo
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `medication-images/${fileName}`;

      // Leer el archivo como base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('medication-images')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (error) throw error;

      // Obtener la URL pública
      const { data: urlData } = supabase.storage
        .from('medication-images')
        .getPublicUrl(filePath);

      setImageUri(urlData.publicUrl);
      Alert.alert('✅ Imagen subida', 'La imagen se ha subido correctamente');
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  }

  function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function removeImage() {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => setImageUri(null)
        }
      ]
    );
  }

  async function save() {
    if (!name.trim()) return Alert.alert('Nombre requerido');

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let error;
    
    if (isEditing) {
      // Actualizar medicamento existente
      const { error: updateError } = await supabase
        .from('medications')
        .update({
          name,
          dose: dose ? Number(dose) : null,
          unit,
          notes: notes || null,
          image_url: imageUri,
        })
        .eq('id', medicationToEdit.id)
        .eq('patient_user_id', user!.id);
      error = updateError;
    } else {
      // Crear nuevo medicamento
      const { error: insertError } = await supabase
        .from('medications')
        .insert({
          patient_user_id: user!.id,
          name,
          dose: dose ? Number(dose) : null,
          unit,
          notes: notes || null,
          image_url: imageUri,
        });
      error = insertError;
    }
    
    setSaving(false);
    if (error) return Alert.alert('Error', error.message);
    
    Alert.alert(
      '✅ Guardado', 
      isEditing ? 'Medicamento actualizado correctamente' : 'Medicamento creado correctamente'
    );
    onSaved?.();
    nav.goBack();
  }

  if (saving) {
    return <LoadingAnimation message="Guardando medicamento..." size="medium" />;
  }

  return (
    <ScrollView style={GlobalStyles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 12, paddingBottom: 20 }}>
        <Text style={GlobalStyles.subtitle}>
          {isEditing ? 'Editar Medicamento' : 'Nuevo Medicamento'}
        </Text>
        
        {/* Sección de imagen */}
        <View style={styles.imageSection}>
          <Text style={GlobalStyles.label}>Imagen del medicamento</Text>
          <Text style={styles.imageHelpText}>
            Agrega una foto para identificar fácilmente tu medicamento
          </Text>
          
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.medicationImage} />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  <Text style={styles.imageActionText}>📷 Cambiar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.imageActionButton, styles.removeButton]}
                  onPress={removeImage}
                  disabled={uploadingImage}
                >
                  <Text style={[styles.imageActionText, styles.removeText]}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <Text style={styles.addImageIcon}>
                {uploadingImage ? '⏳' : '📷'}
              </Text>
              <Text style={styles.addImageText}>
                {uploadingImage ? 'Subiendo imagen...' : 'Agregar imagen'}
              </Text>
              <Text style={styles.addImageSubtext}>
                Toca para seleccionar desde cámara o galería
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={GlobalStyles.label}>Nombre</Text>
        <TextInput style={GlobalStyles.input} value={name} onChangeText={setName} placeholder="Ej. Vitamina D" />

        <Text style={GlobalStyles.label}>Dosis</Text>
        <TextInput style={GlobalStyles.input} value={dose} onChangeText={setDose} keyboardType="numeric" placeholder="Ej. 50" />

        <Text style={GlobalStyles.label}>Unidad</Text>
        <TextInput style={GlobalStyles.input} value={unit} onChangeText={setUnit} placeholder="mg | ml | pastilla" />

        <Text style={GlobalStyles.label}>Notas</Text>
        <TextInput style={[GlobalStyles.input, { height: 90 }]} value={notes} onChangeText={setNotes} multiline />

        <TouchableOpacity 
          style={[GlobalStyles.button, GlobalStyles.buttonPrimary]} 
          onPress={save} 
          disabled={saving || uploadingImage}
        >
          <Text style={GlobalStyles.buttonText}>
            {saving ? 'Guardando…' : (isEditing ? 'Actualizar Medicamento' : 'Guardar Medicamento')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.small,
  },

  imageHelpText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },

  imageContainer: {
    alignItems: 'center',
    gap: Layout.spacing.md,
  },

  medicationImage: {
    width: 150,
    height: 150,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },

  imageActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },

  imageActionButton: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: 'center',
  },

  removeButton: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },

  imageActionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },

  removeText: {
    color: Colors.error,
  },

  addImageButton: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    minHeight: 150,
    justifyContent: 'center',
  },

  addImageIcon: {
    fontSize: 40,
    marginBottom: Layout.spacing.md,
  },

  addImageText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },

  addImageSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});