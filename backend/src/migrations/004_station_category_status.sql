ALTER TABLE stations ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS status   TEXT;

CREATE INDEX IF NOT EXISTS idx_stations_category ON stations(category);
CREATE INDEX IF NOT EXISTS idx_stations_status   ON stations(status);
