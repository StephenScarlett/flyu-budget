-- Add phone, notes, and is_active to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_included to budget_items (default true = counts toward trip)
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS is_included BOOLEAN DEFAULT true;

-- Enable realtime for members
ALTER PUBLICATION supabase_realtime ADD TABLE members;
