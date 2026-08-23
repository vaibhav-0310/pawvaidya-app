import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, ShoppingBag, BookOpen, Stethoscope, Package, PlusCircle } from 'lucide-react-native';
import colors from '../theme/colors';

const ITEMS = [
  { label: 'Home', screen: 'Home', Icon: Home },
  { label: 'Essentials', screen: 'Marketplace', Icon: ShoppingBag },
  { label: 'Blog', screen: 'Blog', Icon: BookOpen },
  { label: 'Consult', screen: 'Vet', Icon: Stethoscope },
  { label: 'Patient PHR', screen: 'Phr', Icon: Package },
  { label: 'Q&A', screen: 'Parser', Icon: PlusCircle },
];

export default function BottomNav({ navigation, activeScreen }) {
  return (
    <View style={styles.bar}>
      {ITEMS.map(({ label, screen, Icon }) => {
        const active = activeScreen === screen;
        return (
          <TouchableOpacity
            key={screen}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={styles.item}
            onPress={() => navigation?.navigate?.(screen)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, active && styles.activeIconWrap]}>
              <Icon size={20} color={active ? colors.buttonText : colors.textSecondary} />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    minWidth: 56,
  },
  iconWrap: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  activeIconWrap: {
    backgroundColor: colors.primaryDark,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  activeLabel: {
    color: colors.primaryDark,
  },
});
