-- FLYU Orlando 2027 — Initial Schema
-- Run this in Supabase SQL Editor

-- Trip configuration
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'FLYU Orlando 2027',
  group_size INT NOT NULL DEFAULT 7,
  num_nights INT NOT NULL DEFAULT 6,
  destination TEXT NOT NULL DEFAULT 'Orlando, FL',
  trip_start DATE DEFAULT '2027-02-01',
  trip_end DATE DEFAULT '2027-02-07',
  usd_to_ttd NUMERIC(6,2) NOT NULL DEFAULT 6.80,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Group members (used later when auth is added)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  auth_user_id UUID,
  is_single BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Budget line items (the core editable data)
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_type TEXT NOT NULL DEFAULT 'per_person',
  tier TEXT NOT NULL DEFAULT 'all',
  source_label TEXT,
  source_url TEXT,
  sort_order INT DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itinerary days
CREATE TABLE itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cost_note TEXT,
  sort_order INT DEFAULT 0
);

-- Change log (who changed what — used later with auth)
CREATE TABLE change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE budget_items;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary;
