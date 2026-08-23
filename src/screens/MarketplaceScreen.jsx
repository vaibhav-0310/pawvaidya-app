// src/screens/MarketplaceScreen.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import { fetchProducts, addToCart } from '../services/api_essentials';

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await fetchProducts();
      setProducts(data.products);
      setError(null);
    } catch (err) {
      setError('Could not load products. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

  const handleAddToCart = async (product) => {
    setAddingId(product._id);
    try {
      await addToCart(product);
      Alert.alert('Added', `${product.name} added to cart.`);
    } catch (err) {
      Alert.alert('Error', 'Could not add item to cart. Please try again.');
    } finally {
      setAddingId(null);
    }
  };

  const ListHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.tagRow}>
        <View style={styles.dot} />
        <Text style={styles.tagText}>Marketpet Essentials</Text>
      </View>

      <Text style={styles.heroText}>
        From our{'\n'}hearts to{'\n'}
        <Text style={styles.heroUnderline}>your pets</Text>
      </Text>

      <Text style={styles.subText}>Because your pets deserve the best.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onAddToCart={handleAddToCart}
              onViewDetails={(itemId) => navigation.navigate('ProductDetail', { itemId })}
              adding={addingId === item._id}
            />
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      <BottomNav navigation={navigation} activeScreen="Marketplace" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 0,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentPink,
    marginRight: 8,
  },
  tagText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  heroText: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 50,
  },
  heroUnderline: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.accentPink,
  },
  subText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorText: {
    marginTop: 12,
    color: '#C0392B',
    fontSize: 14,
  },
});