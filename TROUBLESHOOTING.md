# Order Button Troubleshooting Guide

## Issues Fixed:

1. **JWT Verification**: Enabled proper JWT verification in Supabase edge functions
2. **Authentication Flow**: Fixed authentication verification in edge functions
3. **Error Handling**: Added comprehensive error handling and logging
4. **Debug Component**: Added debug information for development

## Common Issues and Solutions:

### 1. Button Not Clickable
- **Check**: User is logged in
- **Check**: All required fields are filled
- **Check**: Mobile number is valid (10 digits)
- **Check**: Address is within delivery range

### 2. Payment Gateway Not Loading
- **Check**: Razorpay script is loaded (check browser console)
- **Check**: Internet connection is stable
- **Solution**: Refresh the page if script fails to load

### 3. Order Creation Fails
- **Check**: Supabase environment variables are set correctly
- **Check**: Edge functions are deployed and running
- **Check**: Database tables exist and are accessible

### 4. Environment Variables Required:

#### Frontend (.env):
```
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
```

#### Supabase Edge Functions:
```
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### 5. Testing Steps:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try placing an order
4. Check for any error messages
5. Use the debug component (bottom right in development mode)

### 6. Database Requirements:

Make sure these tables exist in Supabase:
- `profiles` (user profiles)
- `products` (product catalog)
- `orders` (order records)
- `order_items` (order line items)

### 7. Edge Function Deployment:

Deploy the edge functions using:
```bash
supabase functions deploy create-checkout
supabase functions deploy verify-payment
```

## Next Steps:

1. Check browser console for errors
2. Verify all environment variables are set
3. Test with both COD and online payment methods
4. Check Supabase dashboard for function logs