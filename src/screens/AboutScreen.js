import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Header from '../components/Header';
import FAQItem from '../components/FAQItem';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/theme';

const FEATURES = [
  { icon: 'sliders-h', title: 'Configurable Periods', desc: 'Customize total periods per day (e.g. 6 to 10 periods) for your school schedule.' },
  { icon: 'school', title: 'School-Level Architecture', desc: 'Built for Standards/Grades and Sections (Section A, B, C) with Class Teachers.' },
  { icon: 'clock', title: 'Working & Lab Hours Stats', desc: 'Automatic calculation of total teaching hours and dedicated lab working hours.' },
  { icon: 'code', title: 'Software Supportive View', desc: 'Switch between Visual Grid view and Machine-Readable Software Matrix view.' },
  { icon: 'file-csv', title: 'Multi-Format Export', desc: 'Export timetables instantly to PDF and CSV formats for School Management Systems (SMS).' },
  { icon: 'flask', title: 'Practical Lab Scheduling', desc: 'Labs scheduled in 3 consecutive periods with before/after lunch options.' },
  { icon: 'moon', title: 'Dynamic Dark/Light System', desc: 'Adaptive glassmorphism theme system built with modern React Native.' },
  { icon: 'users', title: 'Conflict Prevention', desc: 'Heuristic engine prevents teacher double-booking across different grades.' },
];

const CONSTRAINTS = [
  { icon: 'check-circle', title: 'Configurable Daily Periods', desc: 'Flexible period counts per day (e.g., 8 periods per standard).' },
  { icon: 'check-circle', title: 'Practical Lab Hours', desc: 'Dedicated 3-period lab blocks with total working hour tracking.' },
  { icon: 'check-circle', title: 'Daily Subject Limits', desc: 'Prevents scheduling any subject more than 2-3 times per day.' },
  { icon: 'check-circle', title: 'Consecutive Limits', desc: 'Maximum 2 consecutive periods for effective student learning.' },
  { icon: 'check-circle', title: 'School Teacher Conflict Solver', desc: 'Prevents teacher overlap across sections and grades.' },
];

const MODERN_TECH = [
  { icon: 'react', label: 'React Native & Expo 57', color: '#61DAFB', desc: 'Performant cross-platform mobile framework' },
  { icon: 'database', label: 'Firebase Realtime Cloud', color: '#FFCA28', type: 'solid', desc: 'Live data sync & cloud storage' },
  { icon: 'cogs', label: 'Heuristic Solver Engine', color: '#00d4ff', type: 'solid', desc: 'Constraint-satisfaction scheduling algorithm' },
  { icon: 'file-export', label: 'CSV / PDF Pipeline', color: '#7c4dff', type: 'solid', desc: 'Software-compatible export engine' },
];

const FAQS = [
  { q: 'Can I change the number of periods per day for my school?', a: 'Yes! You can configure the number of periods per day (e.g. 6, 7, 8, 9, or 10 periods) and set the exact period duration in minutes during the initial setup step.' },
  { q: 'What is the Software Supportive View?', a: 'The Software Supportive View displays the schedule in a structured matrix format alongside CSV exports, making it effortless to import or sync with School Management Systems (SMS) and administrative tools.' },
  { q: 'How are Lab Working Hours calculated?', a: 'When practical labs are scheduled (e.g. 3 consecutive periods), the system calculates both total weekly teaching hours and dedicated lab working hours based on your configured period duration.' },
  { q: 'Is this suitable for K-12 Schools and High Schools?', a: 'Absolutely. The application is designed specifically with School-level terminology (Grades/Standards and Sections A, B, C) and school scheduling rules.' },
];

const AboutScreen = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header navigation={navigation} showBack title="About" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            School Timetable{'\n'}Generator
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            A modern, AI-inspired timetable platform powered by React Native, dynamic period configuration, and software integration tools.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Our Mission</Text>
          <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
            To empower schools and educational institutions with smart, constraint-driven timetable generation that minimizes administrative overhead while maximizing academic efficiency.
          </Text>
          <View style={styles.valuesRow}>
            {[
              { icon: 'school', title: 'School First', desc: 'Tailored for Grades & Sections' },
              { icon: 'bolt', title: 'Automated', desc: 'Constraint-based solver engine' },
              { icon: 'code', title: 'Supportive', desc: 'CSV & software matrix exports' },
            ].map((v, i) => (
              <View key={i} style={[styles.valueCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.sm]}>
                <FontAwesome5 name={v.icon} size={24} color={theme.primary} />
                <Text style={[styles.valueTitle, { color: theme.text }]}>{v.title}</Text>
                <Text style={[styles.valueDesc, { color: theme.textSecondary }]}>{v.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Core Features */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Core Features</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.sm]}>
                <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
                  <FontAwesome5 name={f.icon} size={18} color={theme.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Constraints */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>School Scheduling Rules</Text>
          {CONSTRAINTS.map((c, i) => (
            <View key={i} style={[styles.constraintItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <FontAwesome5 name={c.icon} size={18} color={theme.success} style={styles.constraintIcon} />
              <View style={styles.constraintContent}>
                <Text style={[styles.constraintTitle, { color: theme.text }]}>{c.title}</Text>
                <Text style={[styles.constraintDesc, { color: theme.textSecondary }]}>{c.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Modern Technologies Showcase */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Modern Technologies</Text>
          <View style={styles.techRow}>
            {MODERN_TECH.map((t, i) => (
              <View key={i} style={[styles.techItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.sm]}>
                <FontAwesome5 name={t.icon} size={28} color={t.color} solid={t.type === 'solid'} />
                <Text style={[styles.techLabel, { color: theme.text }]}>{t.label}</Text>
                <Text style={[styles.techDesc, { color: theme.textMuted }]}>{t.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
          {FAQS.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerLogo, { color: theme.primary }]}>ATG</Text>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            © 2026 Automatic School Timetable Generator
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  heroTitle: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: 44,
    marginBottom: spacing.base,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
  },
  sectionDesc: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  valuesRow: {
    gap: spacing.md,
  },
  valueCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.base,
    alignItems: 'center',
  },
  valueTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.sm,
  },
  valueDesc: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  featuresGrid: {
    gap: spacing.md,
  },
  featureCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  constraintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  constraintIcon: {
    marginRight: spacing.md,
  },
  constraintContent: { flex: 1 },
  constraintTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  constraintDesc: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  techRow: {
    gap: spacing.md,
  },
  techItem: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.base,
    alignItems: 'center',
  },
  techLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.sm,
  },
  techDesc: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: spacing.xl,
  },
  footerLogo: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
  },
});

export default AboutScreen;
