import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/theme';

const TimetableCard = ({ semester, classNum, grade, section, createdAt, mondayPreview, stats, onPress, onDelete }) => {
  const { theme } = useTheme();

  const gradeName = grade || (semester ? `Grade ${semester}` : 'Grade Schedule');
  const sectionName = section || (classNum ? `Section ${classNum}` : 'Section A');

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No date';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        shadows.md,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
          <FontAwesome5 name="school" size={20} color={theme.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>
            {gradeName}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {sectionName}
          </Text>
        </View>

        {/* Delete Button */}
        {onDelete && (
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: theme.error + '15' }]}
            onPress={(e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              onDelete();
            }}
          >
            <FontAwesome5 name="trash" size={13} color={theme.error} />
          </TouchableOpacity>
        )}

        {/* Working Hours Badge */}
        {stats && (
          <View style={[styles.hoursBadge, { backgroundColor: theme.surfaceElevated }]}>
            <FontAwesome5 name="clock" size={10} color={theme.primary} />
            <Text style={[styles.hoursText, { color: theme.text }]}>
              {stats.totalClassHours || '30'}h/wk
            </Text>
          </View>
        )}
      </View>

      {/* Monday Preview */}
      {mondayPreview && mondayPreview.length > 0 && (
        <View style={[styles.preview, { borderTopColor: theme.border }]}>
          <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Monday Preview</Text>
          <View style={styles.previewSlots}>
            {mondayPreview.slice(0, 4).map((subject, i) => (
              <View
                key={i}
                style={[styles.previewSlot, { backgroundColor: theme.surfaceElevated }]}
              >
                <Text
                  style={[styles.previewText, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {subject || 'Free'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.date, { color: theme.textMuted }]}>
          <FontAwesome5 name="clock" size={10} color={theme.textMuted} /> {formattedDate}
        </Text>
        <Text style={[styles.viewText, { color: theme.primary }]}>View Schedule →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  hoursText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  preview: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  previewLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewSlots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  previewSlot: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  previewText: {
    fontSize: typography.fontSize.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderTopWidth: 1,
  },
  date: {
    fontSize: typography.fontSize.xs,
  },
  viewText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default TimetableCard;
