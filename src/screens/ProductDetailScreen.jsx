import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, ShoppingCart, XCircle } from 'lucide-react-native';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { addToCart, fetchProductById } from '../services/api_essentials';

export default function ProductDetailScreen({ navigation, route }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const itemId = route?.params?.itemId;

  const loadProduct = useCallback(async () => {
    try {
      setProduct(await fetchProductById(itemId));
    } catch (requestError) {
      setError('Could not load this product.');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      for (let count = 0; count < quantity; count += 1) await addToCart(product);
      setFeedback({ type: 'success', text: `${product.name} added to cart.` });
      setTimeout(() => setFeedback(null), 3500);
    } catch (requestError) {
      setFeedback({ type: 'error', text: 'Could not add item to cart. Please try again.' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      {loading ? <View style={styles.loader}><ActivityIndicator size="large" color={colors.primaryAccent} /></View> : (
        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.error}>{error}</Text> : product ? (
            <>
              <View style={styles.categoryBadge}><Text style={styles.categoryText}>{product.suitableFor || 'Pet care'}</Text></View>
              <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
              <Text style={styles.title}>{product.name}</Text>
              <Text style={styles.rating}>{'★'.repeat(5)} <Text style={styles.ratingDetail}>{product.rating || '4.5'} / 5  ·  {product.reviews || 'Trusted by pet parents'}</Text></Text>
              <Text style={styles.price}>₹{product.price}</Text>
              <Text style={styles.descriptionTitle}>Product description</Text>
              <Text style={styles.detail}>{product.description || `A carefully selected essential suitable for ${product.suitableFor || 'your pet'}.`}</Text>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity((value) => Math.max(1, value - 1))}><Text style={styles.quantityButtonText}>-</Text></TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity((value) => value + 1)}><Text style={styles.quantityButtonText}>+</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={adding}>
                {adding ? <ActivityIndicator color={colors.buttonText} /> : <Text style={styles.buttonText}>Add to cart</Text>}
              </TouchableOpacity>
            </>
          ) : <Text style={styles.error}>Product not found.</Text>}
        </ScrollView>
      )}
      {feedback ? (
        <View style={styles.feedbackBanner}>
          {feedback.type === 'success' ? <CheckCircle size={21} color="#257A49" /> : <XCircle size={21} color="#A13737" />}
          <Text style={styles.feedbackText}>{feedback.text}</Text>
          {feedback.type === 'success' ? (
            <Pressable style={styles.feedbackAction} onPress={() => navigation.navigate('Cart')}>
              <ShoppingCart size={16} color={colors.primaryDark} />
              <Text style={styles.feedbackActionText}>View cart</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <BottomNav navigation={navigation} activeScreen="Marketplace" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 30 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#7764E8', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 8 },
  categoryText: { color: colors.buttonText, fontSize: 14, fontWeight: '700' },
  image: { width: '100%', height: 260, borderRadius: 20, marginTop: 14, backgroundColor: '#E8D5DB' },
  title: { color: colors.textPrimary, fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 20 },
  rating: { color: '#FFB800', fontSize: 18, marginTop: 10 },
  ratingDetail: { color: colors.textSecondary, fontSize: 13 },
  price: { color: '#20A64A', fontSize: 28, fontWeight: '800', marginTop: 14 },
  descriptionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 25 },
  detail: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 8 },
  quantityLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 20 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  quantityButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  quantityButtonText: { color: colors.primaryDark, fontSize: 24, lineHeight: 26 },
  quantityValue: { width: 56, textAlign: 'center', color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  button: { backgroundColor: colors.buttonBg, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, marginTop: 26 },
  buttonText: { color: colors.buttonText, fontSize: 16, fontWeight: '700' },
  error: { color: '#C0392B', fontSize: 15, marginTop: 24 },
  feedbackBanner: { position: 'absolute', left: 16, right: 16, bottom: 76, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 13, shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  feedbackText: { flex: 1, color: colors.textPrimary, fontSize: 13, marginHorizontal: 9 },
  feedbackAction: { flexDirection: 'row', alignItems: 'center', gap: 5, borderLeftWidth: 1, borderLeftColor: colors.cardBorder, paddingLeft: 10 },
  feedbackActionText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
});