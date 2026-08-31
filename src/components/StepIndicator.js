import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius } from '../styles/theme';

const StepIndicator = ({ steps, currentStep }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepWrapper}>
          <View style={styles.stepRow}>
            <View
              style={[
                styles.circle,
                {
                  backgroundColor:
                    index <= currentStep ? theme.primary : theme.surfaceElevated,
                  borderColor:
                    index <= currentStep ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.circleText,
                  {
                    color:
                      index <= currentStep ? '#fff' : theme.textMuted,
                  },
                ]}
              >
                {index < currentStep ? '✓' : index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      index < currentStep ? theme.primary : theme.border,
                  },
                ]}
              />
            )}
          </View>
          <Text
            style={[
              styles.label,
              {
                color:
                  index <= currentStep ? theme.text : theme.textMuted,
                fontWeight:
                  index === currentStep
                    ? typography.fontWeight.bold
                    : typography.fontWeight.regular,
              },
            ]}
            numberOfLines={2}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
  },
  label: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export default StepIndicator;
