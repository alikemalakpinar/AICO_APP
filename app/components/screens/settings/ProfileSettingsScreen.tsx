import { View, StyleSheet, TextInput, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import ThemedText from '../../ThemedText';
import IconSymbol from '../../ui/IconSymbol';

export default function ProfileSettingsScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [userInfo, setUserInfo] = useState({
    name: 'Koyuncu Halı',
    email: 'info@koyuncuhali.com',
    phone: '+90 555 123 4567',
    address: 'İstanbul, Türkiye'
  });

  const handleSave = () => {
    // Burada API çağrısı yapılacak
    console.log('Profil bilgileri güncellendi:', userInfo);
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <IconSymbol name="arrow-left" size={24} color="#00b51a" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Profil Bilgileri</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image
            source={require('../../../../assets/images/aicologo.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changePhotoButton}>
            <ThemedText style={styles.changePhotoText}>Fotoğrafı Değiştir</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>İsim</ThemedText>
            <TextInput
              style={styles.input}
              value={userInfo.name}
              onChangeText={(text) => setUserInfo({ ...userInfo, name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>E-posta</ThemedText>
            <TextInput
              style={styles.input}
              value={userInfo.email}
              onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Telefon</ThemedText>
            <TextInput
              style={styles.input}
              value={userInfo.phone}
              onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Adres</ThemedText>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={userInfo.address}
              onChangeText={(text) => setUserInfo({ ...userInfo, address: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <ThemedText style={styles.saveButtonText}>Değişiklikleri Kaydet</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: '#00b51a',
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#00b51a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 