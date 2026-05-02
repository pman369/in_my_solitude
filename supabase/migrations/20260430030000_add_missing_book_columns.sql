-- Add missing columns to books table to align with bulk import scripts and planned features
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS download_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS publish_date TEXT;

-- Update existing rows with defaults
UPDATE books SET download_enabled = TRUE WHERE download_enabled IS NULL;
UPDATE books SET language = 'English' WHERE language IS NULL;
