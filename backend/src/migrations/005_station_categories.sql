CREATE TABLE IF NOT EXISTS station_categories (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#888888',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO station_categories (id, label, color) VALUES
  ('gas',   'Gas',   '#FF9900'),
  ('coal',  'Coal',  '#8B7355'),
  ('hydro', 'Hydro', '#0099FF'),
  ('wind',  'Wind',  '#00CC88'),
  ('none',  'None',  '#6e7681')
ON CONFLICT (id) DO NOTHING;
