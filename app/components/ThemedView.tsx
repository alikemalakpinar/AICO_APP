import { View, ViewProps } from 'react-native';
import React from 'react';

export default function ThemedView(props: ViewProps) {
  return (
    <View {...props} style={[{ backgroundColor: '#fff' }, props.style]}>
      {props.children}
    </View>
  );
} 