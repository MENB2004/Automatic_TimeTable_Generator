import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius } from '../styles/theme';
import { DAYS, DEFAULT_PERIODS_PER_DAY, calculateWorkingHours } from '../utils/timetableAlgorithm';

const TimetableView = ({ timetable, timeSlots, grade, section }) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'software'

  if (!timetable) return null;

  const numPeriods =
    timetable._periodsPerDay ||
    (timetable.Monday ? timetable.Monday.length : DEFAULT_PERIODS_PER_DAY);

  const stats =
    timetable._stats ||
    calculateWorkingHours(timetable, numPeriods, 45);

  const getSubjectColor = (subject) => {
    if (!subject || subject.includes('Free')) return { bg: 'transparent', text: theme.textMuted };
    if (subject.includes('Lab')) return { bg: theme.timetableLab, text: theme.timetableLabText };

    const index =
      subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      theme.subjectColors.length;
    return { bg: theme.subjectColors[index], text: '#1a1a1a' };
  };

  return (
    <View style={styles.outerContainer}>
      {/* View Mode & Statistics Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <FontAwesome5 name="clock" size={13} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.text }]}>
              Teaching: <Text style={styles.statValue}>{stats.totalClassHours}h/wk</Text>
            </Text>
          </View>
          {stats.hasLab && (
            <View style={[styles.statBadge, { backgroundColor: theme.primary + '15' }]}>
              <FontAwesome5 name="flask" size={13} color={theme.primary} />
              <Text style={[styles.statText, { color: theme.text }]}>
                Lab Working: <Text style={styles.statValue}>{stats.totalLabHours}h/wk</Text>
              </Text>
            </View>
          )}
          <View style={styles.statBadge}>
            <FontAwesome5 name="layer-group" size={13} color={theme.secondary} />
            <Text style={[styles.statText, { color: theme.text }]}>
              Periods: <Text style={styles.statValue}>{numPeriods}/day</Text>
            </Text>
          </View>
        </View>

        {/* View Switcher: Visual Grid vs Software Matrix View */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === 'grid' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setViewMode('grid')}
          >
            <FontAwesome5
              name="th-large"
              size={12}
              color={viewMode === 'grid' ? '#fff' : theme.textSecondary}
            />
            <Text
              style={[
                styles.toggleBtnText,
                { color: viewMode === 'grid' ? '#fff' : theme.textSecondary },
              ]}
            >
              Visual Grid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === 'software' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setViewMode('software')}
          >
            <FontAwesome5
              name="code"
              size={12}
              color={viewMode === 'software' ? '#fff' : theme.textSecondary}
            />
            <Text
              style={[
                styles.toggleBtnText,
                { color: viewMode === 'software' ? '#fff' : theme.textSecondary },
              ]}
            >
              Software View
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visual Grid View */}
      {viewMode === 'grid' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scrollContainer}>
          <View>
            {/* Header Row */}
            <View style={styles.tableRow}>
              <View
                style={[
                  styles.cell,
                  styles.dayCell,
                  { backgroundColor: theme.timetableHeader },
                ]}
              >
                <Text style={[styles.headerText, { color: theme.text }]}>Day</Text>
              </View>
              {(timeSlots && timeSlots.length > 0
                ? timeSlots
                : Array.from({ length: numPeriods }, (_, i) => ({ isBreak: false, period: i + 1, periodIndex: i }))
              ).map((slot, i) => {
                if (slot.isBreak) {
                  return (
                    <View
                      key={`break_h_${i}`}
                      style={[
                        styles.cell,
                        styles.breakCellHeader,
                        { backgroundColor: slot.type.includes('Lunch') ? '#fff3e0' : '#ffe0b2' },
                      ]}
                    >
                      <Text style={[styles.breakHeaderText, { color: '#e65100' }]} numberOfLines={1}>
                        {slot.label}
                      </Text>
                      <Text style={[styles.timeText, { color: '#ef6c00' }]}>
                        {slot.start}-{slot.end}
                      </Text>
                    </View>
                  );
                }

                return (
                  <View
                    key={`p_h_${i}`}
                    style={[styles.cell, { backgroundColor: theme.timetableHeader }]}
                  >
                    <Text style={[styles.headerText, { color: theme.text }]}>P{slot.period || i + 1}</Text>
                    {slot.start && (
                      <Text style={[styles.timeText, { color: theme.textMuted }]}>
                        {slot.start}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Data Rows */}
            {DAYS.map((day) => (
              <View key={day} style={styles.tableRow}>
                <View
                  style={[
                    styles.dayCell,
                    styles.cell,
                    { backgroundColor: theme.timetableHeader },
                  ]}
                >
                  <Text style={[styles.dayText, { color: theme.text }]}>
                    {day.substring(0, 3)}
                  </Text>
                </View>
                {(timeSlots && timeSlots.length > 0
                  ? timeSlots
                  : Array.from({ length: numPeriods }, (_, i) => ({ isBreak: false, periodIndex: i }))
                ).map((slot, colIdx) => {
                  if (slot.isBreak) {
                    const isLunch = slot.type.includes('Lunch');
                    return (
                      <View
                        key={`break_c_${colIdx}`}
                        style={[
                          styles.cell,
                          {
                            backgroundColor: isLunch ? '#fff8e1' : '#fff3e0',
                            borderColor: isLunch ? '#ffe082' : '#ffcc80',
                          },
                        ]}
                      >
                        <Text style={[styles.breakCellText, { color: isLunch ? '#f57f17' : '#e65100' }]}>
                          {isLunch ? '🥪 Lunch' : '☕ Break'}
                        </Text>
                      </View>
                    );
                  }

                  const pIdx = slot.periodIndex;
                  const subject = timetable[day] ? timetable[day][pIdx] : 'Free';
                  const teacher = timetable._teacherMap ? timetable._teacherMap[subject] : null;
                  const color = getSubjectColor(subject);

                  return (
                    <View
                      key={`p_c_${colIdx}`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: color.bg || theme.timetableCell,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.cellText, { color: color.text }]}
                        numberOfLines={2}
                      >
                        {subject || 'Free'}
                      </Text>
                      {teacher && !subject.includes('Free') && (
                        <Text style={styles.cellTeacherText} numberOfLines={1}>
                          👨‍🏫 {teacher}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* Software Supportive Matrix View (Text / Machine Readable) */
        <ScrollView style={[styles.softwareView, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.softwareTitle, { color: theme.primary }]}>
            <FontAwesome5 name="terminal" size={14} color={theme.primary} /> School Software Matrix
          </Text>
          <Text style={[styles.softwareMeta, { color: theme.textMuted }]}>
            Structure: {grade || 'Grade Schedule'} ({section || 'Section'}) | Periods: {numPeriods}/day
          </Text>

          {DAYS.map((day) => (
            <View key={day} style={[styles.softwareRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.softwareDay, { color: theme.secondary }]}>{day}:</Text>
              <View style={styles.softwarePeriodsList}>
                {(timetable[day] || []).slice(0, numPeriods).map((subject, idx) => {
                  const teacher = timetable._teacherMap ? timetable._teacherMap[subject] : null;
                  return (
                    <View key={idx} style={[styles.softwareTag, { backgroundColor: theme.surfaceElevated }]}>
                      <Text style={[styles.softwareTagIndex, { color: theme.primary }]}>P{idx + 1}:</Text>
                      <Text style={[styles.softwareTagValue, { color: theme.text }]} numberOfLines={1}>
                        {subject || 'Free'} {teacher ? `(${teacher})` : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: spacing.base,
  },
  headerBanner: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  statText: {
    fontSize: typography.fontSize.xs,
  },
  statValue: {
    fontWeight: typography.fontWeight.bold,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  toggleBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  scrollContainer: {
    marginTop: spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 82,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 52,
  },
  dayCell: {
    width: 65,
  },
  headerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  breakBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  breakCellHeader: {
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  breakHeaderText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  breakCellText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  cellTeacherText: {
    fontSize: 9,
    color: 'rgba(0,0,0,0.65)',
    marginTop: 2,
    textAlign: 'center',
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  cellText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  softwareView: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.base,
    marginTop: spacing.xs,
    maxHeight: 320,
  },
  softwareTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  softwareMeta: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  softwareRow: {
    borderBottomWidth: 1,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  softwareDay: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  softwarePeriodsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  softwareTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  softwareTagIndex: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  softwareTagValue: {
    fontSize: typography.fontSize.xs,
  },
});

export default TimetableView;
