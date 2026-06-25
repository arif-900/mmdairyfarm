# Manual Deployment Instructions

Since the Supabase CLI isn't authenticated, you need to:

## Option 1: Deploy via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/appfoaocrpebvkpeyobv
2. Navigate to Edge Functions
3. Create/update the functions manually by copying the code

## Option 2: Set up Supabase CLI
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref appfoaocrpebvkpeyobv`
4. Deploy: `supabase functions deploy create-checkout`

## Option 3: Test Locally First
1. Run the debug script in browser console (debug-order.js)
2. Check what specific error you get
3. The button should work for COD orders even without Razorpay

## Environment Variables Needed
Set these in Supabase Dashboard > Settings > Environment Variables:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET  
- SUPABASE_SERVICE_ROLE_KEY

## Quick Test
1. Make sure you're logged in
2. Try placing a COD order first (doesn't need Razorpay)
3. Check browser console for errors