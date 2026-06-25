import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token for admin routes.
 * Decodes the token and attaches admin info to the request object.
 */
export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authentication header provided.' });
  }

  // Handle both "Bearer <token>" and just "<token>" cases
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // Will contain { username: 'admin' }
    next();
  } catch (ex) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
