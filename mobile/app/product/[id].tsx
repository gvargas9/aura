import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { Product } from '../../lib/types';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const data = await api.get<{ product: Product }>(`/api/products/${id}`);
      setProduct(data.product || null);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={64} color={Colors.textTertiary} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>${product.price?.toFixed(2)}</Text>
        </View>

        {/* Dietary badges */}
        {product.dietary_labels && product.dietary_labels.length > 0 && (
          <View style={styles.badges}>
            {product.dietary_labels.map((label) => (
              <View key={label} style={styles.badge}>
                <Text style={styles.badgeText}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          {product.shelf_life_days && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.detailText}>
                Shelf life: {product.shelf_life_days} days
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons
              name={product.in_stock ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={18}
              color={product.in_stock ? Colors.success : Colors.error}
            />
            <Text
              style={[
                styles.detailText,
                { color: product.in_stock ? Colors.success : Colors.error },
              ]}
            >
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {product.allergens && product.allergens.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="warning-outline" size={18} color={Colors.warning} />
              <Text style={styles.detailText}>
                Allergens: {product.allergens.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Add to box button */}
        <TouchableOpacity
          style={[styles.addButton, !product.in_stock && styles.addButtonDisabled]}
          disabled={!product.in_stock}
        >
          <Ionicons name="cube-outline" size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Add to Box</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  image: {
    width: width,
    height: width * 0.75,
    backgroundColor: Colors.surfaceAlt,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
