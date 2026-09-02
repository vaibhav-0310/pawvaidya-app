import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HeartPulse, LogIn, LogOut, Package, ShoppingCart, Stethoscope } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

export default function AccountScreen({ navigation }) {
  const { user, isAuthenticated, initializing, logout } = useAuth();

  const displayName = user?.name || user?.username || user?.email || 'Pet parent';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      <View style={styles.content}>
        {initializing ? (
          <ActivityIndicator size="large" color={colors.primaryAccent} />
        ) : isAuthenticated ? (
          <>
            <Text style={styles.kicker}>PAWVAIDYA DASHBOARD</Text>
            <Text style={styles.title}>Hello, {displayName}</Text>
            <Text style={styles.description}>Keep your pet's care organized in one place.</Text>

            <View style={styles.statusCard}>
              <View style={styles.statusIcon}>
                <HeartPulse size={22} color={colors.primaryAccent} />
              </View>
              <View style={styles.statusTextWrap}>
                <Text style={styles.statusTitle}>Account connected</Text>
                <Text style={styles.statusDescription}>Your PawVaidya session is active.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.action} onPress={() => navigation?.navigate?.('Cart')}>
              <ShoppingCart size={20} color={colors.buttonText} />
              <Text style={styles.actionText}>Open cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation?.navigate?.('Orders')}>
              <Package size={20} color={colors.primaryDark} />
              <Text style={styles.secondaryActionText}>My orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation?.navigate?.('Vet')}>
              <Stethoscope size={20} color={colors.primaryDark} />
              <Text style={styles.secondaryActionText}>Consult a vet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutAction} onPress={handleLogout}>
              <LogOut size={19} color={colors.accentPink} />
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.kicker}>PAWVAIDYA</Text>
            <Text style={styles.title}>Your account</Text>
            <Text style={styles.description}>Log in to manage your care journey and access your cart.</Text>

            <TouchableOpacity style={styles.action} onPress={() => navigation?.navigate?.('Login')}>
              <LogIn size={20} color={colors.buttonText} />
              <Text style={styles.actionText}>Log in</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <BottomNav navigation={navigation} activeScreen="Account" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 38, fontWeight: '800', marginTop: 8 },
  description: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, marginTop: 14 },
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16, marginTop: 24 },
  statusIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  statusTextWrap: { flex: 1, marginLeft: 12 },
  statusTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  statusDescription: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.buttonBg, borderRadius: 26, paddingVertical: 15, marginTop: 28 },
  actionText: { color: colors.buttonText, fontSize: 16, fontWeight: '700' },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: colors.headerBorder, borderRadius: 26, paddingVertical: 14, marginTop: 12 },
  secondaryActionText: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  logoutAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 10 },
  logoutText: { color: colors.accentPink, fontSize: 15, fontWeight: '700' },
});
