import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import ThemedText from '../../ThemedText';
import IconSymbol from '../../ui/IconSymbol';

export default function AboutScreen({ onClose }: { onClose: () => void }) {
  const handleSocialPress = (url: string) => {
    Linking.openURL(url);
  };

  const socialLinks = [
    {
      icon: 'web',
      title: 'Web Sitemiz',
      url: 'https://www.koyuncuhali.com'
    },
    {
      icon: 'instagram',
      title: 'Instagram',
      url: 'https://instagram.com/koyuncuhali'
    },
    {
      icon: 'facebook',
      title: 'Facebook',
      url: 'https://facebook.com/koyuncuhali'
    },
    {
      icon: 'twitter',
      title: 'Twitter',
      url: 'https://twitter.com/koyuncuhali'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <IconSymbol name="arrow-left" size={24} color="#00b51a" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Hakkında</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <Image
              source={require('../../../../assets/images/aicologo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText style={styles.version}>Versiyon 1.0.0</ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Koyuncu Halı</ThemedText>
            <ThemedText style={styles.description}>
              1980 yılından bu yana kaliteli ve özgün tasarımlarıyla halı sektöründe öncü olan firmamız,
              müşteri memnuniyetini her zaman ön planda tutarak hizmet vermektedir.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Bizi Takip Edin</ThemedText>
            <View style={styles.socialLinks}>
              {socialLinks.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.socialItem}
                  onPress={() => handleSocialPress(link.url)}
                >
                  <IconSymbol name={link.icon} size={24} color="#00b51a" />
                  <ThemedText style={styles.socialText}>{link.title}</ThemedText>
                  <IconSymbol name="chevron-right" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>İletişim</ThemedText>
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <IconSymbol name="map-marker" size={20} color="#00b51a" />
                <ThemedText style={styles.contactText}>
                  Merkez Mah. Halı Sok. No:1{'\n'}
                  34000 İstanbul/Türkiye
                </ThemedText>
              </View>
              <View style={styles.contactItem}>
                <IconSymbol name="phone" size={20} color="#00b51a" />
                <ThemedText style={styles.contactText}>+90 555 123 4567</ThemedText>
              </View>
              <View style={styles.contactItem}>
                <IconSymbol name="email" size={20} color="#00b51a" />
                <ThemedText style={styles.contactText}>info@koyuncuhali.com</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>© 2025 Koyuncu Halı</ThemedText>
            <ThemedText style={styles.footerText}>created by AICO SOFTWARE AND DESIGN</ThemedText>
          </View>
        </ScrollView>
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
  },
  logoSection: {
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  socialLinks: {
    marginTop: 8,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  socialText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contactText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
}); 