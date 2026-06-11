// Firebase auth middleware for server functions
// Note: For full server-side auth verification, install firebase-admin:
// npm install firebase-admin
import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const requireFirebaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error('Unauthorized: No request headers available');
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Only Bearer tokens are supported');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Unauthorized: No token provided');
    }

    // Decode the JWT token to get user ID (client-side verification)
    // For production, use firebase-admin to verify the token properly
    try {
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      
      return next({
        context: {
          userId: payload.user_id || payload.sub,
          claims: payload,
        },
      });
    } catch (error) {
      throw new Error('Unauthorized: Invalid token');
    }
  },
);
