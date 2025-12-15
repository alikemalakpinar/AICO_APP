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
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from './ThemedText';
import IconSymbol from './ui/IconSymbol';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATIONS } from '../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../constants/Api';

const { width, height } = Dimensions.get('window');
const SESSION_KEY = 'user_session';

interface Branch {
  id: number;
  name: string;
  address: string;
  is_active: boolean;
}

interface UserSession {
  userName: string;
  userRole: string;
  permissions: string[];
  email: string;
  branchId?: number;
  branchName?: string;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
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
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData);
        router.replace({
          pathname: '/components/MainScreen',
          params: {
            userName: session.userName,
            userRole: session.userRole,
            permissions: JSON.stringify(session.permissions)
          }
        });
        return;
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsCheckingSession(false);
      startAnimations();
    }
  };

  const saveSession = async (userData: UserSession) => {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.orders.replace('/api/orders', '/api/branches')}`, {}, 10000);
      const data = await response.json();
      const activeBranches = data.filter((b: Branch) => b.is_active);
      setBranches(activeBranches);
      return activeBranches;
    } catch (error) {
      console.error('Branch fetch error:', error);
      return [];
    }
  };

  const proceedToMainScreen = async (userData: any, branch: Branch | null) => {
    const sessionData: UserSession = {
      userName: userData.Ad_Soyad,
      userRole: userData.yetki,
      permissions: userData.permissions || [],
      email: loginData.email,
      branchId: branch?.id,
      branchName: branch?.name,
    };

    await saveSession(sessionData);

    router.replace({
      pathname: '/components/MainScreen',
      params: {
        userName: userData.Ad_Soyad,
        userRole: userData.yetki,
        permissions: JSON.stringify(userData.permissions),
        branchId: branch?.id?.toString() || '',
        branchName: branch?.name || '',
      }
    });
  };

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch);
    setShowBranchSelector(false);
    if (pendingUserData) {
      await proceedToMainScreen(pendingUserData, branch);
    }
  };

  const startAnimations = () => {
    // Start pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        ...ANIMATIONS.spring.bouncy,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
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
        Animated.spring(formSlide, {
          toValue: 0,
          ...ANIMATIONS.spring.default,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          ...ANIMATIONS.spring.default,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  };

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

      // Fetch branches to see if user needs to select one
      const availableBranches = await fetchBranches();

      if (availableBranches.length > 1) {
        // Multiple branches - show selector
        setPendingUserData(data);
        setShowBranchSelector(true);
      } else if (availableBranches.length === 1) {
        // Single branch - auto-select
        await proceedToMainScreen(data, availableBranches[0]);
      } else {
        // No branches - proceed without branch
        await proceedToMainScreen(data, null);
      }
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
      <Animated.View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        { transform: [{ translateY: formSlide }] }
      ]}>
        <View style={[
          styles.inputIconContainer,
          isFocused && styles.inputIconContainerFocused
        ]}>
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
      </Animated.View>
    );
  };

  // Show loading screen while checking session
  if (isCheckingSession) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        <LinearGradient
          colors={COLORS.gradients.primary as [string, string]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContent}>
          <Animated.View style={[styles.loadingLogoContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Image
              source={require('../../assets/images/aicologo.png')}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
          </Animated.View>
          <ThemedText style={styles.loadingBrandName}>Koyuncu Hali</ThemedText>
          <ThemedText style={styles.loadingTagline}>Siparis Takip Sistemi</ThemedText>
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  }

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={COLORS.gradients.primary as [string, string]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />
      </LinearGradient>

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
              transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }]
            }
          ]}>
            <View style={styles.logoGlow}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/images/aicologo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
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
                {isLogin && (
                  <LinearGradient
                    colors={COLORS.gradients.primary as [string, string]}
                    style={styles.tabActiveGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
                <ThemedText style={[styles.tabText, isLogin && styles.tabTextActive]}>
                  Giris Yap
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => { if (isLogin) toggleMode(); }}
                activeOpacity={0.7}
              >
                {!isLogin && (
                  <LinearGradient
                    colors={COLORS.gradients.primary as [string, string]}
                    style={styles.tabActiveGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
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
              <LinearGradient
                colors={COLORS.gradients.primary as [string, string]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <ThemedText style={styles.submitButtonText}>
                      {isLogin ? 'Giris Yap' : 'Kayit Ol'}
                    </ThemedText>
                    <View style={styles.submitArrow}>
                      <IconSymbol name="arrow-right" size={18} color="#fff" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: formOpacity }]}>
            <ThemedText style={styles.footerText}>2025 Koyuncu Hali</ThemedText>
            <View style={styles.footerDot} />
            <ThemedText style={styles.footerCredit}>AICO SOFTWARE</ThemedText>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Branch Selection Modal */}
      <Modal
        visible={showBranchSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBranchSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.branchModalContainer}>
            <LinearGradient
              colors={COLORS.gradients.primary as [string, string]}
              style={styles.branchModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <IconSymbol name="store" size={32} color="#FFFFFF" />
              <ThemedText style={styles.branchModalTitle}>Şube Seçin</ThemedText>
              <ThemedText style={styles.branchModalSubtitle}>
                Çalışmak istediğiniz şubeyi seçin
              </ThemedText>
            </LinearGradient>

            <FlatList
              data={branches}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.branchList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.branchItem,
                    selectedBranch?.id === item.id && styles.branchItemSelected
                  ]}
                  onPress={() => handleBranchSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.branchIconContainer}>
                    <IconSymbol
                      name="store-outline"
                      size={24}
                      color={selectedBranch?.id === item.id ? COLORS.primary.main : COLORS.neutral[400]}
                    />
                  </View>
                  <View style={styles.branchInfo}>
                    <ThemedText style={styles.branchName}>{item.name}</ThemedText>
                    {item.address && (
                      <ThemedText style={styles.branchAddress}>{item.address}</ThemedText>
                    )}
                  </View>
                  <IconSymbol
                    name="chevron-right"
                    size={24}
                    color={COLORS.neutral[300]}
                  />
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.branchModalCloseButton}
              onPress={() => {
                setShowBranchSelector(false);
                if (pendingUserData && branches.length > 0) {
                  proceedToMainScreen(pendingUserData, branches[0]);
                }
              }}
            >
              <ThemedText style={styles.branchModalCloseText}>
                Varsayılan ile devam et
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle3: {
    position: 'absolute',
    bottom: -50,
    right: 50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: RADIUS['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.xl,
  },
  loadingLogo: {
    width: 70,
    height: 70,
    tintColor: '#FFFFFF',
  },
  loadingBrandName: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  loadingTagline: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loadingIndicator: {
    marginTop: SPACING['3xl'],
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  logoGlow: {
    padding: 4,
    borderRadius: RADIUS['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: RADIUS['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: '#FFFFFF',
  },
  brandName: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  brandTagline: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.xs,
  },
  formCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['3xl'],
    padding: SPACING.xl,
    ...SHADOWS['2xl'],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.xl,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  tabActive: {
    ...SHADOWS.md,
  },
  tabActiveGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.tertiary,
  },
  tabTextActive: {
    color: '#fff',
  },
  formFields: {
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary.accent,
    backgroundColor: COLORS.light.surface,
    ...SHADOWS.sm,
  },
  inputIconContainer: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  inputIconContainerFocused: {
    backgroundColor: COLORS.primary.accent + '10',
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    paddingRight: SPACING.base,
  },
  visibilityToggle: {
    width: 52,
    height: 52,
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
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  submitButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  submitArrow: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING['3xl'],
    gap: SPACING.sm,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  footerCredit: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#fff',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  branchModalContainer: {
    backgroundColor: COLORS.light.surface,
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    maxHeight: height * 0.7,
    ...SHADOWS['2xl'],
  },
  branchModalHeader: {
    padding: SPACING.xl,
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    alignItems: 'center',
  },
  branchModalTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  branchModalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: SPACING.xs,
  },
  branchList: {
    padding: SPACING.base,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  branchItemSelected: {
    borderColor: COLORS.primary.main,
    backgroundColor: COLORS.primary.main + '10',
  },
  branchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginBottom: 2,
  },
  branchAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  branchModalCloseButton: {
    padding: SPACING.base,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  branchModalCloseText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
