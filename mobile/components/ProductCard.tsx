import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../lib/types';
import { Colors } from '../constants/Colors';

interface ProductCardProps {
  product: Product;
  width?: number;
}

export default function ProductCard({ product, width }: ProductCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : undefined]}
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.7}
    >
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="cube-outline" size={32} color={Colors.textTertiary} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {product.dietary_labels && product.dietary_labels.length > 0 && (
          <View style={styles.badges}>
            {product.dietary_labels.slice(0, 2).map((label) => (
              <View key={label} style={styles.badge}>
                <Text style={styles.badgeText}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.price}>${product.price?.toFixed(2)}</Text>
          {!product.in_stock && (
            <Text style={styles.outOfStock}>Out of stock</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surfaceAlt,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  outOfStock: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.error,
  },
});
