import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5001;
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';
// Retell AI configuration - set these in your environment (recommended)
export const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
// Base URL for Retell API; leave default but override if Retell changes their domain
export const RETELL_BASE_URL = process.env.RETELL_BASE_URL || 'https://api.retell.ai';
// Auth scheme used when contacting Retell. Common values: 'Bearer' or '' (empty for x-api-key header)
export const RETELL_AUTH_SCHEME = process.env.RETELL_AUTH_SCHEME || 'Bearer';
