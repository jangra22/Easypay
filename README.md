# HealthScan 🥗

HealthScan is a full-stack AI-powered application designed to help users analyze food products based on their personalized health profiles. It provides deep ingredient analysis, health scoring, and AI-driven healthier alternatives.

## 🚀 Quick Start

### 1. Backend Setup (Django)

Navigate to the backend directory and set up the Python environment:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
GEMINI_API_KEY=your-google-gemini-api-key
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/healthscan_db
```

**Run Migrations & Start Server:**

```bash
python manage.py makemigrations api
python manage.py migrate
python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000`.

---

### 2. Frontend Setup (React + Vite)

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## ✨ Key Features

- **Personalized Health Scoring**: Enter your health conditions (e.g., Diabetes, Hypertension) to get a tailormade health score for every product.
- **Instant Barcode Scanning**: Use your camera to scan product barcodes in real-time, now with **Mirror Mode** and **Image Upload**.
- **Auto-Import Engine**: Automatically fetches and creates product data from **OpenFoodFacts** if not already in the database.
- **AI Healthier Alternatives**: Powered by **Google Gemini**, suggests better food choices available in the Indian market.
- **Cloud-Native Architecture**: Fully migrated to **MongoDB Atlas** for scalable, high-performance data storage.
- **Fully Responsive Dashboard**: A premium look on desktop with a multi-column dashboard, while remaining perfectly functional on mobile.

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Django 6.x, Django REST Framework.
- **Database**: MongoDB Atlas (NoSQL Cloud).
- **AI**: Google Gemini Pro (Generative AI).
- **Scanner**: @zxing/library for barcode detection.

## 📦 Database Seeding (Optional)

To populate your database with some initial sample products:

```bash
python manage.py seed_products
```

---

_Developed with ❤️ for Health and Transparency._
