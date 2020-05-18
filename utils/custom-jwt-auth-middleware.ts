import JWTAuthMiddleware, {
  EncryptionAlgorithms,
} from 'middy-middleware-jwt-auth';

export const CustomJWTAuthMiddleware = () =>
  JWTAuthMiddleware({
    algorithm: EncryptionAlgorithms.RS256,
    credentialsRequired: true,
    secretOrPublicKey: process.env.AUTH0_CLIENT_PUBLIC_KEY,
  });
