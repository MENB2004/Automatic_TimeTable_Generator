import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius } from '../styles/theme';

const ATG_LOGO = require('../../assets/atg_logo.jpg');

const Header = ({ title, showBack, onBack, navigation }) => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={onBack || (() => navigation?.goBack())} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation?.navigate('Home')} style={styles.logoContainer}>
          <Image source={ATG_LOGO} style={styles.logoImage} resizeMode="contain" />
        </TouchableOpacity>
        {title && (
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: theme.surfaceElevated }]}>
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={20}
          color={isDark ? '#ffd700' : '#ff8c00'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 36,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.md,
    flex: 1,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;
