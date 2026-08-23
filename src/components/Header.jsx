// src/components/Header.jsx
// App header with the brand mark. Screen navigation lives in BottomNav.

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { UserRound } from 'lucide-react-native';
import Logo from './Logo';
import colors from '../theme/colors';

export default function Header({ navigation }) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={() => navigation?.navigate?.('Home')} activeOpacity={0.7}>
        <Logo />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.accountButton}
        onPress={() => navigation?.navigate?.('Account')}
        accessibilityRole="button"
        accessibilityLabel="Account"
      >
        <UserRound size={20} color={colors.primaryDark} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  accountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.headerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.headerBg,
  },
});