import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BoxTier, BOX_TIERS } from '../lib/types';
import { Colors } from '../constants/Colors';

interface BoxBuilderProps {
  selectedTier: BoxTier;
  selectedCount: number;
  isSubscription: boolean;
  onCheckout: () => void;
}

export default function BoxBuilder({
  selectedTier,
  selectedCount,
  isSubscription,
  onCheckout,
}: BoxBuilderProps) {
  const tier = BOX_TIERS[selectedTier];
  const price = isSubscription ? tier.subscriptionPrice : tier.oneTimePrice;
  const slotsRemaining = tier.slots - selectedCount;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.tierName}>{tier.name} Box</Text>
        <Text style={styles.price}>
          ${price.toFixed(2)}
          {isSubscription ? '/mo' : ''}
        </Text>
        <Text style={styles.slots}>
          {slotsRemaining > 0
            ? `${slotsRemaining} slots remaining`
            : 'Box is full'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, selectedCount === 0 && styles.buttonDisabled]}
        onPress={onCheckout}
        disabled={selectedCount === 0}
      >
        <Ionicons name="cart-outline" size={20} color={Colors.white} />
        <Text style={styles.buttonText}>Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  info: {},
  tierName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  slots: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
