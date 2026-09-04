# HealthScan & EasyPay — Complete Full-Stack UI/UX Redesign Specification

You are an expert Principal UI/UX Designer and Lead React/Tailwind Frontend Engineer. Your task is to completely redesign and build a world-class, premium, modern frontend for **HealthScan** (also known as **EasyPay / Scan & Go**).

---

## 🌟 Project Overview & Value Proposition

**HealthScan** is a dual-purpose supermarket companion app:
1. **AI Nutritionist & Food Scanner**: Users scan food barcodes with their camera. The app analyzes ingredients against their personal health conditions (Diabetes, Hypertension, Allergies, etc.), renders a dynamic 0–100 Health Score, explains harmful additives, and uses Google Gemini AI to suggest healthier alternatives.
2. **Scan & Go Queue-less Supermarket Checkout**: Users scan products in-store, add them to their digital cart, apply discount coupons, pay instantly online (UPI/Card), and get a digital security QR pass to exit without waiting in cashier lines.
3. **Security Guard Verification Portal**: Security guards at store exit gates scan customer receipt QR codes to instantly verify purchases.
4. **Store Manager Admin Dashboard**: Real-time sales analytics, revenue metrics, guard scan activity, and inventory management.

---

## 🎨 Visual Identity, Theme & Design System

### 1. Aesthetic Direction
- **Vibe**: High-end Fintech & Healthtech fusion (inspired by Apple Health, Linear, Raycast, Blinkit, and Swiggy Instamart).
- **Surfaces**: Frosted glassmorphism (`backdrop-blur-xl bg-white/80 border border-slate-200/60 shadow-sm`), clean subtle drop shadows, and soft ambient gradient backgrounds.
- **Typography**: `Inter` or `Plus Jakarta Sans`, using strong visual hierarchy with distinct font weights (Regular, Medium, Semibold, Bold).
- **Layout Behavior**: 
  - **Shopper Views**: Mobile-first centered phone shell on desktop (`max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl border-x border-slate-200/80 md:my-6 md:rounded-3xl overflow-hidden`).
  - **Guard & Admin Portals**: Full-width desktop/tablet responsive layout.

### 2. Color Palette Tokens
- **Brand Primary (Vibrant Sunset Coral)**: `#F35919` (`hover: #DF4208`, `active: #BA3006`, `tint: #FFF6F3`)
- **Health Score - Safe / Excellent (Emerald)**: `#10B981` (Score 70–100, Badge bg: `#E6F8F0`)
- **Health Score - Moderate / Caution (Amber)**: `#F59E0B` (Score 40–69, Badge bg: `#FEF3C7`)
- **Health Score - Harmful / Danger (Rose/Red)**: `#EF4444` (Score 0–39, Badge bg: `#FEE2E2`)
- **Neutrals**:
  - Background: `#F8FAFC`
  - Card: `#FFFFFF`
  - Text Primary: `#0F172A`
  - Text Secondary: `#475569`
  - Muted / Border: `#E2E8F0`

---

## 🧩 Tech Stack & Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.0",
    "lucide-react": "^0.395.0",
    "framer-motion": "^11.2.10",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "html5-qrcode": "^2.3.8",
    "@zxing/library": "^0.21.3",
    "html2canvas": "^1.4.1"
  }
}
```

---

## 📱 Detailed Screen Specifications

### 1. 🌟 Onboarding & Auth (`/welcome`, `/login`, `/register`)
- **Welcome Screen**: Engaging hero graphic, punchy tagline ("Smart Scanning. Healthier Living. Zero Queues."), feature highlight pills, and smooth "Get Started" / "I already have an account" CTA buttons.
- **Login Screen**: Clean, minimalist email & password form with show/hide password toggle, remember me checkbox, and direct link to Register.
- **Register Screen**: Full name, Date of Birth picker, email, password, and instant Member QR generation upon registration.

### 2. 🏠 Home Screen (`/`)
- **App Bar**:
  - Dynamic store location badge ("📍 HyperMarket Store #104, New Delhi" with pulsing green beacon).
  - Quick action icons: Notification bell and Cart button with live item badge counter.
- **Hero Card**: Gradient card with "Scan & Go" banner, quick shortcut button to open camera.
- **Category Filter Pills**: Horizontally scrollable chips (`All`, `🍜 Instant Food`, `🧃 Beverages`, `🍟 Snacks`, `🧈 Dairy`, `🍯 Spreads`, `🌿 Healthy Picks`).
- **Product Feed**: 2-column or 1-column responsive card feed:
  - Product emoji / picture, brand, title, and formatted price (`₹14.00`).
  - Mini health score badge with colored ring (`88/100`).
  - Interactive Add-to-Cart button that transitions into a `- 1 +` stepper when clicked.
- **Bottom Navigation Bar**: Fixed floating glassmorphic nav bar with active tab indicator:
  - 🏠 Home (`/`)
  - 🩺 Health Profile (`/profile`)
  - 📷 Scan (`/scan`) — Elevated centered floating action button
  - 🛒 Cart (`/cart`)
  - 👤 Profile (`/user`)

### 3. 📷 Barcode Scanner Screen (`/scan`)
- **Live Viewport**: Full-height camera viewfinder with a pulsating laser scanning beam, corner guide reticles, and framing instructions.
- **Floating Controls**:
  - 🔦 Flashlight / Torch toggle button.
  - 🔄 Mirror camera toggle.
  - 🖼️ "Upload Barcode Image" button (supports file input & instant decode).
  - ⌨️ "Enter Barcode Manually" option.
- **Instant Result Bottom Sheet**: Smooth slide-up sheet on successful scan:
  - Product thumbnail, name, brand, price.
  - Health score pill preview with color code.
  - Action buttons: **"View Health Analysis"** (navigates to `/health/analysis/:barcode`) and **"Add to Cart"**.

### 4. 🧬 AI Health Score & Product Deep Dive (`/health/analysis/:barcode`)
- **Hero Score Gauge**: Radial circular progress indicator with animated count-up score (0–100), accompanied by score label ("Nutrient Dense", "Moderate", "High Risk").
- **Personalized Disease Warning Cards**: Red/Orange alert boxes highlighting dangerous ingredients specifically violating user's active health profile (e.g. `⚠️ Contains High Sodium: Not recommended for Hypertension`).
- **Ingredient Inspection List**:
  - Filterable list of all ingredients tagged with badges: 🟢 Beneficial, ⚪ Neutral, 🔴 Harmful.
  - Expandable reason drawer for each ingredient (e.g. *Maida: Highly refined flour with no fiber, causes glucose spikes*).
- **Nutrition Facts Grid**: Compact macro cards (Calories, Sugar, Sodium, Protein, Saturated Fat, Carbs, Fiber).
- **🤖 Gemini AI Healthier Alternatives Carousel**:
  - AI recommendations for cleaner, healthier alternative products in the same category available in the Indian market.
  - Side-by-side comparison score cards with "Switch to this" action.

### 5. 🩺 Health Profile Manager (`/profile`)
- **Interactive Health Condition Chips**: Grid of selectable condition cards with icons:
  - `Diabetes` 🩸, `Hypertension (BP)` ❤️‍🩹, `Heart Disease` 🫀, `Gluten Allergy` 🌾, `Lactose Intolerant` 🥛, `Weight Watcher` ⚖️, `Vegan` 🌱, `Migraine` 🧠.
- Active conditions highlight in vibrant primary colors with instant sync feedback.

### 6. 🛒 Smart Cart & Checkout (`/cart`, `/checkout`)
- **Cart Screen**:
  - List of cart items with quantity steppers and swipe-to-delete.
  - Coupon Code input with "Apply" button & clickable promo chips (e.g. `HEALTH10`).
  - Transparent Price Breakdown: Items total, Discounts, 18% GST calculation, and Final Payable Amount.
  - Sticky bottom checkout bar with "Proceed to Pay" button.
- **Checkout Screen**:
  - Payment method options: Instant UPI (GPay/PhonePe), Credit/Debit Card, NetBanking, Pay at Exit.
  - Simulated 1-click checkout with secure transaction processing animation.

### 7. 🧾 Digital Receipt & Exit Pass (`/receipt/:orderId`)
- **Ticket Card Design**: Perforated coupon visual style with dashed dividers.
- **Security Exit QR Code**: Large central QR code for guard verification at exit.
- **Status Badge**: `🟢 Valid / Unscanned` or `🔒 Verified & Exited`.
- **Itemized Receipt Summary**: List of all purchased items with prices, GST, and payment reference ID.
- **Actions**: "Download Receipt" (export as image) and "Back to Home".

### 8. 📜 Order & Scan History (`/history`)
- Tabs for "Past Orders" (with View Receipt buttons) and "Scanned History".
- Clean list cards with date timestamps, total spent, and status badges.

### 9. 🛡️ Guard Verification Portal (`/guard`)
- **Access**: PIN/Password login for Store Security Guards (`guard1` / `123`).
- **Verification Scanner**: High-speed QR scanner to scan customer exit passes.
- **Result States**:
  - ✅ **APPROVED / VALID ORDER** (Emerald theme): Shows customer name, total items, timestamp, and full item checklist. One-tap "Confirm Exit" button.
  - ⚠️ **ALREADY USED / EXITED** (Amber theme): Warns that this pass was previously redeemed.
  - ❌ **INVALID PASS** (Red theme): Security warning for fraudulent QR codes.

### 10. 📊 Store Manager Admin Dashboard (`/admin`)
- **Header**: Store selector, date range picker, and quick search.
- **Metrics Grid**: Today's Revenue (`₹`), Orders Count, Active Shoppers, Health Profile Adoption Rate.
- **Charts & Graphs**: Monthly sales heatmap calendar and daily revenue trends.
- **Live Guard Activity Table**: Active guards and live exit verification counts.
- **Product Inventory Management**: Add, view, and edit store products with nutrition values, barcodes, and prices.

---

## 🚀 Execution Instructions for Redesign

1. Maintain full backward-compatibility with the existing API endpoints defined in `services/api.js`.
2. Implement seamless state management with `AuthContext` (handling user session and health conditions).
3. Ensure every button has tactile hover and tap micro-interactions using Framer Motion.
4. Provide elegant fallback states (loading spinners, empty cart illustrations, error toast alerts).
5. Ensure 100% responsiveness: flawless on mobile viewports (360px–430px) and beautifully presented on desktop.
