-- Allow users to insert their own role during registration
CREATE POLICY "Users can insert their own role during registration"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

-- Allow users to create their retailer profile during registration
CREATE POLICY "Users can create retailer profile during registration"
ON public.retailers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.retailers
    WHERE user_id = auth.uid()
  )
);

-- Allow users to create their wholesaler profile during registration
CREATE POLICY "Users can create wholesaler profile during registration"
ON public.wholesalers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.wholesalers
    WHERE user_id = auth.uid()
  )
);