import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Check if the caller is an Admin
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        const { data: callerProfile } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        const callerRole = callerProfile?.role;
        if (!callerRole || (callerRole !== 'admin' && callerRole !== 'staff')) {
            throw new Error("Only Administrators or Staff can create new accounts")
        }

        // Get request body
        const { email, password, full_name, phone, role = 'staff' } = await req.json()

        // Staff can only create delivery_boy accounts; admin can create any role
        if (callerRole === 'staff' && role !== 'delivery_boy') {
            throw new Error("Staff members can only create Delivery Boy accounts")
        }

        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!serviceKey) {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in the Edge Function Secrets. Please set it using the Supabase CLI.");
        }

        // We must use the SERVICE_ROLE_KEY to create a user and bypass signup limits
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceKey
        )

        // Create the User in Auth

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name,
                phone
            }
        })

        if (authError) {
            console.error("Auth creation error:", authError);
            
            // Check specifically for duplicate user
            if (authError.message?.includes("already has been registered") || 
                authError.message?.includes("already exists") ||
                (authError as any).status === 422) {
                return new Response(
                    JSON.stringify({ error: "An account with this email already exists." }),
                    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            
            throw authError;
        }

        const newUser = authData.user;
        if (newUser) {

            
            // Wait briefly for the trigger to insert the profile
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Ensure profile is updated
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ full_name, phone })
                .eq('user_id', newUser.id);

            if (profileError) {

                // Fallback: Try to upsert if update failed (though trigger should've created it)
                await supabaseAdmin.from('profiles').upsert({ 
                    user_id: newUser.id, 
                    full_name, 
                    phone 
                });
            }

            // Give them the requested role using UPSERT to handle race conditions with triggers

            const { error: roleError } = await supabaseAdmin
                .from('user_roles')
                .upsert({ user_id: newUser.id, role: role }, { onConflict: 'user_id' });

            if (roleError) {
                console.error("[DEBUG] Role assignment error (Full details):", JSON.stringify(roleError));
                throw new Error(`Role Assignment Failed: ${roleError.message}`);
            }
            

        }

        return new Response(
            JSON.stringify({ user: newUser, status: "success" }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error: any) {
        console.error("Edge function error:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 // Changed from 400 to 200 so the frontend can read the JSON error text
            }
        )
    }
});
