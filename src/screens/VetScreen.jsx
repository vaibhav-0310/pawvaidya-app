import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Clock3, MapPin, ShieldCheck, Star } from 'lucide-react-native';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { fetchVets } from '../services/api_essentials';

const fallbackVets = [
  {
    _id: 'fallback-1',
    name: 'Dr. Meera Kapoor',
    specialty: 'Pet wellness & preventive care',
    experience: '8 years experience',
    rating: 4.9,
    location: 'Banjara Hills, Hyderabad',
    availability: 'Today, 4:30 PM',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: 'fallback-2',
    name: 'Dr. Arjun Nair',
    specialty: 'Dermatology & nutrition',
    experience: '11 years experience',
    rating: 4.8,
    location: 'Madhapur, Hyderabad',
    availability: 'Tomorrow, 10:00 AM',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: 'fallback-3',
    name: 'Dr. Sneha Reddy',
    specialty: 'Pediatric pet care',
    experience: '6 years experience',
    rating: 4.9,
    location: 'Gachibowli, Hyderabad',
    availability: 'Today, 7:15 PM',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=900&q=80',
  },
];

function VetCard({ vet, navigation }) {
  const avatar = vet.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80';
  const rating = typeof vet.rating === 'number' ? vet.rating : 4.8;

  return (
    <View style={styles.card}>
      <Image source={{ uri: avatar }} style={styles.image} resizeMode="cover" />
      <View style={styles.cardBody}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.name}>{vet.name || 'Veterinary specialist'}</Text>
            <Text style={styles.specialty}>{vet.specialty || 'General pet care'}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Star size={14} color="#F5B700" fill="#F5B700" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <ShieldCheck size={15} color={colors.primaryAccent} />
          <Text style={styles.metaText}>{vet.experience || 'Experienced veterinary team'}</Text>
        </View>

        <View style={styles.metaRow}>
          <MapPin size={15} color={colors.primaryAccent} />
          <Text style={styles.metaText}>{vet.location || 'At your nearest PawVaidya clinic'}</Text>
        </View>

        <View style={styles.metaRow}>
          <Clock3 size={15} color={colors.primaryAccent} />
          <Text style={styles.metaText}>{vet.availability || 'Available this week'}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.button, styles.chatButton]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('VetChat', { vet: { ...vet } })}
          >
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.callButton]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('VetCall', { vet: { ...vet } })}
          >
            <Text style={styles.buttonText}>Video call</Text>
            <ArrowRight size={16} color={colors.buttonText} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function VetScreen({ navigation }) {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadVets = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await fetchVets();
      setVets(data.length ? data : fallbackVets);
      setError(null);
    } catch (requestError) {
      setVets(fallbackVets);
      setError('Could not load vetted experts right now. Showing trusted options instead.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVets();
  }, [loadVets]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadVets(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
        </View>
      ) : (
        <FlatList
          data={vets}
          keyExtractor={(item) => item._id || item.name}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={(
            <View style={styles.heading}>
              <Text style={styles.kicker}>PAWVAIDYA VET CARE</Text>
              <Text style={styles.title}>Meet our vets</Text>
              <Text style={styles.subtitle}>Expert guidance for wellness, chronic care, and everyday concerns.</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          )}
          renderItem={({ item }) => <VetCard vet={item} navigation={navigation} />}
        />
      )}

      <BottomNav navigation={navigation} activeScreen="Vet" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heading: {
    marginBottom: 18,
  },
  kicker: {
    color: colors.accentPink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  error: {
    color: '#C0392B',
    fontSize: 14,
    marginTop: 12,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 210,
    backgroundColor: '#E9D8DF',
  },
  cardBody: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  specialty: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4D6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  ratingText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
  },
  chatButton: {
    backgroundColor: colors.primaryAccent,
  },
  callButton: {
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
});
