# Aura n8n Workflows

This directory contains the n8n workflow configurations for the Aura platform automation.

## Workflows

### 1. Order Fulfillment (`order-fulfillment.json`)

Triggered when a new order is placed. Handles:
- Order validation
- Sending order to WMS (Warehouse Management System)
- Updating order status in Supabase
- Sending confirmation email to customer
- Error handling with Slack notifications

**Trigger:** Webhook POST to `/aura-new-order`

### 2. Low Stock Alert (`low-stock-alert.json`)

Runs every 6 hours to monitor inventory levels. Handles:
- Checking inventory against reorder points
- Generating Purchase Orders
- Sending POs to suppliers via email
- Notifying team via Slack

**Trigger:** Schedule (every 6 hours)

### 3. Subscription Reminder (`subscription-reminder.json`)

Runs daily to remind subscribers to customize their upcoming box. Handles:
- Finding subscriptions due in 7 days
- Sending email reminders
- Sending SMS reminders via Twilio
- Logging interactions in omni_interaction_log

**Trigger:** Schedule (daily at 9 AM)

## Setup Instructions

### Prerequisites

1. n8n instance (self-hosted or cloud)
2. Required credentials:
   - Supabase API
   - SMTP Email
   - Twilio (for SMS)
   - Slack (for notifications)
   - WMS API

### Environment Variables

Set the following environment variables in n8n:

```env
APP_URL=https://your-aura-domain.com
WMS_API_URL=https://your-wms-api.com
SUPPLIER_EMAIL=orders@suzazon.com
```

### Importing Workflows

1. Open your n8n instance
2. Go to Workflows → Import
3. Upload each JSON file
4. Configure credentials for each node
5. Activate the workflows

### Webhook URLs

After importing, note down the webhook URLs:
- Order Fulfillment: `https://your-n8n.com/webhook/aura-new-order`

Update your application's `.env` file:
```env
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
```

## Additional Workflows (To Implement)

- **Shipment Tracking**: Listen for WMS shipment webhooks
- **Churn Prevention**: Daily analysis of at-risk customers
- **Commission Payouts**: Weekly dealer commission processing
- **Review Requests**: Post-delivery review request emails
