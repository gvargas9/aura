"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Plus,
  Minus,
  X,
  Ticket,
  Package,
  Truck,
  Tag,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface OrderItem {
  product: Product;
  quantity: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  promoCode?: string;
  onApplyPromo?: (code: string) => void;
  discount?: number;
  isLoading?: boolean;
  className?: string;
}

export function OrderSummary({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  promoCode,
  onApplyPromo,
  discount = 0,
  isLoading = false,
  className,
}: OrderSummaryProps) {
  const [promoInput, setPromoInput] = useState("");

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountAmount = subtotal * (discount / 100);
  const shipping = 0; // Free shipping
  const total = subtotal - discountAmount + shipping;

  const handleApplyPromo = () => {
    if (promoInput.trim() && onApplyPromo) {
      onApplyPromo(promoInput.trim());
    }
  };

  return (
    <div className={cn("order-summary", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">My Order</h3>
        <span className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? "position" : "positions"}
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-4 mb-6 max-h-80 overflow-y-auto scrollbar-thin pr-2">
        {items.map((item) => (
          <OrderItemCard
            key={item.product.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemoveItem}
          />
        ))}

        {items.length === 0 && (
          <div className="py-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Your box is empty</p>
            <p className="text-sm text-gray-400">Add items to get started</p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          {/* Promo Code Section */}
          <div className="mb-6">
            <div className="divider-text mb-4">PROMOCODE</div>
            {promoCode ? (
              <div className="flex items-center justify-between px-4 py-3 bg-aura-light rounded-xl">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-aura-primary" />
                  <span className="font-medium text-aura-primary">
                    {promoCode}
                  </span>
                </div>
                <button
                  onClick={() => onApplyPromo?.("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/20 outline-none"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoInput.trim()}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Order Totals */}
          <div className="space-y-3 py-4 border-t border-dashed border-gray-200">
            {discount > 0 && (
              <div className="flex items-center justify-between text-aura-primary">
                <span>DISCOUNT</span>
                <span className="font-medium">-{discount}%</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                DELIVERY
              </span>
              <span className="font-medium text-aura-primary">FREE</span>
            </div>
            <div className="flex items-center justify-between text-lg pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-900">TOTAL</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            disabled={isLoading || items.length === 0}
            className="w-full btn-accent py-4 text-lg mt-4"
          >
            {isLoading ? "Processing..." : "Confirm Order"}
          </button>
        </>
      )}
    </div>
  );
}

// Individual Order Item Card
interface OrderItemCardProps {
  item: OrderItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function OrderItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: OrderItemCardProps) {
  const { product, quantity } = item;

  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-xl group animate-scale">
      {/* Product Image */}
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-gray-900 truncate pr-2">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500">
              {product.short_description || "380g"}
            </p>
          </div>
          <button
            onClick={() => onRemove(product.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-aura-accent font-semibold">
            {formatCurrency(product.price)}
          </span>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1 bg-white rounded-full border border-gray-200">
            <button
              onClick={() =>
                onUpdateQuantity(product.id, Math.max(0, quantity - 1))
              }
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simpler version for box builder
interface BoxOrderSummaryProps {
  boxSize: string;
  selectedProducts: Product[];
  boxPrice: number;
  onAuraFill: () => void;
  onCheckout: () => void;
  isComplete: boolean;
  isLoading?: boolean;
  className?: string;
}

export function BoxOrderSummary({
  boxSize,
  selectedProducts,
  boxPrice,
  onAuraFill,
  onCheckout,
  isComplete,
  isLoading = false,
  className,
}: BoxOrderSummaryProps) {
  const itemsValue = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const savings = itemsValue > boxPrice ? itemsValue - boxPrice : 0;

  return (
    <div className={cn("order-summary", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
        <span className="badge badge-primary capitalize">{boxSize}</span>
      </div>

      {/* Summary Lines */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Items Value</span>
          <span>{formatCurrency(itemsValue)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Box Price</span>
          <span className="font-medium text-aura-primary">
            {formatCurrency(boxPrice)}
          </span>
        </div>
        {savings > 0 && (
          <div className="flex justify-between text-green-600">
            <span>You Save</span>
            <span className="font-medium">{formatCurrency(savings)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Shipping
          </span>
          <span className="text-aura-primary font-medium">FREE</span>
        </div>
      </div>

      <div className="flex justify-between py-4 border-t border-gray-100">
        <span className="font-bold text-lg">Monthly Total</span>
        <span className="font-bold text-xl text-aura-primary">
          {formatCurrency(boxPrice)}
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-3 mt-4">
        {!isComplete && (
          <button
            onClick={onAuraFill}
            className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
          >
            <Ticket className="w-5 h-5" />
            Let Aura Fill My Box
          </button>
        )}
        <button
          onClick={onCheckout}
          disabled={!isComplete || isLoading}
          className="w-full btn-accent py-3.5 text-lg"
        >
          {isLoading
            ? "Processing..."
            : isComplete
            ? "Continue to Checkout"
            : "Complete Your Box First"}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Cancel or modify anytime. Free shipping on all boxes.
      </p>
    </div>
  );
}
