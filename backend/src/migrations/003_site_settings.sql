CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('site_name',        'Station Map'),
  ('site_title',       'Station Map — Global Pipeline Infrastructure'),
  ('site_description', 'Interactive world map of gas pipelines and infrastructure stations worldwide.'),
  ('og_image_url',     '')
ON CONFLICT (key) DO NOTHING;
