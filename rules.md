# HealthScan — Agent Rules (Django + React Full-Stack)

## Architecture Rules

- Backend and frontend are completely separate — two different folders, two different servers
- Frontend NEVER calls Gemini API directly — all AI calls proxy through Django backend
- Django backend handles ALL business logic: scoring, disease mapping, Gemini calls
- Frontend only handles UI rendering, barcode scanning, and calling Django REST endpoints
- CORS must be configured correctly so Vite (port 5173) can call Django (port 8000)

## Django Rules

- Use Django REST Framework (DRF) for all API endpoints — never use plain Django views for JSON
- Use `python-dotenv` to load `.env` — never hardcode secrets in `settings.py`
- Use Django ORM for all database operations — never write raw SQL
- Run `makemigrations` and `migrate` every time models change
- Use the `seed_products.py` management command to populate the database — never insert data manually
- All API endpoints must return proper HTTP status codes (200, 201, 404, 400, 500)
- Wrap all Gemini calls in try/except — return a 200 with `{"alternatives": [], "error": "message"}` on failure, never a 500

## Frontend Rules

- All API calls go through `src/services/api.js` — never write fetch() calls directly in components
- Use `import.meta.env.VITE_API_URL` for the backend URL — never hardcode `localhost:8000`
- Always handle loading, error, and empty states in every component that calls an API
- Do NOT use localStorage, sessionStorage, or Redux
- Mobile-first always: design for 375px wide screens first
- All tap targets must be minimum 44×44px
- Use Tailwind only for styling — no inline style objects except for SVG animation values

## Barcode Scanner Rules

- Use `@zxing/library` npm package for live camera barcode scanning
- On successful scan, call `api.getProductByBarcode(barcode)` immediately
- If product not found (404), show helper modal with all supported barcodes listed
- Clean up camera stream on component unmount using useEffect cleanup function

## Security Rules

- Gemini API key lives ONLY in `backend/.env` as `GEMINI_API_KEY`
- Frontend `.env` only contains `VITE_API_URL` — nothing sensitive
- Never log the Gemini API key anywhere in the codebase
- In production: set `CORS_ALLOWED_ORIGINS = False` and specify exact allowed origins

## Testing Checklist

- [ ] `python manage.py seed_products` runs without errors and creates 13 products
- [ ] `GET /api/products/` returns all 13 products
- [ ] `GET /api/products/barcode/8901030865213/` returns Maggi noodles with all ingredients
- [ ] `POST /api/score/` with Maggi + `["diabetes","hypertension"]` returns score lower than with `[]`
- [ ] `POST /api/warnings/` returns triggered warnings with correct ingredient references
- [ ] `POST /api/alternatives/` returns 3 AI-generated alternatives as valid JSON
- [ ] Frontend scanner activates camera and scans barcodes
- [ ] Frontend shows different scores for different user health profiles
- [ ] Frontend disease warnings highlight user's own triggered conditions
- [ ] All 6 screens render correctly on 375px mobile viewport
- [ ] All animations run smoothly (score ring, ingredient pills, screen transitions)
- [ ] No CORS errors in browser console
