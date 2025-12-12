-- Fix infinite recursion in RLS policies
-- The issue: policies on 'profiles' table that query 'profiles' table cause infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate with a SECURITY DEFINER function to check admin status
-- This function bypasses RLS when checking the role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the policy using the function
-- Note: We combine it with the user's own profile access
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        auth.uid() = id  -- Users can always see their own profile
        OR is_admin()    -- Admins can see all profiles
    );

-- Also fix the products policy that has the same issue
DROP POLICY IF EXISTS "Admins can manage products" ON aura_products;

CREATE POLICY "Admins can manage products"
    ON aura_products FOR ALL
    USING (is_admin());

-- Fix any other policies that reference profiles table
-- Subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON aura_subscriptions;

-- Orders
DROP POLICY IF EXISTS "Admins can view all orders" ON aura_orders;

-- Recreate admin policies using the safe function
CREATE POLICY "Admins can view all subscriptions"
    ON aura_subscriptions FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can view all orders"
    ON aura_orders FOR SELECT
    USING (user_id = auth.uid() OR is_admin());
