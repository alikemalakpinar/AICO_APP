import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from './ThemedText';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/Theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onStart?: () => void;
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Circle expand
    Animated.timing(circleScale, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Logo animation sequence
    Animated.sequence([
      // Fade in and scale up logo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Fade in text
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Show loader
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation
    const timeout = setTimeout(() => {
      if (onStart) {
        onStart();
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles */}
      <Animated.View
        style={[
          styles.decorativeCircle1,
          { transform: [{ scale: circleScale }] }
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle2,
          { transform: [{ scale: circleScale }] }
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle3,
          { transform: [{ scale: circleScale }] }
        ]}
      />

      {/* Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { rotate: spin }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={require('../../assets/images/aicologo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </LinearGradient>
      </Animated.View>

      {/* Brand Text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }]
          }
        ]}
      >
        <ThemedText style={styles.brandName}>Koyuncu Hali</ThemedText>
        <ThemedText style={styles.tagline}>Siparis Takip Sistemi</ThemedText>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View style={[styles.loaderContainer, { opacity: loaderOpacity }]}>
        <View style={styles.loader}>
          <View style={[styles.loaderDot, styles.loaderDot1]} />
          <View style={[styles.loaderDot, styles.loaderDot2]} />
          <View style={[styles.loaderDot, styles.loaderDot3]} />
        </View>
        <ThemedText style={styles.loadingText}>Yukleniyor...</ThemedText>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>AICO SOFTWARE</ThemedText>
        <ThemedText style={styles.versionText}>v1.0.0</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.primary.main,
    opacity: 0.08,
    top: -150,
    right: -150,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary.accent,
    opacity: 0.06,
    bottom: 100,
    left: -100,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary.light,
    opacity: 0.05,
    top: height * 0.3,
    left: -80,
  },
  logoContainer: {
    marginBottom: SPACING['2xl'],
  },
  logoGradient: {
    width: 140,
    height: 140,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary.main,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  brandName: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.primary.light,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loaderContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 150,
  },
  loader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  loaderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary.main,
  },
  loaderDot1: {
    opacity: 0.4,
  },
  loaderDot2: {
    opacity: 0.6,
  },
  loaderDot3: {
    opacity: 1,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.dark.text.tertiary,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.dark.text.tertiary,
  },
});
