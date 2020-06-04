import mongoose from 'mongoose';

interface GoogleCredentials {
  refresh_token?: string | null;
  expiry_date?: number | null;
  access_token?: string | null;
  token_type?: string | null;
  id_token?: string | null;
}

export interface ITokens {
  email: string;
  googleTokens: GoogleCredentials;
}

const TokensSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  googleTokens: {
    type: Object,
    required: true,
  },
});

(global as any).Tokens =
  (global as any).Tokens || mongoose.model('Tokens', TokensSchema);

export const Tokens = (global as any).Tokens as mongoose.Model<any>;
