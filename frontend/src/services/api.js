const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Ensure it ends with /api even if the user forgot it in Vercel settings
    const cleanUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return `http://${window.location.hostname}:8000/api`;
};

const BASE_URL = getBaseUrl();

export const api = {
  // Products
  async getProducts() {
    const res = await fetch(`${BASE_URL}/products/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  },

  async getProductByBarcode(barcode) {
    const res = await fetch(`${BASE_URL}/products/barcode/${barcode}/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  },

  // Health analysis
  async calculateScore(barcode, conditions) {
    const res = await fetch(`${BASE_URL}/score/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, conditions }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Score calculation failed");
    return res.json();
  },

  async getWarnings(barcode, conditions) {
    const res = await fetch(`${BASE_URL}/warnings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, conditions }),
      credentials: "include",
    });
    return res.json();
  },

  async getAlternatives(barcode, conditions, currentScore) {
    const res = await fetch(`${BASE_URL}/alternatives/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barcode,
        conditions,
        current_score: currentScore,
      }),
      credentials: "include",
    });
    return res.json();
  },

  // --- Cart ---
  async getCart(userEmail = null) {
    const url = userEmail
      ? `${BASE_URL}/cart/?user_email=${userEmail}`
      : `${BASE_URL}/cart/`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch cart");
    return res.json();
  },

  async addToCart(barcode, quantity = 1, userEmail = null) {
    const res = await fetch(`${BASE_URL}/cart/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, quantity, user_email: userEmail }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to add to cart");
    return res.json();
  },

  async updateCartItem(barcode, quantity, userEmail = null) {
    const res = await fetch(`${BASE_URL}/cart/update/${barcode}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, user_email: userEmail }),
      credentials: "include",
    });
    return res.json();
  },

  async removeCartItem(barcode, userEmail = null) {
    const url = userEmail
      ? `${BASE_URL}/cart/remove/${barcode}/?user_email=${userEmail}`
      : `${BASE_URL}/cart/remove/${barcode}/`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });
    return res.json();
  },

  async clearCart(userEmail = null) {
    const res = await fetch(`${BASE_URL}/cart/clear/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: userEmail }),
      credentials: "include",
    });
    return res.json();
  },

  // --- Checkout ---
  async validateCoupon(code, userEmail = null) {
    const res = await fetch(`${BASE_URL}/coupon/validate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, user_email: userEmail }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Invalid coupon");
    return res.json();
  },

  async createOrder(couponCode = null, userEmail = null) {
    const res = await fetch(`${BASE_URL}/order/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon_code: couponCode, user_email: userEmail }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Checkout failed");
    return res.json();
  },

  async getOrders(userEmail = null) {
    const url = userEmail
      ? `${BASE_URL}/order/history/?user_email=${userEmail}`
      : `${BASE_URL}/order/history/`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch order history");
    return res.json();
  },

  async getOrder(orderId) {
    const res = await fetch(`${BASE_URL}/order/${orderId}/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Order not found");
    return res.json();
  },

  // --- Guard Verification ---
  async guardLogin(guardId, password) {
    const res = await fetch(`${BASE_URL}/guard/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guard_id: guardId, password }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Invalid Guard ID or Password");
    return res.json();
  },

  async getGuardScanCount(guardId) {
    const res = await fetch(`${BASE_URL}/guard/stats/${guardId}/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch scan count");
    return res.json();
  },

  async getGuardOrders() {
    const res = await fetch(`${BASE_URL}/guard/orders/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch guard orders");
    return res.json();
  },

  async guardVerifyOrder(orderId, guardId) {
    const res = await fetch(
      `${BASE_URL}/guard/verify/${orderId}/?guard_id=${guardId}`,
      { credentials: "include" },
    );
    if (!res.ok) throw new Error("Verification failed");
    return res.json();
  },

  async confirmGuardOrder(orderId, guardId) {
    const res = await fetch(
      `${BASE_URL}/guard/confirm/${orderId}/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guard_id: guardId }),
        credentials: "include"
      }
    );
    if (!res.ok) throw new Error("Confirmation failed");
    return res.json();
  },

  // --- User Auth & Profile ---
  async register(userData) {
    const res = await fetch(`${BASE_URL}/user/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Registration failed");
    }
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${BASE_URL}/user/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    return res.json();
  },

  async getHealthProfile(email) {
    const res = await fetch(`${BASE_URL}/user/health-profile/${email}/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch health profile");
    return res.json();
  },

  async updateHealthProfile(email, healthConditions) {
    const res = await fetch(`${BASE_URL}/user/health-profile/${email}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ health_conditions: healthConditions }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to update health profile");
    return res.json();
  },

  async updateUserProfile(email, profileData) {
    const res = await fetch(`${BASE_URL}/user/profile-update/${email}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },

  // --- Admin Portal ---
  async getAdminStats() {
    const res = await fetch(`${BASE_URL}/admin/stats/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch admin statistics");
    return res.json();
  },

  async addAdminProduct(productData) {
    const res = await fetch(`${BASE_URL}/admin/product/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
      credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add product");
    }
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${BASE_URL}/admin/users/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },
  
  async getAdminGuards() {
    const res = await fetch(`${BASE_URL}/admin/guards/`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch guards");
    return res.json();
  },

  async addGuard(guardData) {
    const res = await fetch(`${BASE_URL}/admin/guard/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guardData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to add guard");
    }
    return res.json();
  }
};
