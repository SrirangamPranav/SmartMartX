-- Drop policy if exists and recreate (to ensure it's created)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can update their own transactions" ON payment_transactions;
END $$;

-- Allow users to update their own payment transactions (for checkout process)
CREATE POLICY "Users can update their own transactions"
ON payment_transactions
FOR UPDATE
USING (auth.uid() = user_id);
