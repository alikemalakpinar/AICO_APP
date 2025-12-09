import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import ThemedText from '../../ThemedText';
import IconSymbol from '../../ui/IconSymbol';

export default function HelpCenterScreen({ onClose }: { onClose: () => void }) {
  const helpItems = [
    {
      title: 'Sık Sorulan Sorular',
      icon: 'frequently-asked-questions',
      onPress: () => console.log('SSS tıklandı')
    },
    {
      title: 'İletişim',
      icon: 'phone-message',
      onPress: () => Linking.openURL('tel:05558985296')
    },
    {
      title: 'Kullanım Kılavuzu',
      icon: 'book-open-page-variant',
      onPress: () => console.log('Kılavuz tıklandı')
    }
  ];

  const handleWebsitePress = () => {
    Linking.openURL('https://aicovision.com/');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:05558985296');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <IconSymbol name="arrow-left" size={24} color="#00b51a" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Yardım Merkezi</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionDescription}>
              Size nasıl yardımcı olabiliriz? Aşağıdaki seçeneklerden birini seçerek destek alabilirsiniz.
            </ThemedText>
          </View>

          <View style={styles.helpItemsContainer}>
            {helpItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.helpItem}
                onPress={item.onPress}
              >
                <View style={styles.helpItemContent}>
                  <IconSymbol name={item.icon} size={24} color="#00b51a" />
                  <ThemedText style={styles.helpItemText}>{item.title}</ThemedText>
                </View>
                <IconSymbol name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.contactSection}>
            <ThemedText style={styles.contactTitle}>Bize Ulaşın</ThemedText>
            <View style={styles.contactContent}>
              <View style={styles.qrContainer}>
                <Image
                  source={require('../../../../assets/images/aicoqr.png')}
                  style={styles.qrCode}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.contactInfo}>
                <ThemedText style={styles.contactText}>
                  E-posta: destek@koyuncuhali.com{'\n'}
                  Telefon: +90 555 123 4567{'\n'}
                  Çalışma Saatleri: 09:00 - 18:00{'\n'}
                </ThemedText>
                <TouchableOpacity onPress={handleWebsitePress} style={styles.websiteLink}>
                  <IconSymbol name="web" size={20} color="#00b51a" />
                  <ThemedText style={styles.websiteLinkText}>aicovision.com</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
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
  section: {
    padding: 16,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  helpItemsContainer: {
    paddingHorizontal: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  helpItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  contactSection: {
    padding: 16,
    marginTop: 24,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  qrContainer: {
    marginRight: 16,
  },
  qrCode: {
    width: 120,
    height: 120,
  },
  contactInfo: {
    flex: 1,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  websiteLinkText: {
    fontSize: 14,
    color: '#00b51a',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  phoneLink: {
    color: '#00b51a',
    textDecorationLine: 'underline',
  },
}); 