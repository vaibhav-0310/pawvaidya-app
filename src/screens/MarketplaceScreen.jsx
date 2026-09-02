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
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import { fetchProducts, addToCart } from '../services/api_essentials';

function MarketplaceListHeader({ searchQuery, setSearchQuery, error, hasResults, onClearSearch }) {
  return (
    <View style={styles.headerContent}>
      <Text style={styles.kicker}>PAWVAIDYA MARKETPLACE</Text>
      <Text style={styles.title}>Everything your pet needs.</Text>
      <Text style={styles.subtitle}>Thoughtfully selected essentials for healthier, happier pets.</Text>

      <View style={styles.searchBar}>
        <Search size={20} color={colors.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search essentials"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel="Search essentials"
        />
        {searchQuery ? (
          <Pressable onPress={onClearSearch} accessibilityLabel="Clear search">
            <X size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {searchQuery.trim() && !hasResults && !error ? (
        <Text style={styles.noResultsText}>No essentials match “{searchQuery.trim()}”.</Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (!normalizedQuery) return true;
    return [product.name, product.suitableFor, product.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onAddToCart={handleAddToCart}
              onViewDetails={(itemId) => navigation.navigate('ProductDetail', { itemId })}
              adding={addingId === item._id}
            />
          )}
          ListHeaderComponent={
            <MarketplaceListHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              error={error}
              hasResults={filteredProducts.length > 0}
              onClearSearch={() => setSearchQuery('')}
            />
          }
          ListEmptyComponent={
            !error && !normalizedQuery ? <Text style={styles.emptyText}>No essentials available right now.</Text> : null
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryAccent}
            />
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
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },
  kicker: {
    color: colors.accentPink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 10,
  },
  searchBar: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: colors.textPrimary,
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 0,
  },
  noResultsText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 12,
    color: '#C0392B',
    fontSize: 14,
  },
});