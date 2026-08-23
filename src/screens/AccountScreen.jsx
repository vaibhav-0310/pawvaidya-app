import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingCart, LogIn } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function AccountScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.kicker}>PAWVAIDYA</Text>
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.description}>Manage your care journey and access your cart.</Text>

        <TouchableOpacity style={styles.action} onPress={() => navigation?.navigate?.('Cart')}>
          <ShoppingCart size={20} color={colors.buttonText} />
          <Text style={styles.actionText}>Open cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation?.navigate?.('Login')}>
          <LogIn size={20} color={colors.primaryDark} />
          <Text style={styles.secondaryActionText}>Log in</Text>
        </TouchableOpacity>
      </View>
      <BottomNav navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 38, fontWeight: '800', marginTop: 8 },
  description: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, marginTop: 14 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.buttonBg, borderRadius: 26, paddingVertical: 15, marginTop: 28 },
  actionText: { color: colors.buttonText, fontSize: 16, fontWeight: '700' },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: colors.headerBorder, borderRadius: 26, paddingVertical: 14, marginTop: 12 },
  secondaryActionText: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
});
