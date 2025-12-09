import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

interface IconSymbolProps {
  name: string;
  size: number;
  color: string;
  style?: StyleProp<TextStyle>;
}

export default function IconSymbol({ name, size, color, style }: IconSymbolProps) {
  return (
    <MaterialCommunityIcons
      name={name as any}
      size={size}
      color={color}
      style={style}
    />
  );
} 