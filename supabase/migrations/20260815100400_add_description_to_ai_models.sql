-- Add description field to ai_models table
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ai_models.description IS 'Optional description of the AI model and its capabilities';