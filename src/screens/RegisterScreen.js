import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database, ref, set } from '../../firebaseConfig';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/theme';

const ACCOUNT_TYPES = [
  { label: 'Select account type', value: '' },
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Administrator', value: 'admin' },
];

const RegisterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return { percent: 0, color: 'transparent', label: '' };
    let strength = 0;
    if (p.length >= 8) strength++;
    if (/[A-Z]/.test(p)) strength++;
    if (/[a-z]/.test(p)) strength++;
    if (/[0-9]/.test(p)) strength++;
    if (/[^A-Za-z0-9]/.test(p)) strength++;

    const configs = [
      { color: theme.error, label: 'Very Weak' },
      { color: '#ffb300', label: 'Weak' },
      { color: '#fdd835', label: 'Medium' },
      { color: '#7cb342', label: 'Strong' },
      { color: theme.success, label: 'Very Strong' },
    ];
    const config = configs[Math.min(strength - 1, 4)] || configs[0];
    return { percent: (strength / 5) * 100, ...config };
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.userType) e.userType = 'Select an account type';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain an uppercase letter';
    else if (!/[a-z]/.test(form.password)) e.password = 'Must contain a lowercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number';
    else if (!/[^A-Za-z0-9]/.test(form.password)) e.password = 'Must contain a special character';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.termsAccepted) e.terms = 'You must agree to the Terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setGlobalError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const userId = userCredential.user.uid;

      await set(ref(database, `users/${userId}`), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        userType: form.userType,
        createdAt: new Date().toISOString(),
        semesters: {},
        faculties: {},
        classes: {},
        timetables: {},
      });
      // Auth state change will handle navigation
    } catch (err) {
      let errorMessage;
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password too weak.';
          break;
        default:
          errorMessage = 'Registration failed. Try again.';
      }
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  const renderInput = (field, label, placeholder, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBackground,
            borderColor: errors[field] ? theme.error : theme.inputBorder,
          },
        ]}
      >
        {options.icon && (
          <FontAwesome5 name={options.icon} size={16} color={theme.textMuted} style={styles.inputIcon} />
        )}
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          value={form[field]}
          onChangeText={(v) => updateForm(field, v)}
          secureTextEntry={options.secure && !(field === 'password' ? showPassword : showConfirmPassword)}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'sentences'}
          autoCorrect={false}
        />
        {options.secure && (
          <TouchableOpacity
            onPress={() =>
              field === 'password'
                ? setShowPassword(!showPassword)
                : setShowConfirmPassword(!showConfirmPassword)
            }
            style={styles.eyeButton}
          >
            <FontAwesome5
              name={(field === 'password' ? showPassword : showConfirmPassword) ? 'eye-slash' : 'eye'}
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] ? <Text style={[styles.errorText, { color: theme.error }]}>{errors[field]}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header navigation={navigation} showBack title="Register" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }, shadows.lg]}>
            <View style={styles.authHeader}>
              <Text style={[styles.logoText, { color: theme.primary }]}>ATG</Text>
              <Text style={[styles.title, { color: theme.text }]}>Create an Account</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Register to use the automatic timetable generator
              </Text>
            </View>

            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                {renderInput('firstName', 'First Name', 'First name', { icon: 'user' })}
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                {renderInput('lastName', 'Last Name', 'Last name')}
              </View>
            </View>

            {renderInput('email', 'Email', 'Enter your email', { icon: 'envelope', keyboardType: 'email-address', autoCapitalize: 'none' })}
            {renderInput('phone', 'Phone Number', 'Enter phone number', { icon: 'phone', keyboardType: 'phone-pad' })}

            {/* Account Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Account Type</Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: errors.userType ? theme.error : theme.inputBorder,
                  },
                ]}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <FontAwesome5 name="user-tag" size={16} color={theme.textMuted} style={styles.inputIcon} />
                <Text style={[styles.input, { color: form.userType ? theme.text : theme.textMuted, paddingVertical: 14 }]}>
                  {ACCOUNT_TYPES.find((t) => t.value === form.userType)?.label || 'Select account type'}
                </Text>
                <FontAwesome5 name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={12} color={theme.textMuted} />
              </TouchableOpacity>
              {showTypePicker && (
                <View style={[styles.pickerDropdown, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  {ACCOUNT_TYPES.filter((t) => t.value).map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.pickerItem, form.userType === type.value && { backgroundColor: theme.primary + '20' }]}
                      onPress={() => {
                        updateForm('userType', type.value);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, { color: form.userType === type.value ? theme.primary : theme.text }]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.userType ? <Text style={[styles.errorText, { color: theme.error }]}>{errors.userType}</Text> : null}
            </View>

            {/* Password */}
            {renderInput('password', 'Password', 'Create a strong password', { icon: 'lock', secure: true })}

            {/* Password Strength Bar */}
            {form.password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { backgroundColor: theme.border }]}>
                  <View style={[styles.strengthFill, { width: `${strength.percent}%`, backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            {renderInput('confirmPassword', 'Confirm Password', 'Confirm your password', { icon: 'lock', secure: true })}

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => updateForm('termsAccepted', !form.termsAccepted)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: errors.terms ? theme.error : theme.primary,
                    backgroundColor: form.termsAccepted ? theme.primary : 'transparent',
                  },
                ]}
              >
                {form.termsAccepted && <FontAwesome5 name="check" size={10} color="#fff" />}
              </View>
              <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                I agree to the{' '}
                <Text style={{ color: theme.primary }}>Terms of Service</Text> and{' '}
                <Text style={{ color: theme.primary }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms ? <Text style={[styles.errorText, { color: theme.error, marginTop: -spacing.sm }]}>{errors.terms}</Text> : null}

            {/* Global Error */}
            {globalError ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.error + '15', borderColor: theme.error + '30' }]}>
                <FontAwesome5 name="exclamation-circle" size={14} color={theme.error} />
                <Text style={[styles.errorBannerText, { color: theme.error }]}>{globalError}</Text>
              </View>
            ) : null}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: theme.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: theme.primary }]}>Log in here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  pickerItemText: {
    fontSize: typography.fontSize.base,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.base,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  errorBannerText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },
  registerButton: {
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: typography.fontSize.md,
  },
  loginLink: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

export default RegisterScreen;
