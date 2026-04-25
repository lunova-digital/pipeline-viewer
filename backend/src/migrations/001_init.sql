CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS pipelines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#FF6600',
  category    TEXT NOT NULL DEFAULT 'gas'
                CHECK (category IN ('gas', 'oil', 'lng', 'other')),
  status      TEXT NOT NULL DEFAULT 'operational'
                CHECK (status IN ('operational', 'planned', 'under_construction', 'decommissioned')),
  countries   TEXT[] DEFAULT '{}',
  description TEXT,
  length_km   FLOAT,
  source      TEXT NOT NULL DEFAULT 'manual',
  geometry    GEOMETRY(LineString, 4326) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'compressor'
                CHECK (type IN ('compressor', 'terminal', 'valve', 'metering', 'other')),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
  description TEXT,
  source      TEXT NOT NULL DEFAULT 'manual',
  geometry    GEOMETRY(Point, 4326) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_geometry ON pipelines USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_stations_geometry  ON stations  USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_pipelines_category ON pipelines(category);
CREATE INDEX IF NOT EXISTS idx_pipelines_status   ON pipelines(status);
