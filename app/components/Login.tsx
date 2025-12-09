import { StyleSheet, TextInput, TouchableOpacity, View, ImageBackground, Image, Animated, Alert } from 'react-native';
import ThemedText from './ThemedText';
import ThemedView from './ThemedView';
import IconSymbol from './ui/IconSymbol';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { router, useRouter } from 'expo-router';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
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
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleLogin = async () => {
    if (!loginData.email || !loginData.sifre) {
      Alert.alert('Hata', 'Lütfen email ve şifrenizi girin');
      return;
    }

    try {
      const response = await fetch('http://192.168.0.13:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
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
      Alert.alert('Hata', error.message || 'Giriş yapılamadı');
    }
  };

  const handleRegister = async () => {
    // Form validation
    if (!formData.Ad_Soyad || !formData.email || !formData.telefon || !formData.sifre || !formData.sifre_tekrar) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (formData.sifre !== formData.sifre_tekrar) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    try {
      const response = await fetch('http://192.168.0.13:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız');
      }

      Alert.alert('Başarılı', 'Kayıt işlemi başarıyla tamamlandı');
      setIsLogin(true); // Login formuna geç
      setLoginData({ email: formData.email, sifre: '' }); // Email'i otomatik doldur
      setFormData({ Ad_Soyad: '', email: '', telefon: '', sifre: '', sifre_tekrar: '' }); // Form verilerini temizle
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Background Pattern */}
      <View style={styles.patternOverlay} />
      
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <Animated.Image 
          source={require('../../assets/images/aicologo.png')} 
          style={[styles.logo, { transform: [{ rotate: spin }] }]}
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Form Container */}
        <View style={styles.formContainer}>
          {isLogin ? (
            <>
              {/* Login Form */}
              <View style={styles.inputContainer}>
                <IconSymbol size={20} name="email" color="#00b51a" style={styles.inputIcon} />
                <TextInput 
                  placeholder="E-posta"
                  style={styles.input}
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  value={loginData.email}
                  onChangeText={(text) => setLoginData({...loginData, email: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <IconSymbol size={20} name="lock" color="#00b51a" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Şifre"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#666"
                  value={loginData.sifre}
                  onChangeText={(text) => setLoginData({...loginData, sifre: text})}
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <ThemedText style={styles.forgotPasswordText}>Şifremi Unuttum</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <ThemedText style={styles.loginButtonText}>Giriş Yap</ThemedText>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <ThemedText style={styles.signupText}>Hesabınız yok mu? </ThemedText>
                <TouchableOpacity onPress={toggleMode}>
                  <ThemedText style={styles.signupLink}>Kayıt Ol</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Register Form */}
              <View style={styles.inputContainer}>
                <IconSymbol size={20} name="account" color="#00b51a" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Ad Soyad"
                  style={styles.input}
                  placeholderTextColor="#666"
                  value={formData.Ad_Soyad}
                  onChangeText={(text) => setFormData({...formData, Ad_Soyad: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <IconSymbol size={20} name="email" color="#00b51a" style={styles.inputIcon} />
                <TextInput 
                  placeholder="E-posta"
                  style={styles.input}
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <IconSymbol size={20} name="phone" color="#00b51a" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Telefon"
                  style={styles.input}
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={formData.telefon}
                  onChangeText={(text) => setFormData({...formData, telefon: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <IconSymbol size={20} name="lock" color="#00b51a" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Şifre"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#666"
                  value={formData.sifre}
                  onChangeText={(text) => setFormData({...formData, sifre: text})}
                />
              </View>

              <View style={styles.inputContainer}>
                <IconSymbol size={20} name="lock" color="#00b51a" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Şifre Tekrar"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#666"
                  value={formData.sifre_tekrar}
                  onChangeText={(text) => setFormData({...formData, sifre_tekrar: text})}
                />
              </View>

              <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
                <ThemedText style={styles.loginButtonText}>Kayıt Ol</ThemedText>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <ThemedText style={styles.signupText}>Zaten hesabınız var mı? </ThemedText>
                <TouchableOpacity onPress={toggleMode}>
                  <ThemedText style={styles.signupLink}>Giriş Yap</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>© 2025 Koyuncu Halı</ThemedText>
        <ThemedText style={[styles.footerText, styles.createdBy]}>created by AICO SOFTWARE AND DESIGN</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00b51a',
    opacity: 0.02,
    transform: [{ rotate: '45deg' }],
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: '15%',
    paddingBottom: '5%',
  },
  logo: {
    width: 150,
    height: 150,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#00b51a',
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#00b51a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#00b51a',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  createdBy: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#00b51a',
  },
}); 