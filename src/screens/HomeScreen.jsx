import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { ArrowRight, CalendarHeart, ShieldCheck, Stethoscope, ShoppingBag, MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const SERVICES = [
  {
    title: 'Preventative care',
    description: 'Regular check-ups and vaccinations to keep your pet healthy and happy.',
    Icon: ShieldCheck,
    color: '#F5CB35',
  },
  {
    title: 'Expert consultations',
    description: 'Trusted veterinary guidance for every stage of your pet\'s life.',
    Icon: Stethoscope,
    color: '#A9D2EB',
  },
  {
    title: 'Wellness plans',
    description: 'Thoughtful care plans built around your companion\'s unique needs.',
    Icon: CalendarHeart,
    color: '#D8B7F6',
  },
];

const CATEGORIES = [
  ['Wellness care', '#7A7F82'],
  ['Dental care', '#D9364B'],
  ['In house laboratory', '#F5B718'],
  ['Parasite prevention', '#3D8CD6'],
  ['Pet grooming', '#F5B718'],
  ['Vaccination', '#D9364B'],
  ['Emergency care', '#7A7F82'],
  ['Surgery', '#F5B718'],
  ['Boarding', '#16B8D7'],
];

const ARROW_IMAGE = 'https://cdn.prod.website-files.com/67607a4da94c236117377bec/6764819726da5b0ff20bf33d_arrow-pink.webp';

export default function HomeScreen({ navigation }) {
  const tickerX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(tickerX, {
        toValue: -720,
        duration: 18000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [tickerX]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.welcomeTitle}>How can we help today?</Text>
          </View>
        </View>

        <View style={styles.careBanner}>
          <View style={styles.heroMessage}>
            <Text style={styles.heroLabel}>TODAY'S CARE FOCUS</Text>
            <Text style={styles.heroHeading}>Healthy pets.{`\n`}Happy homes.</Text>
            <View style={styles.wellnessLineWrap}>
              <Text style={styles.wellnessText}>Pet wellness</Text>
              <Image source={{ uri: ARROW_IMAGE }} style={styles.underlineImage} resizeMode="contain" />
            </View>
          </View>
          <Image source={require('../assests/dog.webp')} style={styles.carePhoto} resizeMode="cover" />
          <TouchableOpacity style={styles.heroAction} onPress={() => navigation?.navigate?.('Vet')}>
            <Text style={styles.heroActionText}>Talk to a vet</Text>
            <ArrowRight size={16} color={colors.buttonText} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.('Marketplace')}>
            <View style={[styles.quickIcon, { backgroundColor: '#F5CB35' }]}><ShoppingBag size={20} color={colors.primaryDark} /></View>
            <Text style={styles.quickLabel}>Essentials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.('Vet')}>
            <View style={[styles.quickIcon, { backgroundColor: '#A9D2EB' }]}><MessageCircle size={20} color={colors.primaryDark} /></View>
            <Text style={styles.quickLabel}>Consult a vet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.('Phr')}>
            <View style={[styles.quickIcon, { backgroundColor: '#D8B7F6' }]}><CalendarHeart size={20} color={colors.primaryDark} /></View>
            <Text style={styles.quickLabel}>Pet records</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tickerViewport}>
          <Animated.View style={[styles.tickerTrack, { transform: [{ translateX: tickerX }] }]}>
            {[...CATEGORIES, ...CATEGORIES].map(([label, dotColor], index) => (
              <View key={`${label}-${index}`} style={styles.categoryPill}>
                <View style={[styles.categoryDot, { backgroundColor: dotColor }]} />
                <Text style={styles.categoryText}>{label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionKicker}>WHAT WE DO</Text>
            <Text style={styles.sectionTitle}>Healthcare tailored to your needs</Text>
          </View>
          <TouchableOpacity onPress={() => navigation?.navigate?.('Marketplace')}>
            <ArrowRight size={22} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {SERVICES.map(({ title, description, Icon, color }) => (
          <TouchableOpacity key={title} style={styles.serviceCard} activeOpacity={0.85}>
            <View style={[styles.serviceIcon, { backgroundColor: color }]}>
              <Icon size={24} color={colors.primaryDark} />
            </View>
            <View style={styles.serviceCopy}>
              <Text style={styles.serviceTitle}>{title}</Text>
              <Text style={styles.serviceDescription}>{description}</Text>
            </View>
            <ArrowRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav navigation={navigation} activeScreen="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 20 },
  tickerViewport: { overflow: 'hidden', marginTop: 18, marginBottom: 8, paddingVertical: 3 },
  tickerTrack: { flexDirection: 'row', alignItems: 'center', width: 1800 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  categoryText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 18, marginTop: 16, marginBottom: 18 },
  greeting: { color: colors.textSecondary, fontSize: 13 },
  welcomeTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  careBanner: { minHeight: 190, marginHorizontal: 18, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, padding: 18, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  heroMessage: { alignSelf: 'flex-start', maxWidth: '62%' },
  carePhoto: { position: 'absolute', top: 16, right: 14, width: 116, height: 116, borderRadius: 20 },
  heroLabel: { color: colors.accentPink, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  heroHeading: { color: colors.primaryDark, fontSize: 20, lineHeight: 24, fontWeight: '800', marginTop: 5 },
  wellnessLineWrap: { position: 'relative', alignSelf: 'flex-start', marginTop: 10, paddingBottom: 14 },
  wellnessText: { color: colors.primaryDark, fontSize: 17, fontWeight: '800' },
  underlineImage: { position: 'absolute', width: 115, height: 20, left: 4, bottom: -2 },
  heroAction: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.primaryDark, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  heroActionText: { color: colors.buttonText, fontSize: 12, fontWeight: '700' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 18, marginTop: 16 },
  quickAction: { alignItems: 'center', width: '31%' },
  quickIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 7 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginHorizontal: 18, marginTop: 30, marginBottom: 14 },
  sectionKicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sectionTitle: { color: colors.textPrimary, fontSize: 23, lineHeight: 28, fontWeight: '800', marginTop: 5, maxWidth: 310 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: 18, padding: 14, marginHorizontal: 18, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  serviceIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceCopy: { flex: 1, marginHorizontal: 12 },
  serviceTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  serviceDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
});