import { OAuth2Client } from 'google-auth-library';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
