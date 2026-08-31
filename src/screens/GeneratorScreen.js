import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { auth, database, ref, set } from '../../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import StepIndicator from '../components/StepIndicator';
import TimetableView from '../components/TimetableView';
import {
  generateTimetable,
  generateTimeSlots,
  exportToCSV,
  detectLabConflicts,
  generatePDFHTML,
  extractTeacherSchedule,
  generateTeacherPDFHTML,
  exportTeacherToCSV,
  DEFAULT_PERIODS_PER_DAY,
} from '../utils/timetableAlgorithm';
import { typography, spacing, borderRadius } from '../styles/theme';

const STEP_LABELS = ['Grades', 'Subjects', 'Teachers', 'Configure', 'Generate'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const GeneratorScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  // Step 1: School Structure & Break Hours Configuration
  const [gradeCount, setGradeCount] = useState('4');
  const [periodsPerDay, setPeriodsPerDay] = useState(String(DEFAULT_PERIODS_PER_DAY));
  const [periodDuration, setPeriodDuration] = useState('45');

  // Break Hours State (2 Tea Breaks + 1 Lunch Break)
  const [tea1After, setTea1After] = useState('2');
  const [tea1Duration, setTea1Duration] = useState('15');
  const [lunchAfter, setLunchAfter] = useState('4');
  const [lunchDuration, setLunchDuration] = useState('30');
  const [tea2After, setTea2After] = useState('6');
  const [tea2Duration, setTea2Duration] = useState('15');

  // Step 2: Master Subject & Lab Banks
  const [masterSubjects, setMasterSubjects] = useState([
    'English',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Computer Science',
    'Physical Education',
  ]);
  const [newMasterSubject, setNewMasterSubject] = useState('');
  const [masterLabs, setMasterLabs] = useState([
    'Computer Lab',
    'Physics Lab',
    'Chemistry Lab',
    'Biology Lab',
    'Language Lab',
    'Robotics Lab',
  ]);
  const [newMasterLab, setNewMasterLab] = useState('');
  const [gradeSubjectCount, setGradeSubjectCount] = useState({}); // { 1: "5", 2: "5" }
  const [gradeSubjects, setGradeSubjects] = useState({});
  const [gradeSelectedLabs, setGradeSelectedLabs] = useState({}); // { 1: ['Computer Lab', 'Physics Lab'] }
  const [gradeLabStatus, setGradeLabStatus] = useState({});

  // Step 3: Master Teacher Bank
  const [teacherCountInput, setTeacherCountInput] = useState('5');
  const [teachers, setTeachers] = useState([
    'Mr. Alan Smith',
    'Ms. Sarah Johnson',
    'Dr. Robert Brown',
    'Mrs. Emily Davis',
    'Mr. Michael Wilson',
  ]);

  // Step 4: Config per Grade-Section
  const [activeGrade, setActiveGrade] = useState(1);
  const [gradeConfigs, setGradeConfigs] = useState({});
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('15:30');
  const [enforceLowFreq, setEnforceLowFreq] = useState(true);
  const [enforceMaxPeriods, setEnforceMaxPeriods] = useState(true);

  // Step 5: Generated timetables & Teacher Exports
  const [generatedTimetables, setGeneratedTimetables] = useState({});
  const [selectedTeacherForExport, setSelectedTeacherForExport] = useState('');
  const [saving, setSaving] = useState(false);

  // --- Step 1: Grades & Period Count Configuration ---
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>School Timetable Setup</Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Define your school structure: number of Grades/Standards and daily periods.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Number of Grades / Standards</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="e.g. 4 (Grades 9-12)"
          placeholderTextColor={theme.textMuted}
          value={gradeCount}
          onChangeText={setGradeCount}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Periods Per Day (Configurable)</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="e.g. 8 periods"
          placeholderTextColor={theme.textMuted}
          value={periodsPerDay}
          onChangeText={setPeriodsPerDay}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Period Duration (Minutes)</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="e.g. 45 mins"
          placeholderTextColor={theme.textMuted}
          value={periodDuration}
          onChangeText={setPeriodDuration}
          keyboardType="number-pad"
        />
      </View>

      {/* Break Hours Configuration Card (2 Tea Breaks + 1 Lunch Break) */}
      <View style={[styles.breakCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.breakCardTitle, { color: theme.text }]}>
          <FontAwesome5 name="mug-hot" size={14} color={theme.primary} /> Break Hours Setup (2 Tea + 1 Lunch Break)
        </Text>

        {/* Morning Tea Break */}
        <View style={styles.breakRow}>
          <View style={{ flex: 2 }}>
            <Text style={[styles.breakLabel, { color: theme.text }]}>1. Morning Tea Break</Text>
            <Text style={[styles.breakSub, { color: theme.textMuted }]}>Duration (Mins)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, marginTop: 4 }]}
              placeholder="15 mins"
              placeholderTextColor={theme.textMuted}
              value={tea1Duration}
              onChangeText={setTea1Duration}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={[styles.breakLabel, { color: theme.text }]}>After Period</Text>
            <Text style={[styles.breakSub, { color: theme.textMuted }]}>Period #</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, marginTop: 4 }]}
              placeholder="e.g. 2"
              placeholderTextColor={theme.textMuted}
              value={tea1After}
              onChangeText={setTea1After}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Lunch Break */}
        <View style={styles.breakRow}>
          <View style={{ flex: 2 }}>
            <Text style={[styles.breakLabel, { color: theme.text }]}>2. Lunch Break</Text>
            <Text style={[styles.breakSub, { color: theme.textMuted }]}>Duration (Mins)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, marginTop: 4 }]}
              placeholder="30 mins"
              placeholderTextColor={theme.textMuted}
              value={lunchDuration}
              onChangeText={setLunchDuration}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={[styles.breakLabel, { color: theme.text }]}>After Period</Text>
            <Text style={[styles.breakSub, { color: theme.textMuted }]}>Period #</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, marginTop: 4 }]}
              placeholder="e.g. 4"
              placeholderTextColor={theme.textMuted}
              value={lunchAfter}
              onChangeText={setLunchAfter}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Afternoon Tea Break */}
        <View style={styles.breakRow}>
          <View style={{ flex: 2 }}>
            <Text style={[styles.breakLabel, { color: theme.text }]}>3. Afternoon Tea Break</Text>
            <Text style={[styles.breakSub, { color: theme.textMuted }]}>Duration (Mins)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, marginTop: 4 }]}
              placeholder="15 mins"
              placeholderTextColor={theme.textMuted}
              value={tea2Duration}
              onChangeText={setTea2Duration}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={[styles.breakLabel, { color: theme.text }]}>After Period</Text>
            <Text style={[styles.breakSub, { color: theme.textMuted }]}>Period #</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, marginTop: 4 }]}
              placeholder="e.g. 6"
              placeholderTextColor={theme.textMuted}
              value={tea2After}
              onChangeText={setTea2After}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: theme.primary }]}
        onPress={() => {
          const count = parseInt(gradeCount);
          const periods = parseInt(periodsPerDay);
          if (!count || count < 1 || count > 12) {
            Alert.alert('Invalid', 'Please enter a valid number of grades (1-12)');
            return;
          }
          if (!periods || periods < 4 || periods > 12) {
            Alert.alert('Invalid', 'Please enter periods per day between 4 and 12');
            return;
          }

          const subs = {};
          for (let i = 1; i <= count; i++) {
            subs[i] = gradeSubjects[i] || 'English, Mathematics, Science, Social Studies, Computer';
          }
          setGradeSubjects(subs);
          setStep(1);
        }}
      >
        <Text style={styles.nextBtnText}>Proceed to Subjects →</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Step 2: Subjects per Grade ---
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Master Subjects & Grade Allocation</Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Add master school subjects and select subjects for each Grade according to your input count.
      </Text>

      {/* Master Subject Bank Card */}
      <View style={[styles.masterPoolCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.masterPoolTitle, { color: theme.primary }]}>
          <FontAwesome5 name="book" size={14} color={theme.primary} /> Master School Subject Bank ({masterSubjects.length})
        </Text>
        <View style={styles.masterPoolChips}>
          {masterSubjects.map((sub, i) => (
            <View key={i} style={[styles.masterChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.masterChipText, { color: theme.text }]}>{sub}</Text>
              <TouchableOpacity
                onPress={() => setMasterSubjects(masterSubjects.filter((_, idx) => idx !== i))}
                style={{ marginLeft: 6 }}
              >
                <FontAwesome5 name="times" size={10} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.addMasterRow}>
          <TextInput
            style={[styles.textInput, { flex: 1, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="Add new subject (e.g. Economics)"
            placeholderTextColor={theme.textMuted}
            value={newMasterSubject}
            onChangeText={setNewMasterSubject}
          />
          <TouchableOpacity
            style={[styles.addMasterBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              if (newMasterSubject.trim() && !masterSubjects.includes(newMasterSubject.trim())) {
                setMasterSubjects([...masterSubjects, newMasterSubject.trim()]);
                setNewMasterSubject('');
              }
            }}
          >
            <FontAwesome5 name="plus" size={12} color="#fff" />
            <Text style={styles.addMasterBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Master Practical Labs Bank Card */}
      <View style={[styles.masterPoolCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.masterPoolTitle, { color: theme.secondary }]}>
          <FontAwesome5 name="flask" size={14} color={theme.secondary} /> Master School Practical Labs Bank ({masterLabs.length})
        </Text>
        <View style={styles.masterPoolChips}>
          {masterLabs.map((lab, i) => (
            <View key={i} style={[styles.masterChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.masterChipText, { color: theme.text }]}>{lab}</Text>
              <TouchableOpacity
                onPress={() => setMasterLabs(masterLabs.filter((_, idx) => idx !== i))}
                style={{ marginLeft: 6 }}
              >
                <FontAwesome5 name="times" size={10} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.addMasterRow}>
          <TextInput
            style={[styles.textInput, { flex: 1, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="Add new lab (e.g. Science Lab)"
            placeholderTextColor={theme.textMuted}
            value={newMasterLab}
            onChangeText={setNewMasterLab}
          />
          <TouchableOpacity
            style={[styles.addMasterBtn, { backgroundColor: theme.secondary }]}
            onPress={() => {
              if (newMasterLab.trim() && !masterLabs.includes(newMasterLab.trim())) {
                setMasterLabs([...masterLabs, newMasterLab.trim()]);
                setNewMasterLab('');
              }
            }}
          >
            <FontAwesome5 name="plus" size={12} color="#fff" />
            <Text style={styles.addMasterBtnText}>Add Lab</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Per-Grade Subject & Lab Selector by Input Number */}
      {Object.keys(gradeSubjects).map((gradeKey) => {
        const isLabPresent = gradeLabStatus[gradeKey] !== false;
        const currentSelected = (gradeSubjects[gradeKey] || '').split(',').map((s) => s.trim()).filter(Boolean);
        const targetCount = parseInt(gradeSubjectCount[gradeKey]) || currentSelected.length || 5;

        const toggleSubjectSelection = (subName) => {
          let updated;
          if (currentSelected.includes(subName)) {
            updated = currentSelected.filter((s) => s !== subName);
          } else {
            if (currentSelected.length >= targetCount) {
              Alert.alert('Limit Reached', `Grade ${gradeKey} is configured for ${targetCount} subjects. Change the input number to select more.`);
              return;
            }
            updated = [...currentSelected, subName];
          }
          setGradeSubjects((prev) => ({ ...prev, [gradeKey]: updated.join(', ') }));
        };

        return (
          <View key={gradeKey} style={[styles.inputGroup, styles.gradeSubjectCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.gradeHeaderRow}>
              <Text style={[styles.label, { color: theme.primary, fontWeight: typography.fontWeight.bold, flex: 1 }]}>
                Grade / Standard {gradeKey}
              </Text>

              {/* Number of Subjects Input */}
              <View style={styles.countInputWrapper}>
                <Text style={[styles.countInputLabel, { color: theme.textMuted }]}>No. of Subjects:</Text>
                <TextInput
                  style={[styles.countInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                  value={gradeSubjectCount[gradeKey] !== undefined ? String(gradeSubjectCount[gradeKey]) : String(targetCount)}
                  onChangeText={(val) => setGradeSubjectCount((prev) => ({ ...prev, [gradeKey]: val }))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text style={[styles.selectChipHelp, { color: theme.textSecondary }]}>
              Select {targetCount} subjects from master bank ({currentSelected.length}/{targetCount} selected):
            </Text>

            {/* Selectable Subject Chips */}
            <View style={styles.selectorChipsRow}>
              {masterSubjects.map((subName) => {
                const isSelected = currentSelected.includes(subName);
                return (
                  <TouchableOpacity
                    key={subName}
                    style={[
                      styles.selectorChip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceElevated,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => toggleSubjectSelection(subName)}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#fff' : theme.textSecondary,
                        fontSize: typography.fontSize.xs,
                        fontWeight: isSelected ? typography.fontWeight.bold : typography.fontWeight.medium,
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{subName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Subjects Text Preview / Manual Edit */}
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, marginTop: spacing.sm }]}
              placeholder="Selected subjects string..."
              placeholderTextColor={theme.textMuted}
              value={gradeSubjects[gradeKey]}
              onChangeText={(v) => setGradeSubjects((prev) => ({ ...prev, [gradeKey]: v }))}
            />

            {/* Lab Status (Present / Absent) Toggle */}
            <View style={styles.labToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.labToggleLabel, { color: theme.text }]}>
                  Practical Lab Status: <Text style={{ color: isLabPresent ? theme.success : theme.error, fontWeight: typography.fontWeight.bold }}>{isLabPresent ? 'PRESENT' : 'ABSENT'}</Text>
                </Text>
                <Text style={[styles.labToggleDesc, { color: theme.textMuted }]}>
                  {isLabPresent ? 'Includes practical science/computer lab sessions' : 'Theory only schedule (No lab working hours)'}
                </Text>
              </View>
              <Switch
                value={isLabPresent}
                onValueChange={(val) => setGradeLabStatus((prev) => ({ ...prev, [gradeKey]: val }))}
                trackColor={{ false: theme.border, true: theme.success + '60' }}
                thumbColor={isLabPresent ? theme.success : theme.textMuted}
              />
            </View>

            {/* Practical Labs Allocation for Grade */}
            {isLabPresent && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[styles.selectChipHelp, { color: theme.textSecondary }]}>
                  Select Practical Labs from master bank for Grade {gradeKey}:
                </Text>
                <View style={styles.selectorChipsRow}>
                  {masterLabs.map((labName) => {
                    const selectedForGrade = gradeSelectedLabs[gradeKey] || [];
                    const isSelected = selectedForGrade.includes(labName);
                    const toggleLabSelection = () => {
                      const updated = isSelected
                        ? selectedForGrade.filter((l) => l !== labName)
                        : [...selectedForGrade, labName];
                      setGradeSelectedLabs((prev) => ({ ...prev, [gradeKey]: updated }));
                    };

                    return (
                      <TouchableOpacity
                        key={labName}
                        style={[
                          styles.selectorChip,
                          {
                            backgroundColor: isSelected ? theme.secondary : theme.surfaceElevated,
                            borderColor: isSelected ? theme.secondary : theme.border,
                          },
                        ]}
                        onPress={toggleLabSelection}
                      >
                        <Text
                          style={{
                            color: isSelected ? '#fff' : theme.textSecondary,
                            fontSize: typography.fontSize.xs,
                            fontWeight: isSelected ? typography.fontWeight.bold : typography.fontWeight.medium,
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '}{labName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.navRow}>
        <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => setStep(0)}>
          <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.primary }]}
          onPress={() => {
            const allFilled = Object.values(gradeSubjects).every(
              (v) => v.split(',').filter((s) => s.trim()).length > 0
            );
            if (!allFilled) {
              Alert.alert('Missing Subjects', 'Please select or enter subjects for all grades');
              return;
            }
            setStep(2);
          }}
        >
          <Text style={styles.nextBtnText}>Proceed to Teachers →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Step 3: Teachers ---
  const renderStep3 = () => {
    const handleTeacherCountChange = (val) => {
      setTeacherCountInput(val);
      const count = parseInt(val);
      if (count && count > 0 && count <= 25) {
        if (count > teachers.length) {
          const added = Array.from({ length: count - teachers.length }, (_, i) => `Teacher ${teachers.length + i + 1}`);
          setTeachers([...teachers, ...added]);
        } else if (count < teachers.length) {
          setTeachers(teachers.slice(0, count));
        }
      }
    };

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>Master Teachers Bank</Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          Specify the total number of teachers or manage individual faculty members.
        </Text>

        {/* Number of Teachers Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Number of Master Teachers</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="e.g. 5"
            placeholderTextColor={theme.textMuted}
            value={teacherCountInput}
            onChangeText={handleTeacherCountChange}
            keyboardType="number-pad"
          />
        </View>

        <Text style={[styles.label, { color: theme.textSecondary, marginBottom: spacing.xs }]}>
          Teacher Roster ({teachers.length} active)
        </Text>

        {teachers.map((t, i) => (
          <View key={i} style={styles.teacherRow}>
            <TextInput
              style={[styles.textInput, { flex: 1, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder={`Teacher ${i + 1} (e.g. Mr. Smith)`}
              placeholderTextColor={theme.textMuted}
              value={t}
              onChangeText={(v) => {
                const updated = [...teachers];
                updated[i] = v;
                setTeachers(updated);
              }}
            />
            {teachers.length > 1 && (
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: theme.error + '20' }]}
                onPress={() => {
                  const updated = teachers.filter((_, idx) => idx !== i);
                  setTeachers(updated);
                  setTeacherCountInput(String(updated.length));
                }}
              >
                <FontAwesome5 name="times" size={14} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addTeacherBtn, { borderColor: theme.primary }]}
          onPress={() => {
            const updated = [...teachers, `Teacher ${teachers.length + 1}`];
            setTeachers(updated);
            setTeacherCountInput(String(updated.length));
          }}
        >
          <FontAwesome5 name="plus" size={12} color={theme.primary} />
          <Text style={[styles.addTeacherText, { color: theme.primary }]}>Add Teacher</Text>
        </TouchableOpacity>

        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => setStep(1)}>
            <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              const validTeachers = teachers.filter((t) => t.trim());
              if (validTeachers.length === 0) {
                Alert.alert('Missing Teachers', 'Please enter at least one teacher name');
                return;
              }
              setTeachers(validTeachers);

              const count = parseInt(gradeCount);
              const configs = {};
              for (let g = 1; g <= count; g++) {
                configs[g] = gradeConfigs[g] || {
                  gradeName: `Grade ${g}`,
                  sections: 'Section A, Section B',
                  sectionConfigs: {},
                };
              }
              setGradeConfigs(configs);
              setActiveGrade(1);
              setStep(3);
            }}
          >
            <Text style={styles.nextBtnText}>Configure Sections →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- Step 4: Grade & Section Configuration ---
  const renderStep4 = () => {
    const count = parseInt(gradeCount);
    const config = gradeConfigs[activeGrade] || {};
    const subjects = (gradeSubjects[activeGrade] || '').split(',').map((s) => s.trim()).filter((s) => s);
    const sections = (config.sections || '').split(',').map((s) => s.trim()).filter((s) => s);

    const updateConfig = (field, value) => {
      setGradeConfigs((prev) => ({
        ...prev,
        [activeGrade]: { ...prev[activeGrade], [field]: value },
      }));
    };

    const updateSectionConfig = (secIdx, field, value) => {
      setGradeConfigs((prev) => {
        const gConfig = prev[activeGrade] || {};
        const sectionConfigs = gConfig.sectionConfigs || {};
        const sc = sectionConfigs[secIdx] || {};
        return {
          ...prev,
          [activeGrade]: {
            ...gConfig,
            sectionConfigs: {
              ...sectionConfigs,
              [secIdx]: { ...sc, [field]: value },
            },
          },
        };
      });
    };

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>Sections & Lab Hours Setup</Text>

        {/* Common School Hours */}
        <View style={[styles.timeRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.timeInput}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>School Start Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="08:30"
              placeholderTextColor={theme.textMuted}
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View style={styles.timeInput}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>School End Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="15:30"
              placeholderTextColor={theme.textMuted}
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>

        {/* Grade Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semTabs}>
          {Array.from({ length: count }, (_, i) => i + 1).map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.semTab,
                {
                  backgroundColor: g === activeGrade ? theme.primary : theme.surfaceElevated,
                  borderColor: g === activeGrade ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setActiveGrade(g)}
            >
              <Text
                style={[
                  styles.semTabText,
                  { color: g === activeGrade ? '#fff' : theme.textSecondary },
                ]}
              >
                Grade {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Grade Title</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={config.gradeName || ''}
            onChangeText={(v) => updateConfig('gradeName', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Sections (comma-separated)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="Section A, Section B, Section C"
            placeholderTextColor={theme.textMuted}
            value={config.sections || ''}
            onChangeText={(v) => updateConfig('sections', v)}
          />
        </View>

        {/* Per-section Configuration */}
        {sections.map((sectionName, secIdx) => {
          const sc = (config.sectionConfigs || {})[secIdx] || {};
          return (
            <View key={secIdx} style={[styles.classCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.classTitle, { color: theme.primary }]}>{sectionName}</Text>
              <Text style={[styles.subjectsList, { color: theme.textSecondary }]}>
                Subjects: {subjects.join(', ')}
              </Text>

              {/* Separately Selectable Class Frequencies per Subject */}
              <Text style={[styles.label, { color: theme.textSecondary, marginBottom: spacing.xs }]}>
                Classes per Week for Each Subject (Separately Selectable)
              </Text>
              {subjects.map((sub, subIdx) => {
                const currentFreq = sc.subjectFrequencies && sc.subjectFrequencies[sub] !== undefined
                  ? String(sc.subjectFrequencies[sub])
                  : (sc.frequencies ? sc.frequencies.split(',')[subIdx]?.trim() || '5' : '5');

                const setFreqForSub = (val) => {
                  const newFreqs = { ...(sc.subjectFrequencies || {}), [sub]: val };
                  updateSectionConfig(secIdx, 'subjectFrequencies', newFreqs);
                };

                return (
                  <View key={subIdx} style={styles.freqSubjectRow}>
                    <Text style={[styles.freqSubjectName, { color: theme.text }]} numberOfLines={1}>
                      {sub}
                    </Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                        onPress={() => {
                          const num = Math.max(1, (parseInt(currentFreq) || 5) - 1);
                          setFreqForSub(String(num));
                        }}
                      >
                        <Text style={[styles.stepperBtnText, { color: theme.text }]}>-</Text>
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.freqInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                        value={String(currentFreq)}
                        onChangeText={(v) => setFreqForSub(v)}
                        keyboardType="number-pad"
                      />

                      <TouchableOpacity
                        style={[styles.stepperBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                        onPress={() => {
                          const num = Math.min(15, (parseInt(currentFreq) || 5) + 1);
                          setFreqForSub(String(num));
                        }}
                      >
                        <Text style={[styles.stepperBtnText, { color: theme.text }]}>+</Text>
                      </TouchableOpacity>
                      <Text style={[styles.freqUnitLabel, { color: theme.textMuted }]}>classes/wk</Text>
                    </View>
                  </View>
                );
              })}

              {/* Teacher Assignment */}
              <Text style={[styles.label, { color: theme.textSecondary, marginTop: spacing.sm, marginBottom: spacing.sm }]}>
                Teacher Assignments
              </Text>
              {subjects.map((sub, subIdx) => (
                <View key={subIdx} style={styles.facultyAssignment}>
                  <Text style={[styles.subjectLabel, { color: theme.text }]} numberOfLines={1}>
                    {sub}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facultyChips}>
                    {teachers.map((t, tIdx) => {
                      const assignments = sc.teacherAssignments || {};
                      const isSelected = assignments[subIdx] === tIdx;
                      return (
                        <TouchableOpacity
                          key={tIdx}
                          style={[
                            styles.facultyChip,
                            {
                              backgroundColor: isSelected ? theme.primary : theme.surfaceElevated,
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                          onPress={() => {
                            const newAssignments = { ...(sc.teacherAssignments || {}), [subIdx]: tIdx };
                            updateSectionConfig(secIdx, 'teacherAssignments', newAssignments);
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? '#fff' : theme.textSecondary,
                              fontSize: typography.fontSize.xs,
                            }}
                            numberOfLines={1}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}

              {/* Practical / Science Labs Configuration (Dynamic Multi-Lab Setup) */}
              {(() => {
                const sectionHasLab = sc.hasLab !== undefined ? sc.hasLab : (gradeLabStatus[activeGrade] !== false);
                const selectedLabsForGrade = gradeSelectedLabs[activeGrade] || [];
                const defaultLabs = selectedLabsForGrade.length > 0
                  ? selectedLabsForGrade.map((lName, idx) => ({
                      id: String(idx + 1),
                      name: lName,
                      teacherIdx: idx % teachers.length,
                      hours: '3',
                      day: WEEKDAYS[idx % WEEKDAYS.length],
                      time: idx % 2 === 0 ? 'before' : 'after',
                    }))
                  : [
                      { id: '1', name: sc.lab1Name || 'Computer Lab', teacherIdx: 0, hours: sc.lab1Hours || '3', day: sc.lab1Day || 'Monday', time: sc.lab1Time || 'before' },
                      { id: '2', name: sc.lab2Name || 'Physics Lab', teacherIdx: 1, hours: sc.lab2Hours || '3', day: sc.lab2Day || 'Wednesday', time: sc.lab2Time || 'after' },
                    ];
                const labsList = sc.labs || defaultLabs;

                const updateLabsList = (newLabs) => {
                  updateSectionConfig(secIdx, 'labs', newLabs);
                };

                const updateLabItem = (labIndex, field, value) => {
                  const updated = [...labsList];
                  updated[labIndex] = { ...updated[labIndex], [field]: value };
                  updateLabsList(updated);
                };

                const addLabItem = () => {
                  const newLab = {
                    id: String(Date.now()),
                    name: masterLabs[labsList.length % masterLabs.length] || `Lab ${labsList.length + 1}`,
                    teacherIdx: 0,
                    hours: '3',
                    day: 'Tuesday',
                    time: 'before',
                  };
                  updateLabsList([...labsList, newLab]);
                };

                const removeLabItem = (labIndex) => {
                  const updated = labsList.filter((_, idx) => idx !== labIndex);
                  updateLabsList(updated);
                };

                return (
                  <View style={[styles.labSection, { borderTopColor: theme.border }]}>
                    <View style={styles.labSectionHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.labTitle, { color: theme.text }]}>
                          <FontAwesome5 name="flask" size={14} color={sectionHasLab ? theme.primary : theme.textMuted} /> Practical Lab Sessions ({labsList.length})
                        </Text>
                        <Text style={[styles.labToggleDesc, { color: theme.textMuted }]}>
                          Status: <Text style={{ color: sectionHasLab ? theme.success : theme.error, fontWeight: typography.fontWeight.bold }}>{sectionHasLab ? 'PRESENT (Lab Required)' : 'ABSENT (Theory Only)'}</Text>
                        </Text>
                      </View>
                      <Switch
                        value={sectionHasLab}
                        onValueChange={(val) => updateSectionConfig(secIdx, 'hasLab', val)}
                        trackColor={{ false: theme.border, true: theme.success + '60' }}
                        thumbColor={sectionHasLab ? theme.success : theme.textMuted}
                      />
                    </View>

                    {sectionHasLab ? (
                      <>
                        {labsList.map((lab, labIdx) => (
                          <View key={lab.id || labIdx} style={[styles.labCardItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                            <View style={styles.labCardHeader}>
                              <Text style={[styles.labCardTitle, { color: theme.primary }]}>
                                Lab #{labIdx + 1}: {lab.name}
                              </Text>
                              {labsList.length > 1 && (
                                <TouchableOpacity onPress={() => removeLabItem(labIdx)}>
                                  <FontAwesome5 name="trash" size={12} color={theme.error} />
                                </TouchableOpacity>
                              )}
                            </View>

                            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 4 }]}>Select from Saved Master Labs:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facultyChips}>
                              {masterLabs.map((savedLab) => {
                                const isSelected = lab.name === savedLab;
                                return (
                                  <TouchableOpacity
                                    key={savedLab}
                                    style={[
                                      styles.facultyChip,
                                      {
                                        backgroundColor: isSelected ? theme.secondary : theme.card,
                                        borderColor: isSelected ? theme.secondary : theme.border,
                                      },
                                    ]}
                                    onPress={() => updateLabItem(labIdx, 'name', savedLab)}
                                  >
                                    <Text style={{ color: isSelected ? '#fff' : theme.textSecondary, fontSize: typography.fontSize.xs, fontWeight: isSelected ? 'bold' : 'normal' }}>
                                      {isSelected ? '✓ ' : ''}{savedLab}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>

                            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 4 }]}>Lab Name (or edit custom name)</Text>
                            <TextInput
                              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                              placeholder="e.g. Chemistry Lab"
                              placeholderTextColor={theme.textMuted}
                              value={lab.name}
                              onChangeText={(v) => updateLabItem(labIdx, 'name', v)}
                            />

                            <Text style={[styles.label, { color: theme.textSecondary, marginTop: spacing.xs }]}>Assigned Lab Instructor</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facultyChips}>
                              {teachers.map((t, tIdx) => {
                                const isSelected = lab.teacherIdx === tIdx;
                                return (
                                  <TouchableOpacity
                                    key={tIdx}
                                    style={[
                                      styles.facultyChip,
                                      {
                                        backgroundColor: isSelected ? theme.primary : theme.card,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                      },
                                    ]}
                                    onPress={() => updateLabItem(labIdx, 'teacherIdx', tIdx)}
                                  >
                                    <Text style={{ color: isSelected ? '#fff' : theme.textSecondary, fontSize: typography.fontSize.xs }}>
                                      {t}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>

                            <Text style={[styles.label, { color: theme.textSecondary, marginTop: spacing.xs }]}>Weekly Lab Hours / Periods</Text>
                            <TextInput
                              style={[styles.textInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                              placeholder="e.g. 3"
                              placeholderTextColor={theme.textMuted}
                              value={String(lab.hours || '3')}
                              onChangeText={(v) => updateLabItem(labIdx, 'hours', v)}
                              keyboardType="number-pad"
                            />

                            <Text style={[styles.label, { color: theme.textSecondary, marginTop: spacing.xs }]}>Scheduled Day</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayChips}>
                              {WEEKDAYS.map((day) => (
                                <TouchableOpacity
                                  key={day}
                                  style={[
                                    styles.dayChip,
                                    {
                                      backgroundColor: lab.day === day ? theme.primary : theme.card,
                                      borderColor: lab.day === day ? theme.primary : theme.border,
                                    },
                                  ]}
                                  onPress={() => updateLabItem(labIdx, 'day', day)}
                                >
                                  <Text style={{ color: lab.day === day ? '#fff' : theme.textSecondary, fontSize: typography.fontSize.sm }}>
                                    {day.substring(0, 3)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>

                            <View style={styles.labTimeRow}>
                              {['before', 'after'].map((time) => (
                                <TouchableOpacity
                                  key={time}
                                  style={[
                                    styles.labTimeBtn,
                                    {
                                      backgroundColor: lab.time === time ? theme.primary : theme.card,
                                      borderColor: lab.time === time ? theme.primary : theme.border,
                                    },
                                  ]}
                                  onPress={() => updateLabItem(labIdx, 'time', time)}
                                >
                                  <Text style={{ color: lab.time === time ? '#fff' : theme.textSecondary, fontSize: typography.fontSize.sm }}>
                                    {time === 'before' ? 'Before Lunch' : 'After Lunch'}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        ))}

                        <TouchableOpacity style={[styles.addLabBtn, { borderColor: theme.primary }]} onPress={addLabItem}>
                          <FontAwesome5 name="plus" size={12} color={theme.primary} />
                          <Text style={[styles.addLabBtnText, { color: theme.primary }]}>Add Another Practical Lab</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={[styles.labAbsentBanner, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                        <FontAwesome5 name="info-circle" size={14} color={theme.textMuted} />
                        <Text style={[styles.labAbsentText, { color: theme.textSecondary }]}>
                          Lab is marked as ABSENT. Regular theory class periods will be generated without dedicated practical lab blocks.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          );
        })}

        {/* Constraints */}
        <View style={[styles.constraintCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.constraintTitle, { color: theme.text }]}>School Scheduling Rules</Text>
          <View style={styles.constraintRow}>
            <View style={styles.constraintInfo}>
              <Text style={[styles.constraintLabel, { color: theme.text }]}>
                Prevent low frequency subjects on Lab days
              </Text>
              <Text style={[styles.constraintDesc, { color: theme.textMuted }]}>
                Ensures balanced academic workload on practical lab days
              </Text>
            </View>
            <Switch
              value={enforceLowFreq}
              onValueChange={setEnforceLowFreq}
              trackColor={{ false: theme.border, true: theme.primary + '60' }}
              thumbColor={enforceLowFreq ? theme.primary : theme.textMuted}
            />
          </View>
          <View style={styles.constraintRow}>
            <View style={styles.constraintInfo}>
              <Text style={[styles.constraintLabel, { color: theme.text }]}>
                Limit subject to max 2 periods per day
              </Text>
              <Text style={[styles.constraintDesc, { color: theme.textMuted }]}>
                Prevents subject repetition fatigue for students
              </Text>
            </View>
            <Switch
              value={enforceMaxPeriods}
              onValueChange={setEnforceMaxPeriods}
              trackColor={{ false: theme.border, true: theme.primary + '60' }}
              thumbColor={enforceMaxPeriods ? theme.primary : theme.textMuted}
            />
          </View>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => setStep(2)}>
            <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: theme.primary }]}
            onPress={handleGenerate}
          >
            <Text style={styles.nextBtnText}>Generate School Schedule →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleGenerate = () => {
    const count = parseInt(gradeCount);
    const periodsNum = parseInt(periodsPerDay) || DEFAULT_PERIODS_PER_DAY;
    const durMins = parseInt(periodDuration) || 45;
    const results = {};

    for (let g = 1; g <= count; g++) {
      const config = gradeConfigs[g] || {};
      const subjects = (gradeSubjects[g] || '').split(',').map((sub) => sub.trim()).filter((sub) => sub);
      const sections = (config.sections || '').split(',').map((sec) => sec.trim()).filter((sec) => sec);

      if (sections.length === 0) continue;

      sections.forEach((sectionName, secIdx) => {
        const sc = (config.sectionConfigs || {})[secIdx] || {};

        const subjectFreqs = sc.subjectFrequencies || {};
        const frequencies = subjects.map((sub, sIdx) => {
          if (subjectFreqs[sub] !== undefined && subjectFreqs[sub] !== '') {
            return parseInt(subjectFreqs[sub]) || 5;
          }
          if (sc.frequencies) {
            const parsed = sc.frequencies.split(',').map((f) => parseInt(f.trim())).filter((f) => !isNaN(f));
            if (parsed[sIdx] !== undefined) return parsed[sIdx];
          }
          return 5;
        });

        const isLabPresent = sc.hasLab !== undefined ? sc.hasLab : (gradeLabStatus[g] !== false);

        const teacherAssignments = subjects.map((_, subIdx) => {
          const tIdx = (sc.teacherAssignments || {})[subIdx];
          return tIdx !== undefined ? teachers[tIdx] : teachers[0] || 'Unassigned Teacher';
        });

        const configuredLabs = (sc.labs || [
          { name: sc.lab1Name || 'Computer Lab', teacherIdx: 0, day: sc.lab1Day || 'Monday', time: sc.lab1Time || 'before', hours: parseInt(sc.lab1Hours) || 3 },
          { name: sc.lab2Name || 'Physics Lab', teacherIdx: 1, day: sc.lab2Day || 'Wednesday', time: sc.lab2Time || 'after', hours: parseInt(sc.lab2Hours) || 3 },
        ]).map((l) => ({
          name: l.name || 'Practical Lab',
          teacher: teachers[l.teacherIdx] || teachers[0] || 'Lab Instructor',
          day: l.day || 'Monday',
          time: l.time || 'before',
          hours: parseInt(l.hours) || 3,
        }));

        const timetable = generateTimetable({
          subjects,
          frequencies,
          facultyAssignments: teacherAssignments,
          hasLab: isLabPresent,
          labs: configuredLabs,
          lab1Name: sc.lab1Name || '',
          lab1Day: sc.lab1Day || '',
          lab1Time: sc.lab1Time || 'before',
          lab1Hours: parseInt(sc.lab1Hours) || 3,
          lab2Name: sc.lab2Name || '',
          lab2Day: sc.lab2Day || '',
          lab2Time: sc.lab2Time || 'after',
          lab2Hours: parseInt(sc.lab2Hours) || 3,
          periodsPerDay: periodsNum,
          periodDurationMins: durMins,
          enforceLowFreqConstraint: enforceLowFreq,
          enforceMaxPeriodsConstraint: enforceMaxPeriods,
        });

        results[`grade${g}_sec${secIdx}`] = {
          grade: config.gradeName || `Grade ${g}`,
          section: sectionName,
          gradeNumber: g,
          hasLab: isLabPresent,
          timetable,
        };
      });
    }

    setGeneratedTimetables(results);
    setStep(4);
  };

  // --- Step 5: Results & Multi-Format Software Export ---
  const renderStep5 = () => {
    const periodsNum = parseInt(periodsPerDay) || DEFAULT_PERIODS_PER_DAY;
    const durMins = parseInt(periodDuration) || 45;

    const breakConfig = {
      tea1AfterPeriod: parseInt(tea1After) || 2,
      tea1DurationMins: parseInt(tea1Duration) || 15,
      lunchAfterPeriod: parseInt(lunchAfter) || Math.floor(periodsNum / 2),
      lunchDurationMins: parseInt(lunchDuration) || 30,
      tea2AfterPeriod: parseInt(tea2After) || 6,
      tea2DurationMins: parseInt(tea2Duration) || 15,
    };

    const timeSlots = generateTimeSlots(startTime, periodsNum, durMins, breakConfig);
    const keys = Object.keys(generatedTimetables);
    const labConflicts = detectLabConflicts(generatedTimetables);

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>Generated Timetables</Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          {keys.length} school schedule(s) created with {periodsNum} periods/day (2 Tea Breaks + 1 Lunch Break compiled).
        </Text>

        {/* Lab Conflict Warning Banner */}
        {labConflicts.length > 0 && (
          <View style={[styles.conflictBanner, { backgroundColor: theme.error + '18', borderColor: theme.error }]}>
            <View style={styles.conflictTitleRow}>
              <FontAwesome5 name="exclamation-triangle" size={18} color={theme.error} />
              <Text style={[styles.conflictTitle, { color: theme.error }]}>
                Lab Conflict Warning ({labConflicts.length})
              </Text>
            </View>
            <Text style={[styles.conflictDesc, { color: theme.text }]}>
              No two classes can occupy the same lab at the same time slot!
            </Text>
            {labConflicts.map((c, i) => (
              <View key={i} style={[styles.conflictItem, { backgroundColor: theme.card, borderColor: theme.error + '40' }]}>
                <Text style={[styles.conflictItemText, { color: theme.error }]}>
                  • {c.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {keys.map((key) => {
          const item = generatedTimetables[key];
          const stats = item.timetable._stats;
          return (
            <View key={key} style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.resultCardHeader}>
                <View>
                  <Text style={[styles.resultTitle, { color: theme.text }]}>
                    {item.grade} — {item.section}
                  </Text>
                  <Text style={[styles.resultSub, { color: theme.textMuted }]}>
                    {periodsNum} periods/day ({durMins} mins/period)
                  </Text>
                </View>

                {stats && (
                  <View style={[styles.hoursPill, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={[styles.hoursPillText, { color: theme.primary }]}>
                      Total: {stats.totalClassHours} hrs/wk {stats.hasLab ? `(Lab: ${stats.totalLabHours}h)` : ''}
                    </Text>
                  </View>
                )}
              </View>

              <TimetableView
                timetable={item.timetable}
                timeSlots={timeSlots}
                grade={item.grade}
                section={item.section}
              />

              {/* Multi-format Software Export */}
              <View style={styles.exportBtnRow}>
                <TouchableOpacity
                  style={[styles.miniExportBtn, { borderColor: theme.primary }]}
                  onPress={() => handleExportCSV(item)}
                >
                  <FontAwesome5 name="file-csv" size={14} color={theme.primary} />
                  <Text style={[styles.miniExportText, { color: theme.primary }]}>Export CSV</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.miniExportBtn, { borderColor: theme.secondary }]}
                  onPress={() => handleExportPDF(item, timeSlots)}
                >
                  <FontAwesome5 name="file-pdf" size={14} color={theme.secondary} />
                  <Text style={[styles.miniExportText, { color: theme.secondary }]}>Export PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Teacher-Wise Weekly Timetable Export Section */}
        <View style={[styles.masterPoolCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: spacing.xl, marginBottom: spacing.base }]}>
          <Text style={[styles.masterPoolTitle, { color: theme.primary }]}>
            <FontAwesome5 name="user-tie" size={16} color={theme.primary} /> Download Teacher Weekly Timetable
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: typography.fontSize.sm, marginBottom: spacing.sm }}>
            Select a faculty member to extract and download their personalized individual weekly workload timetable:
          </Text>

          {/* Teacher Selector Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facultyChips}>
            {teachers.map((teacherName) => {
              const activeTeacher = selectedTeacherForExport || teachers[0];
              const isSelected = activeTeacher === teacherName;
              return (
                <TouchableOpacity
                  key={teacherName}
                  style={[
                    styles.facultyChip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surfaceElevated,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedTeacherForExport(teacherName)}
                >
                  <Text style={{ color: isSelected ? '#fff' : theme.textSecondary, fontSize: typography.fontSize.xs, fontWeight: isSelected ? 'bold' : 'normal' }}>
                    👨‍🏫 {teacherName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.exportBtnRow, { marginTop: spacing.base }]}>
            <TouchableOpacity
              style={[styles.miniExportBtn, { borderColor: theme.primary, flex: 1 }]}
              onPress={() => handleExportTeacherCSV(selectedTeacherForExport || teachers[0])}
            >
              <FontAwesome5 name="file-csv" size={14} color={theme.primary} />
              <Text style={[styles.miniExportText, { color: theme.primary }]}>Teacher CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniExportBtn, { borderColor: theme.secondary, flex: 1, backgroundColor: theme.secondary + '15' }]}
              onPress={() => handleExportTeacherPDF(selectedTeacherForExport || teachers[0])}
            >
              <FontAwesome5 name="file-pdf" size={14} color={theme.secondary} />
              <Text style={[styles.miniExportText, { color: theme.secondary }]}>Download Teacher PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {user && (
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.success, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSaveAll}
            disabled={saving}
          >
            <FontAwesome5 name="save" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save All Schedules to Cloud'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => setStep(3)}>
            <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>← Back to Setup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: theme.secondary }]}
            onPress={() => {
              setStep(0);
              setGeneratedTimetables({});
            }}
          >
            <Text style={styles.nextBtnText}>New Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleExportTeacherPDF = async (teacherName) => {
    if (!teacherName) return;
    try {
      const allList = Object.values(generatedTimetables);
      const teacherSched = extractTeacherSchedule({
        teacherName,
        timetables: allList,
      });

      const html = generateTeacherPDFHTML({ teacherSchedule: teacherSched });

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        } else {
          await Print.printAsync({ html });
        }
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      if (uri) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Teacher Timetable - ${teacherName}` });
      }
    } catch (e) {
      console.error('Teacher PDF export error:', e);
      Alert.alert('Error', 'Failed to generate Teacher PDF.');
    }
  };

  const handleExportTeacherCSV = async (teacherName) => {
    if (!teacherName) return;
    try {
      const allList = Object.values(generatedTimetables);
      const teacherSched = extractTeacherSchedule({
        teacherName,
        timetables: allList,
      });

      const csvData = exportTeacherToCSV({ teacherSchedule: teacherSched });
      const filename = `${teacherName}_Weekly_Timetable.csv`.replace(/\s+/g, '_');

      const { uri } = await Print.printToFileAsync({
        html: `<pre style="font-family:monospace;padding:20px;">${csvData}</pre>`,
      });
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: `Export ${filename}` });
    } catch (e) {
      console.error('Teacher CSV Export Error:', e);
      Alert.alert('Teacher CSV Export', 'Formatted teacher schedule.');
    }
  };

  const handleExportCSV = async (item) => {
    try {
      const timeSlots = generateTimeSlots(startTime, periodsPerDay, periodDuration);
      const csvData = exportToCSV(item.timetable, item.grade, item.section, timeSlots);
      const filename = `${item.grade}_${item.section}_Timetable.csv`.replace(/\s+/g, '_');

      // Create temporary HTML/CSV blob or share string
      const { uri } = await Print.printToFileAsync({
        html: `<pre style="font-family:monospace;padding:20px;">${csvData}</pre>`,
      });
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: `Export ${filename}` });
    } catch (e) {
      console.error('CSV Export Error:', e);
      Alert.alert('CSV Export', 'CSV text formatted successfully.');
    }
  };

  const handleExportPDF = async (item, timeSlots) => {
    try {
      const html = generatePDFHTML({
        timetable: item.timetable,
        grade: item.grade,
        section: item.section,
        timeSlots,
        teacherMap: item.timetable._teacherMap,
      });

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        } else {
          await Print.printAsync({ html });
        }
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      if (uri) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Timetable PDF' });
      }
    } catch (e) {
      console.error('PDF export error:', e);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const handleSaveAll = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to save timetables.');
      return;
    }
    setSaving(true);
    try {
      const keys = Object.keys(generatedTimetables);
      for (const key of keys) {
        const item = generatedTimetables[key];
        const timetableKey = `grade${item.gradeNumber}_${item.section.replace(/\s+/g, '_')}_${Date.now()}`;
        await set(ref(database, `users/${user.uid}/timetables/${timetableKey}`), {
          ...item.timetable,
          grade: item.grade,
          section: item.section,
          periodsPerDay: parseInt(periodsPerDay),
          createdAt: new Date().toISOString(),
        });
      }
      Alert.alert('Success', 'All school schedules saved!', [
        { text: 'View Profile', onPress: () => navigation.navigate('Profile') },
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save timetables.');
    } finally {
      setSaving(false);
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      case 4: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header navigation={navigation} showBack title="School Generator" />
      <StepIndicator steps={STEP_LABELS} currentStep={step} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  stepContent: {},
  stepTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  backBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTeacherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addTeacherText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  timeInput: { flex: 1 },
  semTabs: {
    marginBottom: spacing.base,
  },
  semTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  semTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  classCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  classTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subjectsList: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.base,
  },
  facultyAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subjectLabel: {
    width: 85,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  facultyChips: {
    flexGrow: 0,
    marginVertical: 4,
  },
  facultyChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labSection: {
    borderTopWidth: 1,
    paddingTop: spacing.base,
    marginTop: spacing.base,
  },
  labTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  dayChips: {
    flexGrow: 0,
    marginVertical: spacing.xs,
  },
  dayChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  labTimeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  constraintCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    marginTop: spacing.base,
  },
  constraintTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.base,
  },
  constraintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  constraintInfo: { flex: 1, marginRight: spacing.md },
  constraintLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  constraintDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  resultCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  resultTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  resultSub: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  hoursPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  hoursPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  miniExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: 6,
  },
  miniExportText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  gradeSubjectCard: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  labToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  labToggleLabel: {
    fontSize: typography.fontSize.sm,
  },
  labToggleDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  labSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labAbsentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  labAbsentText: {
    fontSize: typography.fontSize.xs,
    flex: 1,
    lineHeight: 18,
  },
  breakCard: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  breakCardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  breakRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  breakLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  breakSub: {
    fontSize: 10,
    marginTop: 1,
  },
  conflictBanner: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  conflictTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  conflictTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.extrabold,
  },
  conflictDesc: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  conflictItem: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  conflictItemText: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    fontWeight: typography.fontWeight.medium,
  },
  masterPoolCard: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  masterPoolTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  masterPoolChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  masterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  masterChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  addMasterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addMasterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  addMasterBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  gradeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  countInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countInputLabel: {
    fontSize: typography.fontSize.xs,
  },
  countInput: {
    width: 44,
    height: 32,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    paddingVertical: 2,
  },
  selectChipHelp: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  selectorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  selectorChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  freqSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  freqSubjectName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  freqInput: {
    width: 36,
    height: 28,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    paddingVertical: 0,
  },
  freqUnitLabel: {
    fontSize: 10,
    marginLeft: 2,
  },
  labCardItem: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  labCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  labCardTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  addLabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  addLabBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});

export default GeneratorScreen;
