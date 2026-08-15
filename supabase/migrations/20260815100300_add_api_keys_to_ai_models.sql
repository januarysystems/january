-- Add API key storage to ai_models table
-- API keys are encrypted at rest using Supabase's pgcrypto extension

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted API key column
ALTER TABLE ai_models
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS api_key_iv TEXT,
ADD COLUMN IF NOT EXISTS api_key_tag TEXT,
ADD COLUMN IF NOT EXISTS has_custom_key BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN ai_models.api_key_encrypted IS 'Encrypted API key stored using AES-256-GCM encryption';
COMMENT ON COLUMN ai_models.api_key_iv IS 'Initialization vector for API key decryption';
COMMENT ON COLUMN ai_models.api_key_tag IS 'Authentication tag for GCM mode verification';
COMMENT ON COLUMN ai_models.has_custom_key IS 'Flag indicating if this model has a custom API key configured';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
CREATE INDEX IF NOT EXISTS idx_ai_models_user_status ON ai_models(user_id, status);

-- RLS Policy: Users can only access their own API keys
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "own_ai_models" ON ai_models;

-- Create policy for users to manage their own models (including API keys)
CREATE POLICY "own_ai_models"
ON ai_models
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
