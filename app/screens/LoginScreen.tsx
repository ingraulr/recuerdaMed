// app/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { GlobalStyles } from '../constants/GlobalStyles';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';
import { GradientBackground } from '../components/GradientBackground';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const clean = (s?: string) => (s ?? '').trim();



  async function handleRegister() {
    const e = clean(email);
    const p = clean(password);

    if (!e || !p) {
      Alert.alert('Campos vacíos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📝 Intentando registro con:', e);
      
      const { data, error } = await supabase.auth.signUp({ email: e, password: p });
      
      if (error) throw error;
      
      console.log('✅ Registro exitoso para:', e);
      
      Alert.alert(
        '🎉 ¡Bienvenido a RecuerdaMed!', 
        `Tu cuenta ha sido creada exitosamente.\n\n✅ Email: ${e}\n\n${data.user?.email_confirmed_at ? '¡Ya puedes iniciar sesión inmediatamente!' : 'Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.'}`,
        [{ 
          text: 'Perfecto', 
          style: 'default',
          onPress: () => {
            // Limpiar los campos para que pueda hacer login
            if (data.user?.email_confirmed_at) {
              // Si ya está confirmado, mantener el email para facilitar el login
              setPassword('');
            }
          }
        }]
      );
    } catch (err: any) {
      console.log('signUp error ->', err?.message);
      
      if (err?.message?.includes('invalid')) {
        Alert.alert('Email no válido', 'Por favor usa un email con dominio válido (ej: @gmail.com, @hotmail.com)');
      } else if (err?.message?.includes('already')) {
        Alert.alert(
          '👤 Usuario ya registrado', 
          `Este email ya tiene una cuenta en RecuerdaMed.\n\n📧 Email: ${e}\n\n¿Quieres iniciar sesión en su lugar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Iniciar sesión', 
              style: 'default',
              onPress: () => {
                // Mantener el email y limpiar la contraseña para facilitar el login
                setPassword('');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', err?.message ?? 'No se pudo registrar');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    const e = clean(email);
    const p = clean(password);

    if (!e || !p) {
      Alert.alert('Campos vacíos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔑 Intentando login con:', e);
      console.log('🔗 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p });
      
      console.log('📊 Respuesta completa:', { data, error });
      
      if (error) {
        console.log('❌ Error completo:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ Login exitoso, navegando a Home');
      
      // Mostrar alert de bienvenida antes de navegar
      Alert.alert(
        '✅ ¡Inicio de sesión exitoso!',
        `¡Bienvenido de vuelta!\n\n👤 Usuario: ${data.user?.email}\n\n🎯 Accediendo a tu dashboard de medicamentos...`,
        [{ 
          text: 'Continuar', 
          style: 'default',
          onPress: () => navigation.replace('Home')
        }]
      );
    } catch (err: any) {
      console.log('signIn error ->', err?.message);
      console.log('Error status:', err?.status);
      console.log('Error completo:', JSON.stringify(err, null, 2));
      
      if (err?.message?.includes('Invalid login credentials')) {
        Alert.alert(
          'Credenciales incorrectas', 
          `Verifica tu email y contraseña. Error: ${err.message}`,
          [{ text: 'Entendido', style: 'default' }]
        );
      } else if (err?.message?.includes('Email not confirmed')) {
        Alert.alert(
          'Email no confirmado', 
          'Tu cuenta necesita ser confirmada. Revisa tu correo o contacta al administrador.',
          [{ text: 'Entendido', style: 'default' }]
        );
      } else {
        Alert.alert('Error', `${err?.message ?? 'No se pudo iniciar sesión'}\n\nDetalles técnicos: ${JSON.stringify(err, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={GlobalStyles.containerCentered}>
          
          {/* Logo y título */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>💊</Text>
            </View>
            <Text style={GlobalStyles.title}>RecuerdaMed</Text>
            <Text style={styles.subtitle}>
              Tu compañero para recordar tus medicamentos
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            
            {/* Campo de correo */}
            <View style={GlobalStyles.mb_md}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                placeholder="ejemplo@correo.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={[
                  GlobalStyles.input,
                  emailFocused && GlobalStyles.inputFocused,
                  styles.input
                ]}
                placeholderTextColor={Colors.textLight}
                editable={!loading}
              />
            </View>

            {/* Campo de contraseña */}
            <View style={GlobalStyles.mb_xl}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                placeholder="Tu contraseña segura"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={[
                  GlobalStyles.input,
                  passwordFocused && GlobalStyles.inputFocused,
                  styles.input
                ]}
                placeholderTextColor={Colors.textLight}
                editable={!loading}
              />
            </View>

            {/* Botones */}
            <View style={styles.buttonsContainer}>
              
              {/* Botón de iniciar sesión */}
              <TouchableOpacity
                style={[
                  GlobalStyles.button,
                  GlobalStyles.buttonPrimary,
                  loading && GlobalStyles.buttonDisabled,
                  GlobalStyles.mb_md
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="small" color={Colors.textOnPrimary} />
                    <Text style={[GlobalStyles.buttonText, styles.loadingText]}>
                      Iniciando sesión...
                    </Text>
                  </View>
                ) : (
                  <Text style={GlobalStyles.buttonText}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>

              {/* Botón de registro */}
              <TouchableOpacity
                style={[
                  GlobalStyles.button,
                  GlobalStyles.buttonSecondary,
                  loading && GlobalStyles.buttonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={[
                  GlobalStyles.buttonText,
                  GlobalStyles.buttonTextSecondary,
                  loading && GlobalStyles.buttonTextDisabled
                ]}>
                  Crear cuenta nueva
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Cuidamos tu salud con recordatorios seguros y confiables
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </GradientBackground>
  );
}

const styles = {
  headerContainer: {
    alignItems: 'center' as const,
    marginBottom: Layout.spacing['2xl'],
  },
  
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primaryLight,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.medium,
  },
  
  logoEmoji: {
    fontSize: 40,
  },
  
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: Layout.spacing.lg,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  
  formContainer: {
    width: '100%' as import('react-native').DimensionValue,
    maxWidth: 400,
  },
  
  inputLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.sm,
  },
  
  input: {
    fontSize: Typography.sizes.lg, // Texto más grande para mejor legibilidad
  },
  
  buttonsContainer: {
    marginTop: Layout.spacing.md,
  },
  
  loadingContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Layout.spacing.sm,
  },
  
  loadingText: {
    marginLeft: Layout.spacing.sm,
  },
  
  footerContainer: {
    marginTop: Layout.spacing['2xl'],
    paddingHorizontal: Layout.spacing.lg,
  },
  
  footerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textLight,
    textAlign: 'center' as const,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
  },
};