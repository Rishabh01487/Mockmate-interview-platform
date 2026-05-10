// ════════════════════════════════════════════════════════════
//  API Configuration
//  Dev:  VITE_API_URL is empty → relative paths → Vite proxy
//  Prod: VITE_API_URL = https://your-backend.onrender.com
// ════════════════════════════════════════════════════════════
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
