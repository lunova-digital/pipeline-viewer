# Next Phase — Station Map

## Step 1 — Start the database

```bash
cd ~/github/station-map
docker-compose up db -d
```

Wait ~10 seconds for Postgres to be ready.

---

## Step 2 — Backend environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stationmap
ADMIN_KEY=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

---

## Step 3 — Start the backend

```bash
cd backend
npm install   # if not done
npm run dev
```

On first boot it will:
- Run the PostGIS migration (creates `pipelines` + `stations` tables)
- Seed 5 demo pipelines and 5 stations worldwide

Verify: `curl http://localhost:3000/health` → `{"status":"ok"}`

---

## Step 4 — Start the frontend

```bash
cd frontend
npm install   # if not done
npm run dev
```

Open: `http://localhost:5173`

You should see:
- Dark CARTO world map
- Colored pipeline lines across Europe, Asia, USA
- Station markers clustered
- Layer switcher (Dark / Satellite / Street) top-right
- Filter panel bottom-left
- Search bar top-center

---

## Step 5 — Test the admin panel

Open: `http://localhost:5173/admin`

Login with your `ADMIN_KEY` from `.env`.

**Create a pipeline:**
1. Click "+ New Pipeline"
2. Enter name + pick color
3. Paste coordinates (lng,lat per line):
   ```
   13.4050,52.5200
   14.0000,53.0000
   15.5000,54.0000
   ```
4. Watch the live preview mini-map update
5. Click "Create Pipeline" → appears on public map immediately

**Create a station:**
1. Click "+ New Station"
2. Click the map to drop a pin (or type lat/lng manually)
3. Link it to a pipeline (optional)

**Bulk CSV import:**
Upload a CSV with columns: `name,color,category,status,countries,description,coordinates`
Coordinates format: `lng,lat|lng,lat|lng,lat`

---

## Step 6 — Full Docker deploy (optional)

```bash
cd ~/github/station-map
docker-compose up --build
```

- Frontend → `http://localhost:8080`
- Backend → `http://localhost:3000`

Set `ADMIN_KEY` in environment before running:
```bash
ADMIN_KEY=your-secret docker-compose up --build
```

---

## What to customize

| Want | Where |
|------|-------|
| Change default map zoom/center | `frontend/src/pages/PublicMap.jsx` — `center` and `zoom` props on MapContainer |
| Add a pipeline category | `backend/src/migrations/001_init.sql` CHECK constraint + `FilterPanel.jsx` + `Legend.jsx` |
| Change color theme | `frontend/src/index.css` — CSS variables at `:root` |
| Change brand name | `frontend/index.html` title + `PublicMap.jsx` brand text + `AdminLayout.jsx` |
| Add more seed data | `backend/src/db.js` — `seedDemo()` function |
| Change admin key | `backend/.env` → `ADMIN_KEY` |
| Open detail panel by default | `PublicMap.jsx` — set `selectedPipeline` to a pipeline ID on load |

---

## Known issues to fix if they appear

- **Leaflet icons broken in dev** → already fixed in `main.jsx` with `L.Icon.Default.mergeOptions`
- **CORS error** → make sure `CORS_ORIGIN` in `backend/.env` matches your frontend URL
- **Map blank / tiles not loading** → tile providers (CARTO, Esri) require internet; won't work offline
- **Cluster not showing** → make sure `leaflet.markercluster` CSS is imported in `main.jsx` (already done)
