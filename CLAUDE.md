# Station-Map — Global Gas & Pipeline Map Platform

## What This Is

A fullscreen interactive world map of gas pipelines and infrastructure stations.
Admins create named, color-coded pipeline lines and station markers via a protected
admin panel. The public map supports satellite, dark, and OSM tile layers.

## Stack

- **Frontend**: React 19 + Vite + react-leaflet 5 + leaflet.markercluster
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 16 + PostGIS 3.4
- **Deploy**: Docker Compose

## Running Locally

```bash
# Start database only (then run backend/frontend manually)
docker-compose up db

# Backend (in backend/)
npm install && npm run dev   # runs on :3000

# Frontend (in frontend/)
npm install && npm run dev   # runs on :5173

# Full stack via Docker
docker-compose up --build
```

## Environment

Copy `.env.example` to `backend/.env` and `frontend/.env.local`.

## Key Decisions

- Admin auth: single `x-admin-key` request header checked against `ADMIN_KEY` env var
- Coordinates stored as PostGIS `GEOMETRY(LineString, 4326)` (pipelines) and `GEOMETRY(Point, 4326)` (stations)
- Frontend fetches pipelines on every map `moveend` using current bbox + zoom for simplification
- Default map layer: CARTO Dark Matter

## API Base URL

`/api/v1` — public read routes (no auth), `/api/v1/admin` — write routes (require x-admin-key)

## Coordinate Input Formats (admin)

The backend accepts coordinates in any of these formats:
1. Newline-separated pairs: `lng,lat` per line
2. Flat comma list: `lng,lat,lng,lat,...`
3. Pipe-separated: `lng,lat|lng,lat|...` (used in CSV bulk import)

Auto-detects and corrects lat/lng swap (common user mistake).
