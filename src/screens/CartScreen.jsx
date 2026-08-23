// src/screens/CartScreen.jsx
// Mirrors web app's Cart.jsx exactly — same endpoints, same field names
// (title, image, price, quantity, type, _id) since /api/cart returns raw
// cart documents, not the normalized "essentials" shape.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import api from '../services/api_essentials';

function parsePrice(price) {
  const num = typeof price === 'string' ? parseFloat(price.replace('₹', '').replace('$', '')) : parseFloat(price);
  return isNaN(num) ? 0 : num;
}

function parseQty(qty) {
  return Math.max(1, parseInt(qty, 10) || 1);
}

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + parsePrice(item.price) * parseQty(item.quantity),
    0
  );
  const totalUnits = cartItems.reduce((sum, item) => sum + parseQty(item.quantity), 0);

  const fetchCartItems = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCartItems(data);
    } catch (err) {
      if (__DEV__) console.log('Error fetching cart items:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const removeFromCart = async (itemId) => {
    setRemovingId(itemId);
    try {
      await api.delete(`/cart/${itemId}`);
      setCartItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      if (__DEV__) console.log('Error removing item:', err?.message);
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.detail}>Price: ₹{parsePrice(item.price)}</Text>
        <Text style={styles.detail}>Quantity: {parseQty(item.quantity)}</Text>
        <Text style={styles.detail}>Type: {item.type}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item._id)}
          disabled={removingId === item._id}
        >
          {removingId === item._id ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Trash2 size={16} color="#FFFFFF" />
              <Text style={styles.removeButtonText}>  Remove from Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.headerContent}>
      <Text style={styles.tagText}>🔴 Your Cart</Text>
      <Text style={styles.heroText}>Quality You Can Count On</Text>
      <Text style={styles.heroBrand}>PawVaidya</Text>
    </View>
  );

  const ListFooter = () => (
    <>
      {cartItems.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({totalUnits}):</Text>
            <Text style={styles.summaryValue}>₹ {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Total:</Text>
            <Text style={styles.summaryValueBold}>₹ {totalAmount.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => navigation?.navigate?.('Payments')}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header navigation={navigation} />
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
      <BottomNav navigation={navigation} activeScreen="Cart" />
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
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  tagText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  heroText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  heroBrand: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.accentPink,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  cardBody: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C0392B',
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 10,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkoutButton: {
    backgroundColor: colors.buttonBg,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
});