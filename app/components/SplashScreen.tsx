import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { router } from 'expo-router';
import React from 'react';
import IconSymbol from './ui/IconSymbol';
import ThemedText from './ThemedText';

interface SplashScreenProps {
  onStart?: () => void;
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  const handleStart = () => {
    if (onStart) {
      onStart();
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Arka Plan */}
      <Video
        source={require('../../assets/carpet.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Karanlık Overlay */}
      <View style={styles.overlay} />

      {/* Başlat Butonu */}
      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <ThemedText style={styles.buttonText}>Başlamak için</ThemedText>
        <IconSymbol name="arrow-right" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Loş efekti
  },
  startButton: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    backgroundColor: 'rgba(0, 181, 26, 0.9)', // Yeşil tema rengi
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 