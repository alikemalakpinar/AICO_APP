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
  code: string;
  address: string;
  city: string;
  is_active: boolean;
}

interface Employee {
  id: number;
  Ad_Soyad: string;
  email: string;
  yetki: string;
  avatar: string;
}

interface UserSession {
  userId?: number;
  userName: string;
  userRole: string;
  permissions: string[];
  email: string;
  branchId?: number;
  branchName?: string;
  loginType: 'sales' | 'management';
}

export default function Login() {
  // Main tab state: 'sales' or 'management'
  const [activeTab, setActiveTab] = useState<'sales' | 'management'>('sales');

  // Sales login states
  const [salesStep, setSalesStep] = useState<1 | 2 | 3>(1); // 1: branch, 2: employee, 3: password
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [salesPassword, setSalesPassword] = useState('');

  // Management login states (email + password)
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', sifre: '' });
  const [formData, setFormData] = useState({
    Ad_Soyad: '',
    email: '',
    telefon: '',
    sifre: '',
    sifre_tekrar: ''
  });

  // Common states
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkExistingSession();
  }, []);

  useEffect(() => {
    if (activeTab === 'sales' && salesStep === 1) {
      fetchBranches();
    }
  }, [activeTab]);

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
            permissions: JSON.stringify(session.permissions),
            branchId: session.branchId?.toString() || '',
            branchName: session.branchName || '',
          }
        });
        return;
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsCheckingSession(false);
      startAnimations();
      fetchBranches();
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
      const response = await fetchWithTimeout(API_ENDPOINTS.branches, {}, 10000);
      const data = await response.json();
      const activeBranches = data.filter((b: Branch) => b.is_active);
      setBranches(activeBranches);
    } catch (error) {
      console.error('Branch fetch error:', error);
    }
  };

  const fetchBranchEmployees = async (branchId: number) => {
    try {
      setIsLoading(true);
      const response = await fetchWithTimeout(API_ENDPOINTS.branchUsers(branchId), {}, 10000);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Employee fetch error:', error);
      Alert.alert('Hata', 'Çalışan listesi alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const startAnimations = () => {
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
    ]).start();

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

  // Sales Login Handlers
  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedEmployee(null);
    setSalesPassword('');
    setSalesStep(2);
    fetchBranchEmployees(branch.id);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSalesPassword('');
    setSalesStep(3);
  };

  const handleSalesLogin = async () => {
    if (!selectedBranch || !selectedEmployee || !salesPassword) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.loginSales, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: selectedBranch.id,
          user_id: selectedEmployee.id,
          sifre: salesPassword,
        }),
      }, 15000);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      await saveSession({
        userId: data.id,
        userName: data.Ad_Soyad,
        userRole: data.yetki,
        permissions: data.permissions || [],
        email: data.email,
        branchId: data.branch_id,
        branchName: data.branch_name,
        loginType: 'sales',
      });

      router.replace({
        pathname: '/components/MainScreen',
        params: {
          userName: data.Ad_Soyad,
          userRole: data.yetki,
          permissions: JSON.stringify(data.permissions),
          branchId: data.branch_id?.toString() || '',
          branchName: data.branch_name || '',
        }
      });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Giriş başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalesBack = () => {
    if (salesStep === 2) {
      setSalesStep(1);
      setSelectedBranch(null);
      setEmployees([]);
    } else if (salesStep === 3) {
      setSalesStep(2);
      setSelectedEmployee(null);
      setSalesPassword('');
    }
  };

  // Management Login Handlers
  const handleManagementLogin = async () => {
    if (!loginData.email || !loginData.sifre) {
      Alert.alert('Uyarı', 'Lütfen email ve şifrenizi girin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      }, 15000);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      await saveSession({
        userId: data.id,
        userName: data.Ad_Soyad,
        userRole: data.yetki,
        permissions: data.permissions || [],
        email: loginData.email,
        branchId: data.branch_id,
        branchName: data.branch_name,
        loginType: 'management',
      });

      router.replace({
        pathname: '/components/MainScreen',
        params: {
          userName: data.Ad_Soyad,
          userRole: data.yetki,
          permissions: JSON.stringify(data.permissions),
          branchId: data.branch_id?.toString() || '',
          branchName: data.branch_name || '',
        }
      });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Sunucuya bağlanılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.Ad_Soyad || !formData.email || !formData.telefon || !formData.sifre || !formData.sifre_tekrar) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (formData.sifre !== formData.sifre_tekrar) {
      Alert.alert('Hata', 'Şifreler eşleşmedi');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }, 15000);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız');
      }

      Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı');
      setIsLogin(true);
      setLoginData({ email: formData.email, sifre: '' });
      setFormData({ Ad_Soyad: '', email: '', telefon: '', sifre: '', sifre_tekrar: '' });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Sunucuya bağlanılamadı');
    } finally {
      setIsLoading(false);
    }
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

  // Sales Tab Content
  const renderSalesContent = () => {
    if (salesStep === 1) {
      return (
        <View style={styles.salesStepContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <ThemedText style={styles.stepBadgeText}>1</ThemedText>
            </View>
            <ThemedText style={styles.stepTitle}>Şube Seçin</ThemedText>
          </View>

          <FlatList
            data={branches}
            keyExtractor={(item) => item.id.toString()}
            style={styles.branchList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.branchItem}
                onPress={() => handleBranchSelect(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F8FAFC', '#F1F5F9']}
                  style={styles.branchItemGradient}
                >
                  <View style={styles.branchIcon}>
                    <IconSymbol name="store" size={24} color={COLORS.primary.main} />
                  </View>
                  <View style={styles.branchInfo}>
                    <ThemedText style={styles.branchName}>{item.name}</ThemedText>
                    {item.city && (
                      <ThemedText style={styles.branchCity}>{item.city}</ThemedText>
                    )}
                  </View>
                  <IconSymbol name="chevron-right" size={24} color={COLORS.neutral[400]} />
                </LinearGradient>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconSymbol name="store-off" size={48} color={COLORS.neutral[300]} />
                <ThemedText style={styles.emptyText}>Şube bulunamadı</ThemedText>
              </View>
            }
          />
        </View>
      );
    }

    if (salesStep === 2) {
      return (
        <View style={styles.salesStepContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleSalesBack}>
            <IconSymbol name="arrow-left" size={20} color={COLORS.primary.accent} />
            <ThemedText style={styles.backButtonText}>Geri</ThemedText>
          </TouchableOpacity>

          <View style={styles.selectedBranchBadge}>
            <IconSymbol name="store" size={16} color={COLORS.primary.main} />
            <ThemedText style={styles.selectedBranchText}>{selectedBranch?.name}</ThemedText>
          </View>

          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <ThemedText style={styles.stepBadgeText}>2</ThemedText>
            </View>
            <ThemedText style={styles.stepTitle}>Çalışan Seçin</ThemedText>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary.main} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id.toString()}
              style={styles.branchList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.employeeItem}
                  onPress={() => handleEmployeeSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.employeeAvatar}>
                    <ThemedText style={styles.employeeAvatarText}>
                      {item.Ad_Soyad.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.employeeInfo}>
                    <ThemedText style={styles.employeeName}>{item.Ad_Soyad}</ThemedText>
                    <ThemedText style={styles.employeeRole}>{item.yetki}</ThemedText>
                  </View>
                  <IconSymbol name="chevron-right" size={24} color={COLORS.neutral[400]} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IconSymbol name="account-off" size={48} color={COLORS.neutral[300]} />
                  <ThemedText style={styles.emptyText}>Bu şubede çalışan bulunamadı</ThemedText>
                </View>
              }
            />
          )}
        </View>
      );
    }

    // Step 3: Password
    return (
      <View style={styles.salesStepContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleSalesBack}>
          <IconSymbol name="arrow-left" size={20} color={COLORS.primary.accent} />
          <ThemedText style={styles.backButtonText}>Geri</ThemedText>
        </TouchableOpacity>

        <View style={styles.selectedInfoContainer}>
          <View style={styles.selectedBranchBadge}>
            <IconSymbol name="store" size={16} color={COLORS.primary.main} />
            <ThemedText style={styles.selectedBranchText}>{selectedBranch?.name}</ThemedText>
          </View>
          <View style={[styles.selectedBranchBadge, { backgroundColor: COLORS.success.muted }]}>
            <IconSymbol name="account" size={16} color={COLORS.success.main} />
            <ThemedText style={[styles.selectedBranchText, { color: COLORS.success.main }]}>
              {selectedEmployee?.Ad_Soyad}
            </ThemedText>
          </View>
        </View>

        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <ThemedText style={styles.stepBadgeText}>3</ThemedText>
          </View>
          <ThemedText style={styles.stepTitle}>Şifre Girin</ThemedText>
        </View>

        <View style={styles.passwordContainer}>
          {renderInput('lock', 'Şifrenizi girin', salesPassword,
            setSalesPassword, 'sales-password',
            {
              secureTextEntry: true,
              showToggle: true,
              isVisible: showPassword,
              onToggleVisibility: () => setShowPassword(!showPassword)
            }
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSalesLogin}
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
                  <ThemedText style={styles.submitButtonText}>Giriş Yap</ThemedText>
                  <View style={styles.submitArrow}>
                    <IconSymbol name="arrow-right" size={18} color="#fff" />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Management Tab Content
  const renderManagementContent = () => {
    return (
      <View style={styles.managementContainer}>
        {/* Sub-tabs for Login/Register */}
        <View style={styles.subTabContainer}>
          <TouchableOpacity
            style={[styles.subTab, isLogin && styles.subTabActive]}
            onPress={() => setIsLogin(true)}
            activeOpacity={0.7}
          >
            {isLogin && (
              <LinearGradient
                colors={COLORS.gradients.primary as [string, string]}
                style={styles.subTabActiveGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <ThemedText style={[styles.subTabText, isLogin && styles.subTabTextActive]}>
              Giriş Yap
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, !isLogin && styles.subTabActive]}
            onPress={() => setIsLogin(false)}
            activeOpacity={0.7}
          >
            {!isLogin && (
              <LinearGradient
                colors={COLORS.gradients.primary as [string, string]}
                style={styles.subTabActiveGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <ThemedText style={[styles.subTabText, !isLogin && styles.subTabTextActive]}>
              Kayıt Ol
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
              {renderInput('lock', 'Şifre', loginData.sifre,
                (text) => setLoginData({...loginData, sifre: text}), 'login-password',
                {
                  secureTextEntry: true,
                  showToggle: true,
                  isVisible: showPassword,
                  onToggleVisibility: () => setShowPassword(!showPassword)
                }
              )}

              <TouchableOpacity style={styles.forgotPassword}>
                <ThemedText style={styles.forgotPasswordText}>Şifremi Unuttum</ThemedText>
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
              {renderInput('lock', 'Şifre', formData.sifre,
                (text) => setFormData({...formData, sifre: text}), 'reg-password',
                {
                  secureTextEntry: true,
                  showToggle: true,
                  isVisible: showPassword,
                  onToggleVisibility: () => setShowPassword(!showPassword)
                }
              )}
              {renderInput('lock-check', 'Şifre Tekrar', formData.sifre_tekrar,
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
          onPress={isLogin ? handleManagementLogin : handleRegister}
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
                  {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                </ThemedText>
                <View style={styles.submitArrow}>
                  <IconSymbol name="arrow-right" size={18} color="#fff" />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading screen
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
          <ThemedText style={styles.loadingBrandName}>Koyuncu Halı</ThemedText>
          <ThemedText style={styles.loadingTagline}>Sipariş Takip Sistemi</ThemedText>
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  }

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
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
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

            <ThemedText style={styles.brandName}>Koyuncu Halı</ThemedText>
            <ThemedText style={styles.brandTagline}>Sipariş Takip Sistemi</ThemedText>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[
            styles.formCard,
            {
              opacity: formOpacity,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {/* Main Tab Switcher: Sales / Management */}
            <View style={styles.mainTabContainer}>
              <TouchableOpacity
                style={[styles.mainTab, activeTab === 'sales' && styles.mainTabActive]}
                onPress={() => {
                  setActiveTab('sales');
                  setSalesStep(1);
                  setSelectedBranch(null);
                  setSelectedEmployee(null);
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name="cart"
                  size={20}
                  color={activeTab === 'sales' ? '#fff' : COLORS.neutral[400]}
                />
                <ThemedText style={[
                  styles.mainTabText,
                  activeTab === 'sales' && styles.mainTabTextActive
                ]}>
                  Satış
                </ThemedText>
                {activeTab === 'sales' && (
                  <LinearGradient
                    colors={COLORS.gradients.primary as [string, string]}
                    style={styles.mainTabActiveGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mainTab, activeTab === 'management' && styles.mainTabActive]}
                onPress={() => setActiveTab('management')}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name="cog"
                  size={20}
                  color={activeTab === 'management' ? '#fff' : COLORS.neutral[400]}
                />
                <ThemedText style={[
                  styles.mainTabText,
                  activeTab === 'management' && styles.mainTabTextActive
                ]}>
                  Yönetim
                </ThemedText>
                {activeTab === 'management' && (
                  <LinearGradient
                    colors={COLORS.gradients.primary as [string, string]}
                    style={styles.mainTabActiveGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {activeTab === 'sales' ? renderSalesContent() : renderManagementContent()}
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: formOpacity }]}>
            <ThemedText style={styles.footerText}>2025 Koyuncu Halı</ThemedText>
            <View style={styles.footerDot} />
            <ThemedText style={styles.footerCredit}>AICO SOFTWARE</ThemedText>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoGlow: {
    padding: 4,
    borderRadius: RADIUS['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.md,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  logo: {
    width: 50,
    height: 50,
    tintColor: '#FFFFFF',
  },
  brandName: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  brandTagline: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.xs,
  },
  formCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['3xl'],
    padding: SPACING.lg,
    ...SHADOWS['2xl'],
    minHeight: 400,
  },
  // Main Tab Styles (Sales / Management)
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.xl,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    gap: SPACING.sm,
    zIndex: 1,
  },
  mainTabActive: {
    ...SHADOWS.md,
  },
  mainTabActiveGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  mainTabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.tertiary,
  },
  mainTabTextActive: {
    color: '#fff',
  },
  // Sales Steps
  salesStepContainer: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  branchList: {
    maxHeight: 280,
  },
  branchItem: {
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  branchItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  branchIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary.main + '15',
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
  },
  branchCity: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  employeeAvatarText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  employeeRole: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  selectedInfoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  selectedBranchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.main + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  selectedBranchText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  passwordContainer: {
    marginTop: SPACING.md,
  },
  // Management Styles
  managementContainer: {
    flex: 1,
  },
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.xl,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  subTab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  subTabActive: {
    ...SHADOWS.md,
  },
  subTabActiveGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  subTabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.tertiary,
  },
  subTabTextActive: {
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
    marginTop: SPACING.md,
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
    marginTop: SPACING['2xl'],
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
});
