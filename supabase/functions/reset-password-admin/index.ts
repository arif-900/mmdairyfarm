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

    // Check if the caller is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Get caller's role
    const { data: callerRoleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const callerRole = callerRoleData?.role;
    if (!callerRole || (callerRole !== 'admin' && callerRole !== 'staff')) {
      throw new Error("Only Administrators and Staff can reset passwords")
    }

    // Get request body
    const { targetUserId, newPassword } = await req.json()
    if (!targetUserId || !newPassword) throw new Error("Missing target user ID or new password")

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
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

    // Role-based logic:
    // 1. Admin can reset ANYONE.
    // 2. Staff can ONLY reset delivery boys.
    if (callerRole === 'staff' && targetRole !== 'delivery_boy') {
      throw new Error("Staff can only reset delivery boy passwords")
    }

    // Update the user's password in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (authError) throw authError

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully." }),
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
        status: 200 // Return 200 so fontend can read error message
      }
    )
  }
})
