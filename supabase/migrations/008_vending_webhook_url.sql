-- Add webhook_url column to vending_machines for outbound push notifications
ALTER TABLE vending_machines ADD COLUMN IF NOT EXISTS webhook_url TEXT;
