-- This script adds the `providers_keys` JSONB column to the `api_keys` table.
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS providers_keys JSONB DEFAULT '{"gemini": [], "groq": [], "replicate": [], "huggingface": []}'::jsonb;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
