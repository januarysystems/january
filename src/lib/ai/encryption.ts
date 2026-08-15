/**
 * API Key Encryption Service
 *
 * Server-side only - handles secure encryption/decryption of API keys
 * Uses Supabase's pgcrypto extension for AES-256-GCM encryption
 */

import { supabaseAdminAdmin } from "@/integrations/supabaseAdmin/client.server";

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "january-default-key-change-in-production";
const ENCRYPTION_KEY_LENGTH = 32; // AES-256

/**
 * Pad or truncate key to exactly 32 bytes for AES-256
 */
function normalizeKey(key: string): Buffer {
  const buffer = Buffer.alloc(32);
  const keyBuffer = Buffer.from(key, 'utf-8');

  if (keyBuffer.length >= 32) {
    keyBuffer.copy(buffer, 0, 0, 32);
  } else {
    keyBuffer.copy(buffer);
  }

  return buffer;
}

/**
 * Encrypt an API key using AES-256-GCM
 * Returns { encrypted, iv, tag }
 */
export async function encryptApiKey(apiKey: string): Promise<{
  encrypted: string;
  iv: string;
  tag: string;
}> {
  try {
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convert API key to buffer
    const keyData = new TextEncoder().encode(apiKey);

    // Normalize encryption key
    const encryptionKey = normalizeKey(ENCRYPTION_KEY);

    // Import key for Web Crypto API
    const key = await crypto.subtle.importKey(
      'raw',
      encryptionKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      keyData
    );

    // Extract encrypted data and authentication tag
    const encryptedBuffer = new Uint8Array(encrypted);
    const encryptedData = encryptedBuffer.slice(0, -16);
    const tag = encryptedBuffer.slice(-16);

    return {
      encrypted: Buffer.from(encryptedData).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      tag: Buffer.from(tag).toString('base64'),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt an API key using AES-256-GCM
 */
export async function decryptApiKey(
  encrypted: string,
  iv: string,
  tag: string
): Promise<string> {
  try {
    // Convert from base64
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');

    // Combine encrypted data and tag
    const combinedBuffer = new Uint8Array(encryptedBuffer.length + tagBuffer.length);
    combinedBuffer.set(encryptedBuffer);
    combinedBuffer.set(tagBuffer, encryptedBuffer.length);

    // Normalize encryption key
    const encryptionKey = normalizeKey(ENCRYPTION_KEY);

    // Import key for Web Crypto API
    const key = await crypto.subtle.importKey(
      'raw',
      encryptionKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      combinedBuffer
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Get decrypted API key for a model
 * Returns null if no custom key is set
 */
export async function getModelApiKey(modelId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_models')
      .select('api_key_encrypted, api_key_iv, api_key_tag, has_custom_key')
      .eq('id', modelId)
      .single();

    if (error || !data) {
      return null;
    }

    if (!data.has_custom_key || !data.api_key_encrypted) {
      return null;
    }

    return await decryptApiKey(
      data.api_key_encrypted,
      data.api_key_iv || '',
      data.api_key_tag || ''
    );
  } catch (error) {
    console.error('Error getting model API key:', error);
    return null;
  }
}

/**
 * Store encrypted API key for a model
 */
export async function storeModelApiKey(
  modelId: string,
  apiKey: string
): Promise<void> {
  try {
    const encrypted = await encryptApiKey(apiKey);

    const { error } = await supabaseAdmin
      .from('ai_models')
      .update({
        api_key_encrypted: encrypted.encrypted,
        api_key_iv: encrypted.iv,
        api_key_tag: encrypted.tag,
        has_custom_key: true,
      })
      .eq('id', modelId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error storing model API key:', error);
    throw new Error('Failed to store API key');
  }
}

/**
 * Remove API key from a model
 */
export async function removeModelApiKey(modelId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_models')
      .update({
        api_key_encrypted: null,
        api_key_iv: null,
        api_key_tag: null,
        has_custom_key: false,
      })
      .eq('id', modelId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error removing model API key:', error);
    throw new Error('Failed to remove API key');
  }
}
