import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Product } from '../../lib/types';
import { Colors } from '../../constants/Colors';
import ProductCard from '../../components/ProductCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get<{ products: Product[] }>('/api/products?limit=10');
      setProducts(data.products || []);
    } catch {
      // Silently fail — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Curated for You</Text>
            <Text style={styles.heroSubtitle}>
              Premium survival food, delivered monthly
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/build-box')}
            >
              <Text style={styles.ctaText}>Build Your Box</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No products available</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ProductCard product={item} width={CARD_WIDTH} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hero: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.primaryDark,
    opacity: 0.8,
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
