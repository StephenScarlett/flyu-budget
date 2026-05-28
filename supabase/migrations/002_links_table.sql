-- Links / Booking Resources
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'link',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE links;

-- Seed with default links
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'Google Flights', 'https://www.google.com/travel/flights', 'plane', 0 FROM trips LIMIT 1;
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'Airbnb Orlando / Kissimmee', 'https://www.airbnb.com', 'home', 1 FROM trips LIMIT 1;
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'Universal Orlando Tickets', 'https://www.universalorlando.com/web/en/us/tickets-packages/park-tickets', 'ticket', 2 FROM trips LIMIT 1;
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'Universal Express Passes', 'https://www.universalorlando.com/web/en/us/tickets-packages/express-passes', 'zap', 3 FROM trips LIMIT 1;
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'SeaWorld Orlando Tickets', 'https://seaworld.com/orlando/tickets/', 'ticket', 4 FROM trips LIMIT 1;
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'Kayak Rental Cars', 'https://www.kayak.com/cars', 'car', 5 FROM trips LIMIT 1;
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'Costco Travel', 'https://www.costcotravel.com', 'shopping-cart', 6 FROM trips LIMIT 1;
INSERT INTO links (trip_id, label, url, icon_name, sort_order)
SELECT id, 'Universal Parking Info', 'https://www.universalorlando.com/web/en/us/plan-your-visit/hours-information/directions-and-parking', 'car', 7 FROM trips LIMIT 1;
