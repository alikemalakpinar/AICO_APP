import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import React, { useState } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import ProfileSettingsScreen from './settings/ProfileSettingsScreen';
import SecuritySettingsScreen from './settings/SecuritySettingsScreen';
import HelpCenterScreen from './settings/HelpCenterScreen';
import AboutScreen from './settings/AboutScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PersonnelListScreen from './settings/PersonnelListScreen';

interface SettingsScreenProps {
  userRole: string;
}

export default function SettingsScreen({ userRole }: SettingsScreenProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [currentModal, setCurrentModal] = useState<'profile' | 'security' | 'help' | 'about' | 'personnel' | null>(null);

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
      // Burada tema değişikliği yapılacak
    } catch (error) {
      console.error('Dark mode ayarı kaydedilemedi:', error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    try {
      await AsyncStorage.setItem('notifications', value.toString());
      // Burada bildirim ayarları güncellenecek
    } catch (error) {
      console.error('Bildirim ayarı kaydedilemedi:', error);
    }
  };

  const handleEmailNotificationsToggle = async (value: boolean) => {
    setEmailNotifications(value);
    try {
      await AsyncStorage.setItem('emailNotifications', value.toString());
      // Burada e-posta bildirimleri ayarı güncellenecek
    } catch (error) {
      console.error('E-posta bildirimi ayarı kaydedilemedi:', error);
    }
  };

  const handleHelpPress = () => {
    setCurrentModal('help');
  };

  const handleAboutPress = () => {
    setCurrentModal('about');
  };

  const baseSettingSections = [
    {
      title: 'Hesap',
      items: [
        {
          icon: 'account',
          label: 'Profil Bilgileri',
          type: 'link',
          onPress: () => setCurrentModal('profile'),
        },
        {
          icon: 'shield-check',
          label: 'Güvenlik',
          type: 'link',
          onPress: () => setCurrentModal('security'),
        },
      ],
    },
    {
      title: 'Tercihler',
      items: [
        {
          icon: 'theme-light-dark',
          label: 'Karanlık Mod',
          type: 'switch',
          value: darkMode,
          onValueChange: handleDarkModeToggle,
        },
        {
          icon: 'bell',
          label: 'Bildirimler',
          type: 'switch',
          value: notifications,
          onValueChange: handleNotificationsToggle,
        },
        {
          icon: 'email',
          label: 'E-posta Bildirimleri',
          type: 'switch',
          value: emailNotifications,
          onValueChange: handleEmailNotificationsToggle,
        },
      ],
    },
    {
      title: 'Destek',
      items: [
        {
          icon: 'help-circle',
          label: 'Yardım Merkezi',
          type: 'link',
          onPress: handleHelpPress,
        },
        {
          icon: 'information',
          label: 'Hakkında',
          type: 'link',
          onPress: handleAboutPress,
        },
      ],
    },
  ];

  // Personel Yönetim bölümünü sadece Patron için ekle
  const settingSections = userRole === 'Patron' 
    ? [...baseSettingSections, {
        title: 'Personel Yönetim',
        items: [
          {
            icon: 'account-group',
            label: 'Personel Listesi',
            type: 'link',
            onPress: () => setCurrentModal('personnel'),
          },
        ],
      }]
    : baseSettingSections;

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      key={item.label}
      style={styles.settingItem}
      onPress={item.type === 'link' ? item.onPress : undefined}
      disabled={item.type === 'switch'}
    >
      <View style={styles.settingItemLeft}>
        <IconSymbol name={item.icon} size={24} color="#00b51a" style={styles.itemIcon} />
        <ThemedText style={styles.itemLabel}>{item.label}</ThemedText>
      </View>
      {item.type === 'switch' ? (
        <Switch
          value={item.value}
          onValueChange={item.onValueChange}
          trackColor={{ false: '#767577', true: '#b8e5bd' }}
          thumbColor={item.value ? '#00b51a' : '#f4f3f4'}
        />
      ) : (
        <IconSymbol name="chevron-right" size={24} color="#666" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={currentModal === 'profile'}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ProfileSettingsScreen onClose={() => setCurrentModal(null)} />
      </Modal>

      <Modal
        visible={currentModal === 'security'}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SecuritySettingsScreen onClose={() => setCurrentModal(null)} />
      </Modal>

      <Modal
        visible={currentModal === 'help'}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <HelpCenterScreen onClose={() => setCurrentModal(null)} />
      </Modal>

      <Modal
        visible={currentModal === 'about'}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <AboutScreen onClose={() => setCurrentModal(null)} />
      </Modal>

      <Modal
        visible={currentModal === 'personnel'}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <PersonnelListScreen onClose={() => setCurrentModal(null)} userRole={userRole} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    color: '#333',
  },
}); 