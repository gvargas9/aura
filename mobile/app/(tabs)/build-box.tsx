import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Product, BoxTier, BOX_TIERS } from '../../lib/types';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function BuildBoxScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTier, setSelectedTier] = useState<BoxTier>('starter');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubscription, setIsSubscription] = useState(true);
  const [loading, setLoading] = useState(true);

  const tier = BOX_TIERS[selectedTier];
  const slotsUsed = selectedProducts.length;
  const slotsRemaining = tier.slots - slotsUsed;
  const price = isSubscription ? tier.subscriptionPrice : tier.oneTimePrice;

  useEffect(() => {
    fetchProducts();
    loadSavedConfig();
  }, []);

  async function fetchProducts() {
    try {
      const data = await api.get<{ products: Product[] }>('/api/products');
      setProducts(data.products || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function loadSavedConfig() {
    const saved = await storage.get<{ tier: BoxTier; products: string[] }>(
      STORAGE_KEYS.BOX_CONFIG
    );
    if (saved) {
      setSelectedTier(saved.tier);
      setSelectedProducts(saved.products);
    }
  }

  const toggleProduct = useCallback(
    (productId: string) => {
      setSelectedProducts((prev) => {
        if (prev.includes(productId)) {
          const next = prev.filter((id) => id !== productId);
          storage.set(STORAGE_KEYS.BOX_CONFIG, { tier: selectedTier, products: next });
          return next;
        }
        if (prev.length >= tier.slots) {
          Alert.alert('Box Full', `Your ${tier.name} box can hold ${tier.slots} items.`);
          return prev;
        }
        const next = [...prev, productId];
        storage.set(STORAGE_KEYS.BOX_CONFIG, { tier: selectedTier, products: next });
        return next;
      });
    },
    [selectedTier, tier]
  );

  function changeTier(newTier: BoxTier) {
    const newSlots = BOX_TIERS[newTier].slots;
    const trimmed = selectedProducts.slice(0, newSlots);
    setSelectedTier(newTier);
    setSelectedProducts(trimmed);
    storage.set(STORAGE_KEYS.BOX_CONFIG, { tier: newTier, products: trimmed });
  }

  function handleCheckout() {
    if (selectedProducts.length === 0) {
      Alert.alert('Empty Box', 'Please add some products to your box first.');
      return;
    }
    Alert.alert(
      'Checkout',
      `Your ${tier.name} box with ${slotsUsed} items for $${price.toFixed(2)}${isSubscription ? '/mo' : ''}\n\nCheckout will be available soon!`
    );
  }

  const renderProduct = ({ item }: { item: Product }) => {
    const isSelected = selectedProducts.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.productItem, isSelected && styles.productItemSelected]}
        onPress={() => toggleProduct(item.id)}
        activeOpacity={0.7}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="cube-outline" size={24} color={Colors.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>${item.price?.toFixed(2)}</Text>
        </View>
        <View
          style={[
            styles.checkCircle,
            isSelected && styles.checkCircleSelected,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={Colors.white} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Tier selector */}
            <View style={styles.tierSelector}>
              {(Object.keys(BOX_TIERS) as BoxTier[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tierChip,
                    selectedTier === t && styles.tierChipActive,
                  ]}
                  onPress={() => changeTier(t)}
                >
                  <Text
                    style={[
                      styles.tierChipText,
                      selectedTier === t && styles.tierChipTextActive,
                    ]}
                  >
                    {BOX_TIERS[t].name}
                  </Text>
                  <Text
                    style={[
                      styles.tierSlots,
                      selectedTier === t && styles.tierSlotsActive,
                    ]}
                  >
                    {BOX_TIERS[t].slots} items
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subscription toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, isSubscription && styles.toggleBtnActive]}
                onPress={() => setIsSubscription(true)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isSubscription && styles.toggleTextActive,
                  ]}
                >
                  Subscribe & Save {tier.savings}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isSubscription && styles.toggleBtnActive]}
                onPress={() => setIsSubscription(false)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !isSubscription && styles.toggleTextActive,
                  ]}
                >
                  One-Time
                </Text>
              </TouchableOpacity>
            </View>

            {/* Slot counter */}
            <View style={styles.slotCounter}>
              <Text style={styles.slotText}>
                {slotsUsed} / {tier.slots} slots filled
              </Text>
              <View style={styles.slotBar}>
                <View
                  style={[
                    styles.slotBarFill,
                    { width: `${(slotsUsed / tier.slots) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Choose Products</Text>
          </View>
        }
      />

      {/* Bottom checkout bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>
            ${price.toFixed(2)}
            {isSubscription ? '/mo' : ''}
          </Text>
          <Text style={styles.bottomSlots}>
            {slotsRemaining > 0
              ? `${slotsRemaining} slots remaining`
              : 'Box is full'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            selectedProducts.length === 0 && styles.checkoutBtnDisabled,
          ]}
          onPress={handleCheckout}
          disabled={selectedProducts.length === 0}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  tierSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tierChip: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  tierChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tierChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tierChipTextActive: {
    color: Colors.primaryDark,
  },
  tierSlots: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  tierSlotsActive: {
    color: Colors.primaryDark,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  slotCounter: {
    marginBottom: 20,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  slotBar: {
    height: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  slotBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  productPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  bottomSlots: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutBtnDisabled: {
    opacity: 0.5,
  },
  checkoutText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
