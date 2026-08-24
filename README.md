# EasyPay 🛒

EasyPay is a full-stack AI-powered Scan & Go supermarket app. Customers scan product barcodes with their phone, build a digital cart, pay instantly via Razorpay, and exit with a digital QR pass — no cashier, no queue. Includes an AI health analysis layer powered by Google Gemini.

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
MONGODB_URL=mongodb+srv/<user>:<password>@cluster.mongodb.net/easypay_db
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

- **Scan & Go Checkout**: Scan products in-store, pay via Razorpay, and exit with a digital QR receipt — zero queues.
- **Guard Verification Portal**: Security guards scan customer exit QR codes to verify purchases at the gate.
- **Admin Dashboard**: Real-time sales analytics, revenue tracking, guard activity, and inventory management.
- **AI Health Analysis**: Personalized 0–100 health score per product based on your medical conditions (Diabetes, BP, etc.).
- **Google Gemini Alternatives**: AI-suggested healthier product alternatives in the Indian market.
- **Auto-Import Engine**: Automatically fetches product data from OpenFoodFacts for unknown barcodes.
- **Cloud-Native Architecture**: MongoDB Atlas for scalable, high-performance data storage.

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Django 6.x, Django REST Framework.
- **Payments**: Razorpay (UPI, Card, NetBanking).
- **Database**: MongoDB Atlas (NoSQL Cloud).
- **AI**: Google Gemini Pro (Generative AI).
- **Scanner**: @zxing/library for barcode detection.

## 📦 Database Seeding (Optional)

To populate your database with some initial sample products:

```bash
python manage.py seed_products
```

---

_Built for the Razorpay Buildathon 2026. Developed with ❤️ by Ritik Jangra._
