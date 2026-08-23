import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function SectionScreen({ navigation, route }) {
  const title = route?.params?.title || route?.name || 'PawVaidya';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      <View style={styles.content}>
        <Text style={styles.kicker}>PAWVAIDYA</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          Thoughtful care and trusted guidance for your pet are coming together here.
        </Text>
      </View>
      <BottomNav navigation={navigation} activeScreen={route?.name} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 38, fontWeight: '800', marginTop: 8 },
  description: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, marginTop: 14, maxWidth: 340 },
});
