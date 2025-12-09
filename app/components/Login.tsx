import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import ThemedText from './ThemedText';
import IconSymbol from './ui/IconSymbol';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../constants/Api';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const [loginData, setLoginData] = useState({
    email: '',
    sifre: ''
  });

  const [formData, setFormData] = useState({
    Ad_Soyad: '',
    email: '',
    telefon: '',
    sifre: '',
    sifre_tekrar: ''
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Form slide in
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
  }, []);

  const animateFormSwitch = () => {
    Animated.sequence([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.sifre) {
      Alert.alert('Uyari', 'Lutfen email ve sifrenizi girin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      }, 15000);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giris basarisiz');
      }

      router.replace({
        pathname: '/components/MainScreen',
        params: {
          userName: data.Ad_Soyad,
          userRole: data.yetki,
          permissions: JSON.stringify(data.permissions)
        }
      });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Sunucuya baglanilamadi. Backend calistigini kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.Ad_Soyad || !formData.email || !formData.telefon || !formData.sifre || !formData.sifre_tekrar) {
      Alert.alert('Uyari', 'Lutfen tum alanlari doldurun');
      return;
    }

    if (formData.sifre !== formData.sifre_tekrar) {
      Alert.alert('Hata', 'Sifreler eslesmedi');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }, 15000);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayit islemi basarisiz');
      }

      Alert.alert('Basarili', 'Kayit islemi basariyla tamamlandi');
      setIsLogin(true);
      setLoginData({ email: formData.email, sifre: '' });
      setFormData({ Ad_Soyad: '', email: '', telefon: '', sifre: '', sifre_tekrar: '' });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Sunucuya baglanilamadi. Backend calistigini kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    animateFormSwitch();
    setIsLogin(!isLogin);
  };

  const renderInput = (
    icon: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    inputKey: string,
    options?: {
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      showToggle?: boolean;
      isVisible?: boolean;
      onToggleVisibility?: () => void;
    }
  ) => {
    const isFocused = focusedInput === inputKey;

    return (
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused
      ]}>
        <View style={styles.inputIconContainer}>
          <IconSymbol
            name={icon}
            size={20}
            color={isFocused ? COLORS.primary.accent : COLORS.neutral[400]}
          />
        </View>
        <TextInput
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor={COLORS.neutral[400]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocusedInput(inputKey)}
          onBlur={() => setFocusedInput(null)}
          secureTextEntry={options?.secureTextEntry && !options?.isVisible}
          keyboardType={options?.keyboardType || 'default'}
          autoCapitalize={options?.autoCapitalize || 'sentences'}
        />
        {options?.showToggle && (
          <TouchableOpacity
            style={styles.visibilityToggle}
            onPress={options.onToggleVisibility}
          >
            <IconSymbol
              name={options.isVisible ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />

      {/* Clean Dark Background */}
      <View style={styles.background}>
        <View style={styles.backgroundTop} />
        <View style={styles.backgroundBottom} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animated.View style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }]
            }
          ]}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/aicologo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <ThemedText style={styles.brandName}>Koyuncu Hali</ThemedText>
            <ThemedText style={styles.brandTagline}>Siparis Takip Sistemi</ThemedText>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[
            styles.formCard,
            {
              opacity: formOpacity,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => { if (!isLogin) toggleMode(); }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.tabText, isLogin && styles.tabTextActive]}>
                  Giris Yap
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => { if (isLogin) toggleMode(); }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                  Kayit Ol
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              {isLogin ? (
                <>
                  {renderInput('email', 'E-posta adresi', loginData.email,
                    (text) => setLoginData({...loginData, email: text}), 'login-email',
                    { keyboardType: 'email-address', autoCapitalize: 'none' }
                  )}
                  {renderInput('lock', 'Sifre', loginData.sifre,
                    (text) => setLoginData({...loginData, sifre: text}), 'login-password',
                    {
                      secureTextEntry: true,
                      showToggle: true,
                      isVisible: showPassword,
                      onToggleVisibility: () => setShowPassword(!showPassword)
                    }
                  )}

                  <TouchableOpacity style={styles.forgotPassword}>
                    <ThemedText style={styles.forgotPasswordText}>Sifremi Unuttum</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {renderInput('account', 'Ad Soyad', formData.Ad_Soyad,
                    (text) => setFormData({...formData, Ad_Soyad: text}), 'reg-name'
                  )}
                  {renderInput('email', 'E-posta adresi', formData.email,
                    (text) => setFormData({...formData, email: text}), 'reg-email',
                    { keyboardType: 'email-address', autoCapitalize: 'none' }
                  )}
                  {renderInput('phone', 'Telefon', formData.telefon,
                    (text) => setFormData({...formData, telefon: text}), 'reg-phone',
                    { keyboardType: 'phone-pad' }
                  )}
                  {renderInput('lock', 'Sifre', formData.sifre,
                    (text) => setFormData({...formData, sifre: text}), 'reg-password',
                    {
                      secureTextEntry: true,
                      showToggle: true,
                      isVisible: showPassword,
                      onToggleVisibility: () => setShowPassword(!showPassword)
                    }
                  )}
                  {renderInput('lock-check', 'Sifre Tekrar', formData.sifre_tekrar,
                    (text) => setFormData({...formData, sifre_tekrar: text}), 'reg-confirm',
                    {
                      secureTextEntry: true,
                      showToggle: true,
                      isVisible: showConfirmPassword,
                      onToggleVisibility: () => setShowConfirmPassword(!showConfirmPassword)
                    }
                  )}
                </>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={isLogin ? handleLogin : handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingDot} />
                  <View style={[styles.loadingDot, styles.loadingDot2]} />
                  <View style={[styles.loadingDot, styles.loadingDot3]} />
                </View>
              ) : (
                <>
                  <ThemedText style={styles.submitButtonText}>
                    {isLogin ? 'Giris Yap' : 'Kayit Ol'}
                  </ThemedText>
                  <IconSymbol name="arrow-right" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>2025 Koyuncu Hali</ThemedText>
            <View style={styles.footerDivider} />
            <ThemedText style={styles.footerCredit}>AICO SOFTWARE</ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.main,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundTop: {
    flex: 1,
    backgroundColor: COLORS.primary.main,
  },
  backgroundBottom: {
    flex: 1,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  logo: {
    width: 56,
    height: 56,
    tintColor: '#FFFFFF',
  },
  brandName: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  brandTagline: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  formCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.light.surface,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.tertiary,
  },
  tabTextActive: {
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  formFields: {
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary.accent,
    backgroundColor: COLORS.light.surface,
  },
  inputIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    paddingRight: SPACING.base,
  },
  visibilityToggle: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
  },
  forgotPasswordText: {
    color: COLORS.primary.accent,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  submitButton: {
    backgroundColor: COLORS.primary.main,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 24,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
  },
  loadingDot2: {
    opacity: 0.7,
  },
  loadingDot3: {
    opacity: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING['2xl'],
    gap: SPACING.sm,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  footerDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary.accent,
  },
  footerCredit: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
