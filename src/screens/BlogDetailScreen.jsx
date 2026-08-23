import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { fetchBlogById } from '../services/api_essentials';

export default function BlogDetailScreen({ navigation, route }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const blogId = route?.params?.blogId;

  const loadPost = useCallback(async () => {
    try {
      setPost(await fetchBlogById(blogId));
    } catch (requestError) {
      setError('Could not load this article.');
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      {loading ? <View style={styles.loader}><ActivityIndicator size="large" color={colors.primaryAccent} /></View> : (
        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.error}>{error}</Text> : post ? (
            <>
              <Text style={styles.kicker}>PAWVAIDYA JOURNAL</Text>
              <Text style={styles.title}>{post.title}</Text>
              <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" />
              <Text style={styles.description}>{post.description}</Text>
            </>
          ) : <Text style={styles.error}>Article not found.</Text>}
        </ScrollView>
      )}
      <BottomNav navigation={navigation} activeScreen="Blog" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 30 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 31, lineHeight: 37, fontWeight: '800', marginTop: 9 },
  image: { width: '100%', height: 230, borderRadius: 20, marginTop: 22, backgroundColor: '#E8D5DB' },
  description: { color: colors.textSecondary, fontSize: 16, lineHeight: 26, marginTop: 22 },
  error: { color: '#C0392B', fontSize: 15, marginTop: 24 },
});