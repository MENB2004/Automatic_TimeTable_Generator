import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import FeatureCard from '../components/FeatureCard';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { typography, spacing, borderRadius, shadows } from '../styles/theme';

const ATG_LOGO = require('../../assets/atg_logo.jpg');

const FEATURES = [
  { icon: 'sliders-h', title: 'Configurable Periods', description: 'Set custom period counts (6 to 10 per day) tailored for your school' },
  { icon: 'school', title: 'School-Level Layout', description: 'Built for Standards & Sections (Grade 1-12, Section A, B, C)' },
  { icon: 'clock', title: 'Working & Lab Hours', description: 'Calculates total weekly class hours and dedicated lab working hours' },
  { icon: 'code', title: 'Software Matrix View', description: 'Interactive visual grid + machine-readable matrix view' },
  { icon: 'file-csv', title: 'Multi-Format Export', description: 'Instant PDF and CSV export for School Management Systems (SMS)' },
];

const STEPS = [
  { number: '1', title: 'Define School & Periods', description: 'Enter number of Grades, Sections, and daily period count (e.g. 8 periods)' },
  { number: '2', title: 'Set Subjects & Teachers', description: 'Configure weekly subject frequencies and assign class/subject teachers' },
  { number: '3', title: 'Practical Lab Setup', description: 'Configure 3-period lab blocks with total working hour calculations' },
  { number: '4', title: 'Generate & Export', description: 'Export complete school schedules to PDF or CSV software formats' },
];

const TESTIMONIALS = [
  { text: 'ATG transformed our school scheduling. Handling 8 periods a day across 12 grades and multiple sections is now effortless!', name: 'Principal Arthur Vance', role: 'St. Jude High School' },
  { text: 'The Lab Working Hours calculator and CSV export save our administrative team hours every semester.', name: 'Mrs. Anita Roy', role: 'Academic Vice Principal' },
  { text: 'Switching between the Visual Grid and Software Matrix view makes importing data into our school portal seamless.', name: 'David Miller', role: 'IT Administrator' },
];

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header navigation={navigation} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient colors={theme.heroGradient} style={styles.hero}>
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim }]}>
            <Image source={ATG_LOGO} style={styles.heroLogo} resizeMode="contain" />
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Automatic School{'\n'}Timetable Generator
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Smart, constraint-based timetable generator designed for Grades, Sections, configurable periods, and software export.
            </Text>
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate(user ? 'Generator' : 'Login')}
              >
                <Text style={styles.btnPrimaryText}>Create School Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSecondary, { borderColor: theme.primary }]}
                onPress={() => navigation.navigate('About')}
              >
                <Text style={[styles.btnSecondaryText, { color: theme.primary }]}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Mini Timetable Preview */}
          <View style={[styles.previewContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.lg]}>
            <View style={styles.previewHeader}>
              {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <View key={i} style={[styles.previewHeaderCell, { backgroundColor: theme.timetableHeader }]}>
                  <Text style={[styles.previewHeaderText, { color: theme.textSecondary }]}>{day}</Text>
                </View>
              ))}
            </View>
            {Array.from({ length: 5 }, (_, row) => (
              <View key={row} style={styles.previewRow}>
                <View style={[styles.previewHeaderCell, { backgroundColor: theme.timetableHeader }]}>
                  <Text style={[styles.previewHeaderText, { color: theme.textSecondary }]}>P{row + 1}</Text>
                </View>
                {Array.from({ length: 5 }, (_, col) => {
                  const colorIdx = (row * 5 + col) % theme.subjectColors.length;
                  return (
                    <View
                      key={col}
                      style={[styles.previewCell, { backgroundColor: theme.subjectColors[colorIdx] + '60' }]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Features</Text>
          <FlatList
            horizontal
            data={FEATURES}
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresList}
            renderItem={({ item }) => (
              <FeatureCard icon={item.icon} title={item.title} description={item.description} />
            )}
          />
        </View>

        {/* How It Works */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>How It Works</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>What Educators Say</Text>
          <View style={[styles.testimonialCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.md]}>
            <FontAwesome5 name="quote-left" size={24} color={theme.primary} style={{ marginBottom: spacing.md }} />
            <Text style={[styles.testimonialText, { color: theme.text }]}>
              {TESTIMONIALS[activeTestimonial].text}
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={[styles.authorAvatar, { backgroundColor: theme.primary + '20' }]}>
                <FontAwesome5 name="user-tie" size={26} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.authorName, { color: theme.text }]}>
                  {TESTIMONIALS[activeTestimonial].name}
                </Text>
                <Text style={[styles.authorRole, { color: theme.textSecondary }]}>
                  {TESTIMONIALS[activeTestimonial].role}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.indicators}>
            {TESTIMONIALS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveTestimonial(i)}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: i === activeTestimonial ? theme.primary : theme.border,
                    width: i === activeTestimonial ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Get In Touch</Text>
          <View style={styles.contactItems}>
            {[
              { icon: 'envelope', text: 'support@atg-timetable.com' },
              { icon: 'phone', text: '+1 (555) 123-4567' },
              { icon: 'map-marker-alt', text: '123 Education Ave, Learning City' },
            ].map((item, i) => (
              <View key={i} style={styles.contactItem}>
                <FontAwesome5 name={item.icon} size={16} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.textSecondary }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.socialLinks}>
            {['facebook-f', 'twitter', 'linkedin-in', 'github'].map((icon, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.socialButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              >
                <FontAwesome5 name={icon} size={18} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Image source={ATG_LOGO} style={{ width: 100, height: 44, marginBottom: spacing.sm }} resizeMode="contain" />
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            © 2026 Automatic School Timetable Generator. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  heroContent: { marginBottom: spacing.xxl },
  heroLogo: {
    width: 140,
    height: 60,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.xl,
  },
  ctaRow: { flexDirection: 'row', gap: spacing.md },
  btnPrimary: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  btnSecondary: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  btnSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  previewContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  previewHeader: { flexDirection: 'row' },
  previewRow: { flexDirection: 'row' },
  previewHeaderCell: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  previewHeaderText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  previewCell: {
    flex: 1,
    height: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  featuresList: {
    paddingLeft: spacing.xs,
    paddingRight: spacing.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  stepContent: { flex: 1 },
  stepTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  testimonialCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  testimonialText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  authorName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  authorRole: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  contactItems: {
    marginBottom: spacing.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contactText: {
    fontSize: typography.fontSize.md,
    marginLeft: spacing.md,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  footerLogo: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
  },
});

export default HomeScreen;
