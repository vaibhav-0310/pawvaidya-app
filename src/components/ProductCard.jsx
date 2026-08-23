// src/components/ProductCard.jsx

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import colors from '../theme/colors';

/**
 * @param {object} product - { _id, name, price, suitableFor, imageUrl }
 * @param {function} onAddToCart - called with product._id
 * @param {boolean} adding - shows loading spinner on the button while cart request is in flight
 */
export default function ProductCard({ product, onAddToCart, onViewDetails, adding }) {
  const { name, price, suitableFor, imageUrl } = product;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onViewDetails?.(product._id)} activeOpacity={0.9}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.price}>
          Price: <Text style={styles.priceValue}>₹{price}</Text>
        </Text>
        <Text style={styles.suitable}>Suitable For: {suitableFor}</Text>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => onAddToCart(product)}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={styles.addButtonText}>Add to Cart</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    height: 180,
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  price: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    color: colors.linkBlue,
    fontWeight: '500',
  },
  suitable: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  addButton: {
    backgroundColor: colors.buttonBg,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});