import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { fetchBlogs } from '../services/api_essentials';

function BlogCard({ post, onPress }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{post.title}</Text>
        <Text style={styles.description} numberOfLines={4}>{post.description}</Text>
        <Text style={styles.readLabel} onPress={onPress}>READ ARTICLE  {'->'}</Text>
      </View>
    </View>
  );
}

export default function BlogScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadBlogs = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setPosts(await fetchBlogs());
      setError(null);
    } catch (requestError) {
      setError('Could not load articles. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const refresh = () => {
    setRefreshing(true);
    loadBlogs(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.primaryAccent} /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <BlogCard post={item} onPress={() => navigation.navigate('BlogDetail', { blogId: item._id })} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={(
            <View style={styles.heading}>
              <Text style={styles.kicker}>THE PAWVAIDYA JOURNAL</Text>
              <Text style={styles.title}>Better care starts with knowing more.</Text>
              <Text style={styles.subtitle}>Practical guidance for healthier, happier pets.</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          )}
          ListEmptyComponent={!error ? <Text style={styles.empty}>No articles available yet.</Text> : null}
        />
      )}
      <BottomNav navigation={navigation} activeScreen="Blog" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 18, paddingBottom: 24 },
  heading: { marginBottom: 22 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 30, lineHeight: 35, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 10 },
  error: { color: '#C0392B', fontSize: 14, marginTop: 12 },
  card: { backgroundColor: colors.cardBg, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16 },
  image: { width: '100%', height: 190, backgroundColor: '#E8D5DB' },
  cardBody: { padding: 16 },
  cardTitle: { color: colors.textPrimary, fontSize: 20, lineHeight: 25, fontWeight: '800' },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 9 },
  readLabel: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 15 },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 28 },
});