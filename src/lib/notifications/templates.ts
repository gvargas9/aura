export interface NotificationTemplate {
  subject: string;
  body: string;
  channel: "email" | "sms" | "web";
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  ORDER_CONFIRMATION: {
    subject: "Order {{order_number}} Confirmed",
    body: "Hi {{customer_name}}, your order #{{order_number}} has been confirmed! We're preparing your Aura box with {{item_count}} items. Total: {{total}}. You'll receive a shipping notification once it's on its way.",
    channel: "email",
  },
  ORDER_SHIPPED: {
    subject: "Your order is on its way!",
    body: "Great news, {{customer_name}}! Your order #{{order_number}} has shipped. Track your delivery here: {{tracking_url}}. Estimated delivery: {{estimated_delivery}}.",
    channel: "email",
  },
  DELIVERY_CONFIRMED: {
    subject: "",
    body: "Your Aura box has been delivered! Order #{{order_number}} was dropped off at {{delivery_address}}. Enjoy your meals!",
    channel: "sms",
  },
  SUBSCRIPTION_REMINDER: {
    subject: "Time to customize your next box",
    body: "Hi {{customer_name}}, your next Aura {{box_size}} box ships on {{next_delivery_date}}. You have until {{cutoff_date}} to customize your selections. Log in to pick your favorites before we auto-fill your box.",
    channel: "email",
  },
  PAYMENT_FAILED: {
    subject: "Payment issue with your subscription",
    body: "Hi {{customer_name}}, we were unable to process your payment of {{amount}} for your {{box_size}} subscription. Please update your payment method to avoid any interruption in service. We'll retry in {{retry_days}} days.",
    channel: "email",
  },
  WELCOME_EMAIL: {
    subject: "Welcome to Aura!",
    body: "Welcome aboard, {{customer_name}}! We're thrilled to have you join the Aura family. Start building your first box by browsing our curated selection of premium meals. Your taste preferences and dietary needs are our top priority.",
    channel: "email",
  },
  DEALER_APPLICATION: {
    subject: "New dealer application received",
    body: "A new dealer application has been submitted by {{applicant_name}} ({{applicant_email}}) from {{organization_name}}. Please review the application in your admin dashboard.",
    channel: "email",
  },
  COMMISSION_EARNED: {
    subject: "You earned a commission!",
    body: "Congrats, {{dealer_name}}! You earned a {{commission_amount}} commission from order #{{order_number}} placed by a referred customer. Your total pending balance is now {{pending_balance}}.",
    channel: "email",
  },
  LOW_STOCK_ALERT: {
    subject: "Low stock alert",
    body: "Product \"{{product_name}}\" (SKU: {{sku}}) is running low with only {{current_stock}} units remaining. Safety stock level is {{safety_stock}}. Please reorder to avoid stockouts.",
    channel: "email",
  },
} as const;

/**
 * Replace {{variable}} placeholders in a template with provided values.
 */
export function renderTemplate(
  templateKey: keyof typeof NOTIFICATION_TEMPLATES,
  variables: Record<string, string>
): { subject: string; body: string; channel: string } {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Notification template "${String(templateKey)}" not found`);
  }

  const replacePlaceholders = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  };

  return {
    subject: replacePlaceholders(template.subject),
    body: replacePlaceholders(template.body),
    channel: template.channel,
  };
}
