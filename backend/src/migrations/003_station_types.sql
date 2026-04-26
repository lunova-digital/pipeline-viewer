-- Drop restrictive CHECK constraint from stations table
ALTER TABLE stations DROP CONSTRAINT IF EXISTS stations_type_check;

-- Create station_types table
CREATE TABLE IF NOT EXISTS station_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888888',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed existing defaults into station_types
INSERT INTO station_types (id, label, color) VALUES
('compressor', 'Compressor', '#FF6600'),
('terminal', 'Terminal', '#0099FF'),
('valve', 'Valve', '#00BB44'),
('metering', 'Metering', '#AA00FF'),
('other', 'Other', '#888888')
ON CONFLICT (id) DO NOTHING;
