/**
 * JNJ Innovations - Centralized Form Configuration
 * 
 * Since GitHub Pages is a purely static hosting environment, standard server-side email 
 * sending is not available. To send your form submissions directly to your email 
 * (jnjinnovations1@gmail.com), we use free static-compatible email APIs:
 * 
 * OPTION 1: Web3Forms (Recommended - Free & Instant)
 * 1. Visit https://web3forms.com
 * 2. Enter your email: jnjinnovations1@gmail.com
 * 3. Copy the Access Key they instantly send to your email.
 * 4. Paste that Access Key below in the WEB3FORMS_KEY field.
 * 
 * OPTION 2: Formspree (Alternative)
 * 1. Register at https://formspree.io
 * 2. Create a form pointing to jnjinnovations1@gmail.com
 * 3. Copy the form ID (e.g., "mqkvgpez") and paste it in the FORMSPREE_ID field below.
 */

const metaEnv = (import.meta as any).env || {};

export const FORM_CONFIG = {
  // --- PASTE YOUR WEB3FORMS KEY HERE (e.g. "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6") ---
  WEB3FORMS_KEY: metaEnv.VITE_WEB3FORMS_KEY || "1a7aa321-0eaa-4ff8-992c-0cf6db0b782e",

  // --- OR PASTE YOUR FORMSPREE ID HERE (e.g. "mqkvgpez") ---
  FORMSPREE_ID: metaEnv.VITE_FORMSPREE_ID || "",

  // Fallback target email shown in helpful development tips
  TARGET_EMAIL: "jnjinnovations1@gmail.com"
};
