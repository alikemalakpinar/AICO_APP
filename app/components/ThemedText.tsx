import { Text, TextProps } from 'react-native';
import React from 'react';

export default function ThemedText(props: TextProps) {
  return (
    <Text {...props} style={[{ color: '#333' }, props.style]}>
      {props.children}
    </Text>
  );
} 