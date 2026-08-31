import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { auth, database, ref, get, set } from '../../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import TimetableCard from '../components/TimetableCard';
import TimetableView from '../components/TimetableView';
import { typography, spacing, borderRadius, shadows } from '../styles/theme';
import {
  DAYS,
  exportToCSV,
  calculateWorkingHours,
  DEFAULT_PERIODS_PER_DAY,
  generatePDFHTML,
  generateTimeSlots,
  extractTeacherSchedule,
  generateTeacherPDFHTML,
} from '../utils/timetableAlgorithm';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [timetables, setTimetables] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadTimetables();
    }
  }, [user]);

  const loadTimetables = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(database, `users/${user.uid}/timetables`));
      if (snapshot.exists()) {
        setTimetables(snapshot.val());
      } else {
        setTimetables({});
      }
    } catch (error) {
      console.error('Error loading timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimetable = async (key) => {
    try {
      const snapshot = await get(ref(database, `users/${user.uid}/timetables/${key}`));
      if (snapshot.exists()) {
        setSelectedTimetable({ key, data: snapshot.val() });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      Alert.alert('Error', 'Failed to load schedule details.');
    }
  };

  const performDelete = async (keyToDelete) => {
    const key = keyToDelete || selectedTimetable?.key;
    if (!key) return;

    setDeleting(true);
    try {
      if (user && user.uid) {
        await set(ref(database, `users/${user.uid}/timetables/${key}`), null);
      }
      setTimetables((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (selectedTimetable && selectedTimetable.key === key) {
        setModalVisible(false);
        setSelectedTimetable(null);
      }
      if (Platform.OS === 'web') {
        alert('Schedule deleted successfully.');
      } else {
        Alert.alert('Success', 'Schedule deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      Alert.alert('Error', 'Failed to delete schedule.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteTimetable = async (keyToDelete) => {
    const targetKey = keyToDelete || selectedTimetable?.key;
    if (!targetKey) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this school schedule?');
      if (confirmed) {
        await performDelete(targetKey);
      }
    } else {
      Alert.alert(
        'Delete Schedule',
        'Are you sure you want to delete this school schedule?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => performDelete(targetKey),
          },
        ]
      );
    }
  };

  const handleExportTeacherPDF = async (teacherName) => {
    if (!selectedTimetable || !teacherName) return;
    try {
      const teacherSched = extractTeacherSchedule({
        teacherName,
        timetables: [selectedTimetable.data],
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Teacher Schedule - ${teacherName}` });
      }
    } catch (e) {
      console.error('Teacher PDF error:', e);
      Alert.alert('Error', 'Failed to generate Teacher PDF.');
    }
  };

  const handleExportPDF = async () => {
    if (!selectedTimetable) return;
    const tt = selectedTimetable.data;
    const grade = tt.grade || (tt.semester ? `Grade ${tt.semester}` : 'Grade Schedule');
    const section = tt.section || (tt.class ? `Section ${tt.class}` : 'Section A');
    const periodsCount = tt.periodsPerDay || (tt.Monday ? tt.Monday.length : DEFAULT_PERIODS_PER_DAY);
    const timeSlots = generateTimeSlots('08:30', periodsCount, 45);

    try {
      const html = generatePDFHTML({
        timetable: tt,
        grade,
        section,
        timeSlots,
        teacherMap: tt._teacherMap,
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
    } catch (error) {
      console.error('PDF error:', error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const handleExportCSV = async () => {
    if (!selectedTimetable) return;
    const tt = selectedTimetable.data;
    const grade = tt.grade || (tt.semester ? `Grade ${tt.semester}` : 'Grade Schedule');
    const section = tt.section || (tt.class ? `Section ${tt.class}` : 'Section A');

    try {
      const csvStr = exportToCSV(tt, grade, section);
      const { uri } = await Print.printToFileAsync({
        html: `<pre style="font-family:monospace;padding:20px;">${csvStr}</pre>`,
      });
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: `Export ${grade}_${section}_CSV` });
    } catch (e) {
      console.error('CSV export error:', e);
      Alert.alert('CSV Export', 'CSV text formatted successfully.');
    }
  };

  const performLogout = async () => {
    try {
      await signOut(auth);
      if (navigation && navigation.navigate) {
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout.');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        await performLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  const timetableKeys = Object.keys(timetables);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header navigation={navigation} title="School Profile" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.md]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {user?.email?.charAt(0).toUpperCase() || 'S'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.displayName || 'School Administrator'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Generator')}
            >
              <FontAwesome5 name="plus" size={14} color="#fff" />
              <Text style={styles.createBtnText}>New Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: theme.error }]}
              onPress={handleLogout}
            >
              <FontAwesome5 name="sign-out-alt" size={14} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timetables list */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved School Schedules</Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: spacing.xxl }} />
        ) : timetableKeys.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <FontAwesome5 name="school" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No school schedules found. Create your first timetable!
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Generator')}
            >
              <Text style={styles.emptyBtnText}>Create Timetable</Text>
            </TouchableOpacity>
          </View>
        ) : (
          timetableKeys.map((key) => {
            const tt = timetables[key];
            const stats = tt._stats || calculateWorkingHours(tt, tt.periodsPerDay || DEFAULT_PERIODS_PER_DAY, 45);
            return (
              <TimetableCard
                key={key}
                grade={tt.grade}
                section={tt.section}
                semester={tt.semester}
                classNum={tt.class}
                createdAt={tt.createdAt}
                mondayPreview={tt.Monday}
                stats={stats}
                onPress={() => handleViewTimetable(key)}
                onDelete={() => handleDeleteTimetable(key)}
              />
            );
          })
        )}
      </ScrollView>

      {/* Timetable Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>School Timetable Schedule</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome5 name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedTimetable && (
              <ScrollView>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {selectedTimetable.data.grade || `Grade ${selectedTimetable.data.semester || 1}`} —{' '}
                  {selectedTimetable.data.section || `Section ${selectedTimetable.data.class || 'A'}`}
                </Text>
                <TimetableView
                  timetable={selectedTimetable.data}
                  grade={selectedTimetable.data.grade}
                  section={selectedTimetable.data.section}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                    onPress={handleExportPDF}
                  >
                    <FontAwesome5 name="file-pdf" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Export Class PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.secondary }]}
                    onPress={handleExportCSV}
                  >
                    <FontAwesome5 name="file-csv" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Export CSV</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: theme.error }]}
                    onPress={() => handleDeleteTimetable()}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <FontAwesome5 name="trash" size={14} color="#fff" />
                        <Text style={styles.actionBtnText}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Extract Individual Teacher Timetables */}
                {(() => {
                  const teacherMap = selectedTimetable.data._teacherMap || {};
                  const teachersInSchedule = Array.from(new Set(Object.values(teacherMap))).filter(Boolean);
                  if (teachersInSchedule.length === 0) return null;

                  return (
                    <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: spacing.base }}>
                      <Text style={[styles.modalSubtitle, { color: theme.text, fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs }]}>
                        👨‍🏫 Download Teacher Weekly Timetable:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {teachersInSchedule.map((tName) => (
                          <TouchableOpacity
                            key={tName}
                            style={[
                              styles.actionBtn,
                              { backgroundColor: theme.primary + '15', borderWidth: 1, borderColor: theme.primary, marginRight: spacing.xs, paddingHorizontal: 12, paddingVertical: 8 },
                            ]}
                            onPress={() => handleExportTeacherPDF(tName)}
                          >
                            <FontAwesome5 name="user-tie" size={12} color={theme.primary} />
                            <Text style={[styles.actionBtnText, { color: theme.primary, fontSize: typography.fontSize.xs, marginLeft: 4 }]}>
                              {tName} PDF
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  );
                })()}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  profileHeader: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  profileInfo: {
    marginBottom: spacing.base,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  userEmail: {
    fontSize: typography.fontSize.md,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.base,
  },
  emptyState: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  emptyBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.base,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs + 1,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
});

export default ProfileScreen;
