import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Animated,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import ProfileSettingsScreen from './settings/ProfileSettingsScreen';
import SecuritySettingsScreen from './settings/SecuritySettingsScreen';
import HelpCenterScreen from './settings/HelpCenterScreen';
import AboutScreen from './settings/AboutScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PersonnelListScreen from './settings/PersonnelListScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';

interface SettingsScreenProps {
  userRole: string;
}

interface SettingItem {
  icon: string;
  label: string;
  description?: string;
  type: 'link' | 'switch';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  color?: string;
}

interface SettingSection {
  title: string;
  icon: string;
  items: SettingItem[];
}

export default function SettingsScreen({ userRole }: SettingsScreenProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [currentModal, setCurrentModal] = useState<'profile' | 'security' | 'help' | 'about' | 'personnel' | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
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

    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const darkModeValue = await AsyncStorage.getItem('darkMode');
      const notificationsValue = await AsyncStorage.getItem('notifications');
      const emailNotificationsValue = await AsyncStorage.getItem('emailNotifications');

      if (darkModeValue !== null) setDarkMode(darkModeValue === 'true');
      if (notificationsValue !== null) setNotifications(notificationsValue === 'true');
      if (emailNotificationsValue !== null) setEmailNotifications(emailNotificationsValue === 'true');
    } catch (error) {
      console.error('Ayarlar yuklenirken hata:', error);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
    } catch (error) {
      console.error('Dark mode ayari kaydedilemedi:', error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    try {
      await AsyncStorage.setItem('notifications', value.toString());
    } catch (error) {
      console.error('Bildirim ayari kaydedilemedi:', error);
    }
  };

  const handleEmailNotificationsToggle = async (value: boolean) => {
    setEmailNotifications(value);
    try {
      await AsyncStorage.setItem('emailNotifications', value.toString());
    } catch (error) {
      console.error('E-posta bildirimi ayari kaydedilemedi:', error);
    }
  };

  const baseSettingSections: SettingSection[] = [
    {
      title: 'Hesap',
      icon: 'account-circle',
      items: [
        {
          icon: 'account-outline',
          label: 'Profil Bilgileri',
          description: 'Ad, e-posta ve telefon',
          type: 'link',
          onPress: () => setCurrentModal('profile'),
          color: COLORS.primary.main,
        },
        {
          icon: 'shield-lock-outline',
          label: 'Guvenlik',
          description: 'Sifre ve guvenlik ayarlari',
          type: 'link',
          onPress: () => setCurrentModal('security'),
          color: COLORS.secondary.main,
        },
      ],
    },
    {
      title: 'Tercihler',
      icon: 'cog',
      items: [
        {
          icon: 'theme-light-dark',
          label: 'Karanlik Mod',
          description: 'Koyu tema kullan',
          type: 'switch',
          value: darkMode,
          onValueChange: handleDarkModeToggle,
          color: COLORS.info.main,
        },
        {
          icon: 'bell-outline',
          label: 'Bildirimler',
          description: 'Push bildirimleri al',
          type: 'switch',
          value: notifications,
          onValueChange: handleNotificationsToggle,
          color: COLORS.warning.main,
        },
        {
          icon: 'email-outline',
          label: 'E-posta Bildirimleri',
          description: 'E-posta ile bilgilendir',
          type: 'switch',
          value: emailNotifications,
          onValueChange: handleEmailNotificationsToggle,
          color: COLORS.success.main,
        },
      ],
    },
    {
      title: 'Destek',
      icon: 'help-circle',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Yardim Merkezi',
          description: 'Sikca sorulan sorular',
          type: 'link',
          onPress: () => setCurrentModal('help'),
          color: COLORS.info.main,
        },
        {
          icon: 'information-outline',
          label: 'Hakkinda',
          description: 'Uygulama bilgileri',
          type: 'link',
          onPress: () => setCurrentModal('about'),
          color: COLORS.primary.main,
        },
      ],
    },
  ];

  const settingSections: SettingSection[] = userRole === 'Patron'
    ? [...baseSettingSections, {
        title: 'Personel Yonetim',
        icon: 'account-group',
        items: [
          {
            icon: 'account-group-outline',
            label: 'Personel Listesi',
            description: 'Calisanlari yonet',
            type: 'link',
            onPress: () => setCurrentModal('personnel'),
            color: COLORS.error.main,
          },
        ],
      }]
    : baseSettingSections;

  const renderSettingItem = (item: SettingItem, index: number, isLast: boolean) => (
    <TouchableOpacity
      key={item.label}
      style={[styles.settingItem, !isLast && styles.settingItemBorder]}
      onPress={item.type === 'link' ? item.onPress : undefined}
      disabled={item.type === 'switch'}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: `${item.color}15` }]}>
        <IconSymbol name={item.icon} size={22} color={item.color || COLORS.primary.main} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingLabel}>{item.label}</ThemedText>
        {item.description && (
          <ThemedText style={styles.settingDescription}>{item.description}</ThemedText>
        )}
      </View>
      {item.type === 'switch' ? (
        <Switch
          value={item.value}
          onValueChange={item.onValueChange}
          trackColor={{ false: COLORS.light.border, true: `${COLORS.primary.main}50` }}
          thumbColor={item.value ? COLORS.primary.main : COLORS.light.surfaceVariant}
          ios_backgroundColor={COLORS.light.border}
        />
      ) : (
        <IconSymbol name="chevron-right" size={22} color={COLORS.light.text.tertiary} />
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: SettingSection, sectionIndex: number) => (
    <Animated.View
      key={section.title}
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        <IconSymbol name={section.icon} size={18} color={COLORS.light.text.tertiary} />
        <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
      </View>
      <View style={styles.sectionContent}>
        {section.items.map((item, index) =>
          renderSettingItem(item, index, index === section.items.length - 1)
        )}
      </View>
    </Animated.View>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <IconSymbol name="cog" size={32} color="#fff" />
            </View>
            <View>
              <ThemedText style={styles.headerTitle}>Ayarlar</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Uygulama tercihlerinizi yonetin
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Settings Sections */}
        {settingSections.map((section, index) => renderSection(section, index))}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <ThemedText style={styles.versionText}>Koyuncu Hali Takip</ThemedText>
          <ThemedText style={styles.versionNumber}>Surum 1.0.0</ThemedText>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
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
    backgroundColor: COLORS.light.background,
  },
  scrollContent: {
    paddingTop: SPACING.base,
  },
  headerCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.borderLight,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginBottom: SPACING.xs,
  },
  versionNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary.main,
  },
});
