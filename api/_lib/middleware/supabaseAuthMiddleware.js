import { supabase } from '../config/supabaseClient.js';

/**
 * Middleware to verify Supabase client access token.
 * Validates the token and attaches the authenticated user to the request.
 */
export const verifySupabaseUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization header.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verifies token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Supabase verification error:', err);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};
