import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import ThemedText from '../../ThemedText';
import IconSymbol from '../../ui/IconSymbol';

export default function SecuritySettingsScreen({ onClose }: { onClose: () => void }) {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      // Burada hata gösterimi yapılacak
      console.log('Yeni şifreler eşleşmiyor');
      return;
    }
    // Burada API çağrısı yapılacak
    console.log('Şifre değiştirildi');
    onClose();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <IconSymbol name="arrow-left" size={24} color="#00b51a" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Güvenlik Ayarları</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Şifre Değiştir</ThemedText>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Mevcut Şifre</ThemedText>
              <TextInput
                style={styles.input}
                value={passwords.current}
                onChangeText={(text) => setPasswords({ ...passwords, current: text })}
                secureTextEntry
                placeholder="Mevcut şifrenizi girin"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Yeni Şifre</ThemedText>
              <TextInput
                style={styles.input}
                value={passwords.new}
                onChangeText={(text) => setPasswords({ ...passwords, new: text })}
                secureTextEntry
                placeholder="Yeni şifrenizi girin"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Yeni Şifre Tekrar</ThemedText>
              <TextInput
                style={styles.input}
                value={passwords.confirm}
                onChangeText={(text) => setPasswords({ ...passwords, confirm: text })}
                secureTextEntry
                placeholder="Yeni şifrenizi tekrar girin"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
              <ThemedText style={styles.saveButtonText}>Şifreyi Değiştir</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>İki Faktörlü Doğrulama</ThemedText>
            <TouchableOpacity style={styles.twoFactorButton}>
              <View style={styles.twoFactorContent}>
                <IconSymbol name="shield-check" size={24} color="#00b51a" />
                <ThemedText style={styles.twoFactorText}>İki Faktörlü Doğrulamayı Etkinleştir</ThemedText>
              </View>
              <IconSymbol name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#00b51a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  twoFactorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  twoFactorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  twoFactorText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
}); 