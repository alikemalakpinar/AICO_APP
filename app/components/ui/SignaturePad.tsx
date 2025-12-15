import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  GestureResponderEvent,
  Image,
} from 'react-native';
import ThemedText from '../ThemedText';
import IconSymbol from './IconSymbol';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../../constants/Theme';

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
}

interface SignaturePadProps {
  onSignatureChange?: (signature: string | null) => void;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  style?: object;
  containerStyle?: object;
  initialSignature?: string | null;
  readOnly?: boolean;
}

export default function SignaturePad({
  onSignatureChange,
  strokeColor = COLORS.primary.main,
  strokeWidth = 3,
  backgroundColor = '#FFFFFF',
  style,
  containerStyle,
  initialSignature,
  readOnly = false,
}: SignaturePadProps) {
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const containerRef = useRef<View>(null);

  const handleStart = useCallback((event: GestureResponderEvent) => {
    if (readOnly) return;
    const { locationX, locationY } = event.nativeEvent;
    setCurrentLine([{ x: locationX, y: locationY }]);
  }, [readOnly]);

  const handleMove = useCallback((event: GestureResponderEvent) => {
    if (readOnly) return;
    const { locationX, locationY } = event.nativeEvent;
    setCurrentLine(prev => [...prev, { x: locationX, y: locationY }]);
  }, [readOnly]);

  const handleEnd = useCallback(() => {
    if (readOnly || currentLine.length === 0) return;

    const newLines = [...lines, { points: currentLine }];
    setLines(newLines);
    setCurrentLine([]);

    // Generate base64 data for signature
    if (onSignatureChange) {
      const signatureData = JSON.stringify(newLines);
      onSignatureChange(signatureData);
    }
  }, [currentLine, lines, readOnly, onSignatureChange]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !readOnly,
    onMoveShouldSetPanResponder: () => !readOnly,
    onPanResponderGrant: handleStart,
    onPanResponderMove: handleMove,
    onPanResponderRelease: handleEnd,
    onPanResponderTerminate: handleEnd,
  }), [handleStart, handleMove, handleEnd, readOnly]);

  const clearSignature = useCallback(() => {
    setLines([]);
    setCurrentLine([]);
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  const hasSignature = lines.length > 0 || currentLine.length > 0 || !!initialSignature;

  // Render line segments
  const renderLine = (points: Point[], key: string) => {
    if (points.length < 2) return null;

    return points.slice(1).map((point, index) => {
      const prevPoint = points[index];
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return (
        <View
          key={`${key}-${index}`}
          style={[
            styles.lineSegment,
            {
              width: length,
              height: strokeWidth,
              backgroundColor: strokeColor,
              left: prevPoint.x,
              top: prevPoint.y - strokeWidth / 2,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            },
          ]}
        />
      );
    });
  };

  // Render dots at each point for smoother appearance
  const renderDots = (points: Point[], key: string) => {
    return points.map((point, index) => (
      <View
        key={`${key}-dot-${index}`}
        style={[
          styles.dot,
          {
            width: strokeWidth,
            height: strokeWidth,
            borderRadius: strokeWidth / 2,
            backgroundColor: strokeColor,
            left: point.x - strokeWidth / 2,
            top: point.y - strokeWidth / 2,
          },
        ]}
      />
    ));
  };

  // If initialSignature is provided, try to parse and render it
  const parsedInitialLines = useMemo(() => {
    if (!initialSignature) return null;
    try {
      return JSON.parse(initialSignature) as Line[];
    } catch {
      return null;
    }
  }, [initialSignature]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <ThemedText style={styles.label}>Müşteri İmzası</ThemedText>
        {hasSignature && !readOnly && (
          <TouchableOpacity style={styles.clearButton} onPress={clearSignature}>
            <IconSymbol name="eraser" size={18} color={COLORS.error.main} />
            <ThemedText style={styles.clearButtonText}>Temizle</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View
        ref={containerRef}
        style={[
          styles.signatureArea,
          { backgroundColor },
          readOnly && styles.signatureAreaReadOnly,
          style,
        ]}
        {...(readOnly ? {} : panResponder.panHandlers)}
      >
        {/* Render existing lines from initialSignature */}
        {parsedInitialLines && parsedInitialLines.map((line, index) => (
          <React.Fragment key={`initial-${index}`}>
            {renderLine(line.points, `initial-line-${index}`)}
            {renderDots(line.points, `initial-dots-${index}`)}
          </React.Fragment>
        ))}

        {/* Render drawn lines */}
        {lines.map((line, index) => (
          <React.Fragment key={`line-${index}`}>
            {renderLine(line.points, `drawn-line-${index}`)}
            {renderDots(line.points, `drawn-dots-${index}`)}
          </React.Fragment>
        ))}

        {/* Render current line being drawn */}
        {currentLine.length > 0 && (
          <React.Fragment>
            {renderLine(currentLine, 'current-line')}
            {renderDots(currentLine, 'current-dots')}
          </React.Fragment>
        )}

        {!hasSignature && (
          <View style={styles.placeholder}>
            <IconSymbol name="gesture" size={32} color={COLORS.neutral[300]} />
            <ThemedText style={styles.placeholderText}>
              {readOnly ? 'İmza yok' : 'Parmağınızla burada imza atın'}
            </ThemedText>
          </View>
        )}

        {/* Signature line */}
        <View style={styles.signatureLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.secondary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.error.muted,
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  signatureArea: {
    height: 150,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  signatureAreaReadOnly: {
    borderStyle: 'solid',
    borderColor: COLORS.neutral[200],
    backgroundColor: COLORS.light.surfaceSecondary,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.neutral[400],
    textAlign: 'center',
  },
  signatureLine: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: COLORS.neutral[300],
  },
  lineSegment: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
});
