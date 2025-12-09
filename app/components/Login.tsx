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
} from 'react-native';
import ThemedText from './ThemedText';
import IconSymbol from './ui/IconSymbol';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../constants/Api';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Form slide in
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const animateFormSwitch = () => {
    Animated.sequence([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
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
            color={isFocused ? COLORS.primary.main : COLORS.light.text.tertiary}
          />
        </View>
        <TextInput
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor={COLORS.light.text.tertiary}
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
              color={COLORS.light.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Logo Section */}
        <Animated.View style={[
          styles.logoSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }]
          }
        ]}>
          <Animated.View style={[
            styles.logoContainer,
            { transform: [{ rotate: spin }] }
          ]}>
            <LinearGradient
              colors={[COLORS.primary.main, COLORS.primary.dark]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image
                source={require('../../assets/images/aicologo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </LinearGradient>
          </Animated.View>

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
          <BlurView intensity={20} tint="light" style={styles.blurContainer}>
            <View style={styles.formInner}>
              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, isLogin && styles.tabActive]}
                  onPress={() => { if (!isLogin) toggleMode(); }}
                >
                  <ThemedText style={[styles.tabText, isLogin && styles.tabTextActive]}>
                    Giris Yap
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, !isLogin && styles.tabActive]}
                  onPress={() => { if (isLogin) toggleMode(); }}
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
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={isLogin ? handleLogin : handleRegister}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={COLORS.gradients.primary}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
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
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>2025 Koyuncu Hali</ThemedText>
          <View style={styles.footerDivider} />
          <ThemedText style={styles.footerCredit}>AICO SOFTWARE</ThemedText>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary.main,
    opacity: 0.1,
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.secondary.main,
    opacity: 0.08,
    bottom: 100,
    left: -80,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primary.light,
    opacity: 0.06,
    top: height * 0.4,
    right: -50,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  logoContainer: {
    marginBottom: SPACING.base,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  logo: {
    width: 70,
    height: 70,
  },
  brandName: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  brandTagline: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.dark.text.tertiary,
  },
  formCard: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: RADIUS['2xl'],
  },
  formInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: SPACING.xl,
    borderRadius: RADIUS['2xl'],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.light.surfaceVariant,
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: COLORS.light.surfaceVariant,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary.main,
    backgroundColor: '#FFFFFF',
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
    color: COLORS.primary.main,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  submitButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.colored(COLORS.primary.main),
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
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
    color: COLORS.dark.text.tertiary,
  },
  footerDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary.main,
  },
  footerCredit: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
