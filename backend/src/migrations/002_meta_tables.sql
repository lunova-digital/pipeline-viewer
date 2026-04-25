-- Drop restrictive CHECK constraints from pipelines table
ALTER TABLE pipelines DROP CONSTRAINT IF EXISTS pipelines_category_check;
ALTER TABLE pipelines DROP CONSTRAINT IF EXISTS pipelines_status_check;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888888',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create statuses table
CREATE TABLE IF NOT EXISTS statuses (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed existing defaults into categories
INSERT INTO categories (id, label, color) VALUES
('gas', 'Gas', '#FF9900'),
('oil', 'Oil', '#AA44FF'),
('lng', 'LNG', '#00CCAA'),
('other', 'Other', '#888888')
ON CONFLICT (id) DO NOTHING;

-- Seed existing defaults into statuses
INSERT INTO statuses (id, label) VALUES
('operational', 'Operational'),
('planned', 'Planned'),
('under_construction', 'Under Construction'),
('decommissioned', 'Decommissioned')
ON CONFLICT (id) DO NOTHING;
