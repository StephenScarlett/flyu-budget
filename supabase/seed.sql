-- FLYU Orlando 2027 — Seed Data
-- Run this in Supabase SQL Editor AFTER the schema migration

-- Create the trip
INSERT INTO trips (name, group_size, num_nights, destination, trip_start, trip_end, usd_to_ttd)
VALUES ('FLYU Orlando 2027', 7, 6, 'Orlando, FL', '2027-02-01', '2027-02-07', 6.80);

-- Get the trip ID for foreign keys
DO $$
DECLARE
  trip_uuid UUID;
BEGIN
  SELECT id INTO trip_uuid FROM trips LIMIT 1;

  -- Flights
  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'flights', 'POS → MCO Round-trip', 'Caribbean Airlines / Copa / JetBlue (off-peak)', 450, 'per_person', 'all', 'Google Flights', 'https://www.google.com/travel/flights', 1);

  -- Accommodation
  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'accommodation', '4-Bed Airbnb, 6 nights', 'Kissimmee area — split among group', 1800, 'total_group', 'all', 'Airbnb', 'https://www.airbnb.com', 2);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order, is_optional)
  VALUES (trip_uuid, 'accommodation', 'Hotel alt: 4 rooms × 6 nights', 'Universal area hotels', 4200, 'total_group', 'all', 'Universal Hotels', NULL, 3, true);

  -- Tickets
  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'tickets', 'Universal 3-Day P2P + 2 Free', 'Park-to-Park access, all parks', 350, 'per_person', 'all', 'universalorlando.com', 'https://www.universalorlando.com/web/en/us/tickets-packages/park-tickets', 4);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'tickets', 'SeaWorld Orlando — 1 Day', 'Single-day admission', 85, 'per_person', 'all', 'seaworld.com', 'https://seaworld.com/orlando/tickets/', 5);

  -- Express Passes
  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'express', 'Universal Express — 1 Day', 'Skip-the-line at Universal parks', 190, 'per_person', 'premium', 'universalorlando.com', 'https://www.universalorlando.com/web/en/us/tickets-packages/express-passes', 6);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'express', 'Epic Universe Express — 1 Day', 'Express at Epic Universe (estimated)', 250, 'per_person', 'premium', 'Estimated', NULL, 7);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'express', 'SeaWorld Quick Queue', 'Skip-the-line at SeaWorld', 45, 'per_person', 'balanced,premium', 'seaworld.com', 'https://seaworld.com/orlando/tickets/', 8);

  -- Transport
  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'transport', 'Rental minivan, 7 days', 'Seats 7 — picked up at MCO', 700, 'total_group', 'all', 'Kayak', 'https://www.kayak.com/cars', 9);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'transport', 'Gas (7 days)', 'Estimated fuel cost', 140, 'total_group', 'all', 'Estimate', NULL, 10);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'transport', 'Parking at parks (3 days)', '$30/day × 3 park days', 90, 'total_group', 'all', 'Universal Parking', 'https://www.universalorlando.com/web/en/us/plan-your-visit/hours-information/directions-and-parking', 11);

  -- Food
  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'food', 'Budget: mostly groceries', 'Cook at Airbnb, minimal eating out', 200, 'per_person', 'budget', 'Estimate', NULL, 12);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'food', 'Balanced: cook + eat out', 'Mix of home-cooked and restaurant meals', 350, 'per_person', 'balanced', 'Estimate', NULL, 13);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'food', 'Premium: full dining out', 'All meals at restaurants and parks', 500, 'per_person', 'premium', 'Estimate', NULL, 14);

  -- Extras
  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'extras', 'Shopping / Souvenirs', 'Personal spending allowance', 200, 'per_person', 'all', 'Estimate', NULL, 15);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'extras', 'Optional activities', 'ICON Park, mini-golf, etc.', 50, 'per_person', 'all', 'Estimate', NULL, 16);

  INSERT INTO budget_items (trip_id, category, name, description, cost_usd, cost_type, tier, source_label, source_url, sort_order)
  VALUES (trip_uuid, 'extras', 'Travel insurance', 'Trip protection', 60, 'per_person', 'all', 'Estimate', NULL, 17);

  -- Itinerary
  INSERT INTO itinerary (trip_id, day_number, title, description, cost_note, sort_order) VALUES
  (trip_uuid, 1, 'Arrival Day', 'Fly POS → MCO. Pick up rental car. Check into Airbnb. Grocery run at Walmart/Publix.', 'Flights + car rental', 1),
  (trip_uuid, 2, 'Universal Studios', 'Full day at Universal Studios Florida. Ride everything — Hagrid''s, Velocicoaster, Mummy.', 'Tickets included in 3-Day P2P', 2),
  (trip_uuid, 3, 'Islands of Adventure', 'Full day at Islands of Adventure. Wizarding World, Hulk, Spider-Man.', 'Tickets included in 3-Day P2P', 3),
  (trip_uuid, 4, 'Epic Universe', 'Full day at Epic Universe — the new mega-park!', 'Tickets included in 3-Day P2P', 4),
  (trip_uuid, 5, 'SeaWorld Orlando', 'Full day at SeaWorld. Mako, Kraken, Ice Breaker + animal exhibits.', 'SeaWorld ticket: $85/person', 5),
  (trip_uuid, 6, 'Free Day / Shopping', 'Orlando Premium Outlets, International Drive, ICON Park, or rest day.', 'Shopping budget: ~$200/person', 6),
  (trip_uuid, 7, 'Departure Day', 'Pack up, return rental car, fly MCO → POS. Safe travels! ✈️', 'No extra costs', 7);
END $$;
