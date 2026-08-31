import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius } from '../styles/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: expanded ? theme.primary : theme.cardBorder,
        },
      ]}
    >
      <View style={styles.questionRow}>
        <Text style={[styles.question, { color: theme.text }]}>{question}</Text>
        <FontAwesome5
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={theme.primary}
        />
      </View>
      {expanded && (
        <View style={[styles.answerContainer, { borderTopColor: theme.border }]}>
          <Text style={[styles.answer, { color: theme.textSecondary }]}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
  },
  question: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  answerContainer: {
    padding: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  answer: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
});

export default FAQItem;
