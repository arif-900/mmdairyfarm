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

    if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'staff')) {
      throw new Error("Only Administrators and Staff can delete accounts")
    }

    // Get request body
    const { targetUserId } = await req.json()
    if (!targetUserId) throw new Error("Missing target user ID")

    // Protect self-deletion
    if (targetUserId === user.id) throw new Error("Cannot delete your own account")

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in the Edge Function Secrets.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey
    )

    // Check target user's role
    const { data: targetRoleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single()
    
    const targetRole = targetRoleData?.role

    // Staff can ONLY delete delivery boys
    if (callerProfile.role === 'staff' && targetRole !== 'delivery_boy') {
      throw new Error("Staff can only delete delivery boy accounts")
    }

    // Clean up linked data to prevent foreign key issues
    // The profiles table has a CASCADE rule often, but let's be safe
    await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", targetUserId);

    // Completely permanently delete their underlying Auth token
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (authError) throw authError

    return new Response(
      JSON.stringify({ success: true, message: "User completely removed." }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
