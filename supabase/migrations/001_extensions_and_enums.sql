-- Part 1: Extensions and Enums
-- Run this first in Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'dealer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE box_size AS ENUM ('starter', 'voyager', 'bunker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dealer_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interaction_channel AS ENUM ('web', 'voice', 'sms', 'email', 'ai_bot');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE machine_status AS ENUM ('online', 'offline', 'maintenance', 'low_stock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
