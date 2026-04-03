import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Settings, 
  LogOut, 
  IndianRupee, 
  ShoppingCart, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Package,
  Lock,
  Users,
  ShieldAlert
} from 'lucide-react';

function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'add_product'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // View states
  const [showBillList, setShowBillList] = useState(false);
  // Form states for Add Product
  const [productInput, setProductInput] = useState('');
  const [productFormState, setProductFormState] = useState({ loading: false, error: null, success: null });

  // Admin Auth State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', error: '' });

  // Users & Guards Lists Data
  const [usersList, setUsersList] = useState([]);
  const [guardsList, setGuardsList] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);

  // Add Guard State
  const [guardForm, setGuardForm] = useState({ guard_id: '', name: '', password: '' });
  const [guardFormState, setGuardFormState] = useState({ loading: false, error: null, success: null });

  // Check sessionStorage for existing admin auth on mount
  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setIsAdminAuth(true);
    }
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (authForm.username === 'admin' && authForm.password === 'admin123') {
      setIsAdminAuth(true);
      sessionStorage.setItem('adminAuth', 'true');
      setAuthForm({ ...authForm, error: '' });
    } else {
      setAuthForm({ ...authForm, error: 'Invalid username or password' });
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuth(false);
    sessionStorage.removeItem('adminAuth');
    setAuthForm({ username: '', password: '', error: '' });
  };

  useEffect(() => {
    if (isAdminAuth && activeTab === 'dashboard') {
      fetchStats();
      // Polling every 10 seconds for real-time updates
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    } else if (isAdminAuth && activeTab === 'users') {
      fetchUsers();
    } else if (isAdminAuth && activeTab === 'guards') {
      fetchGuards();
    }
  }, [activeTab, isAdminAuth]);

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load admin stats", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setListsLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsersList(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setListsLoading(false);
    }
  };

  const fetchGuards = async () => {
    setListsLoading(true);
    try {
      const data = await api.getAdminGuards();
      setGuardsList(data.guards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setListsLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductFormState({ loading: true, error: null, success: null });
    
    try {
      let payload;
      
      // Try parsing as strict JSON first
      try {
        payload = JSON.parse(productInput);
      } catch (e) {
        // If not JSON, try parsing the weird key-value text format provided in specs
        payload = parseCustomTextFormat(productInput);
      }
      
      if (!payload.barcode) throw new Error("Barcode is missing from the parsed data");

      const result = await api.addAdminProduct(payload);
      setProductFormState({ loading: false, error: null, success: `Successfully added product ${result.barcode}` });
      setProductInput('');
    } catch (err) {
      setProductFormState({ loading: false, error: err.message, success: null });
    }
  };

  const handleGuardSubmit = async (e) => {
    e.preventDefault();
    setGuardFormState({ loading: true, error: null, success: null });
    try {
      await api.addGuard(guardForm);
      setGuardFormState({ loading: false, error: null, success: `Successfully added guard ${guardForm.name}` });
      setGuardForm({ guard_id: '', name: '', password: '' });
      fetchGuards();
    } catch (err) {
      setGuardFormState({ loading: false, error: err.message, success: null });
    }
  };

  // Helper to parse the custom text format the user might paste
  const parseCustomTextFormat = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const data = { ingredients: [], nutrition: {} };
    
    // Very rudimentary parser for the requested text format
    for (let i = 0; i < lines.length; i++) {
      let key = lines[i];
      if (key === 'barcode' || key === 'name' || key === 'brand' || key === 'category' || key === 'emoji' || key === 'price' || key === 'base_score') {
        // Skip type definition lines like 'String', 'Double', 'Int64'
        let valIndex = i + 1;
        while (valIndex < lines.length && ['String', 'Double', 'Int64', 'Array', 'Object'].includes(lines[valIndex])) {
           valIndex++;
        }
        if (valIndex < lines.length) {
            let val = lines[valIndex];
            if (key === 'price' || key === 'base_score') val = Number(val);
            data[key] = val;
            i = valIndex;
        }
      }
    }
    return data;
  };

  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-gray-bg flex items-center justify-center p-4">
        <form onSubmit={handleAdminLogin} className="w-full max-w-7xl bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col animate-fade-in relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
           
           <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 mx-auto">
             <Lock size={32} />
           </div>
           
           <h2 className="text-2xl font-black text-gray-900 text-center tracking-tight mb-2">Admin Portal</h2>
           <p className="text-sm text-gray-500 text-center font-medium mb-8">Sign in for system control</p>
           
           {authForm.error && (
             <div className="mb-4 p-3 bg-danger-bg text-danger text-xs font-bold rounded-xl text-center border border-danger/20">
               {authForm.error}
             </div>
           )}

           <div className="space-y-4 mb-8">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Username</label>
               <input 
                 type="text" 
                 required
                 value={authForm.username}
                 onChange={e => setAuthForm({...authForm, username: e.target.value})}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400"
                 placeholder="Enter admin username"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
               <input 
                 type="password" 
                 required
                 value={authForm.password}
                 onChange={e => setAuthForm({...authForm, password: e.target.value})}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400"
                 placeholder="Enter admin password"
               />
             </div>
           </div>
           
           <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary-600 active:scale-95 transition-all">
             Access Portal
           </button>
        </form>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-bg flex items-center justify-center">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] bg-gray-bg flex flex-col md:flex-row">
      
      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden bg-white px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20 shadow-sm">
         <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
               <Settings size={18} />
            </span>
            Admin Portal
         </h1>
      </div>

      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white border-t md:border-t-0 md:border-r border-gray-100 flex md:flex-col fixed md:sticky bottom-0 md:top-0 md:h-screen z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] md:shadow-none pb-safe md:pb-0">
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-gray-100 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
            <Settings size={22} />
          </div>
          <div>
             <h1 className="font-bold text-lg text-gray-900 tracking-tight leading-tight">Admin Portal</h1>
             <p className="text-xs text-gray-500 font-medium">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 flex md:flex-col gap-2 p-2 md:p-4 overflow-x-auto md:overflow-visible no-scrollbar">
          <button 
            onClick={() => { setActiveTab('dashboard'); setShowBillList(false); }}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-primary-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[11px] md:text-sm hidden md:block font-bold">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-primary-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={20} />
            <span className="text-[11px] md:text-sm hidden md:block font-bold">User Library</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('guards')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'guards' ? 'bg-primary-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ShieldAlert size={20} />
            <span className="text-[11px] md:text-sm hidden md:block font-bold">Guard Staff</span>
          </button>

          <button 
            onClick={() => setActiveTab('add_product')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 md:py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'add_product' ? 'bg-primary-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <PackagePlus size={20} />
            <span className="text-[11px] md:text-sm hidden md:block font-bold">Add Product</span>
          </button>

          <div className="md:mt-auto">
            <button 
              onClick={handleAdminLogout}
              className="w-full flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-bold text-danger hover:bg-danger-bg transition-all whitespace-nowrap"
            >
              <LogOut size={20} />
              <span className="text-[11px] md:text-sm hidden md:block font-bold">Secure Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1600px] w-full mx-auto">
        
        {error && (
            <div className="mb-6 p-4 bg-danger-bg text-danger text-sm font-bold rounded-xl border border-danger/20 flex items-center gap-2">
                <XCircle size={18} /> {error}
            </div>
        )}

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && stats && !showBillList && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Overview</h2>
                 <p className="text-gray-500 text-sm font-medium mt-1">Live store metrics and activities</p>
               </div>
               <button onClick={fetchStats} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                  <RefreshCw size={18} />
               </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {/* Revenue Card (Clickable) */}
              <button 
                onClick={() => setShowBillList(true)}
                className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col hover:border-primary/50 hover:shadow-md transition-all text-left group relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-success-bg rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="w-12 h-12 bg-success text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-success/20">
                  <IndianRupee size={24} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Revenue</p>
                <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 tracking-tight">₹{stats.today_revenue.toFixed(2)}</h3>
                <p className="text-xs text-primary font-bold mt-4 flex items-center gap-1">Tap to view all bills &rarr;</p>
              </button>

              {/* Orders Today */}
              <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col relative overflow-hidden h-full">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-50 rounded-full opacity-50"></div>
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-primary/20">
                  <ShoppingCart size={24} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Orders Today</p>
                <div className="flex-1 flex items-center">
                  <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">{stats.orders_today_count}</h3>
                </div>
                <p className="text-xs text-gray-400 font-bold mt-4">Dynamically updated</p>
              </div>

              {/* Health Insights */}
              <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col relative overflow-hidden h-full">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>
                <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                  <Activity size={24} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Health Insights</p>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">{stats.health_insights.users_with_insights}</h3>
                    <span className="text-sm font-bold text-gray-400">/ {stats.health_insights.total_users} Users</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                     <div 
                       className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                       style={{ width: `${stats.health_insights.total_users > 0 ? (stats.health_insights.users_with_insights / stats.health_insights.total_users) * 100 : 0}%`}}
                     ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Guards Section */}
              <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6 overflow-hidden flex flex-col h-[350px] md:h-[450px] lg:h-[500px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Guard Performance</h3>
                    <p className="text-xs text-gray-500 font-medium">Scans verified today</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {stats.guard_stats.length > 0 ? stats.guard_stats.map((guard, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 shadow-sm">
                          {guard.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{guard.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {guard.guard_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">{guard.scan_count}</span>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Scans</p>
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm font-bold">
                       <ShieldCheck size={32} className="mb-2 opacity-50" />
                       No guards found
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6 overflow-hidden flex flex-col h-[350px] md:h-[450px] lg:h-[500px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Active Orders Feed</h3>
                    <p className="text-xs text-gray-500 font-medium">Recent transactions</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {stats.recent_orders.length > 0 ? stats.recent_orders.map((order, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.user_name}</p>
                        <p className="text-xs font-mono text-gray-500 mt-1">#{order.order_id.slice(0,8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-sm">₹{order.total}</p>
                        {order.is_used ? (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-md">Used</span>
                        ) : (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-success-bg text-success text-[10px] font-bold uppercase tracking-widest rounded-md">Active</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm font-bold">
                       <Package size={32} className="mb-2 opacity-50" />
                       No recent orders
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Calendar View */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Monthly Calendar</h3>
                  <p className="text-xs text-gray-500 font-medium">Current month overview</p>
                </div>
                <div className="text-right text-gray-900 font-bold">
                  {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric'})}
                </div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-4 overflow-x-auto">
                {stats.calendar_stats?.map((dayStats, idx) => (
                  <div key={idx} className={`p-3 md:p-4 border rounded-xl flex flex-col justify-between h-28 md:h-32 transition-all ${dayStats.sales > 0 || dayStats.new_users > 0 ? 'bg-primary-50 border-primary/20' : 'bg-gray-50 border-gray-100'}`}>
                     <span className="text-xs font-black text-gray-500 block mb-2">{dayStats.day}</span>
                     <div>
                       {dayStats.sales > 0 && <p className="text-sm font-black text-primary tracking-tight leading-none mb-1">₹{dayStats.sales}</p>}
                       {dayStats.new_users > 0 && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white inline-block px-1.5 py-0.5 rounded-sm"> {dayStats.new_users} Users</p>}
                     </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* --- BILL LIST VIEW (Drilldown from Revenue) --- */}
        {activeTab === 'dashboard' && showBillList && stats && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setShowBillList(false)}
                 className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
               >
                 &larr; Back
               </button>
               <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Today's Bills</h2>
                  <p className="text-gray-500 text-sm font-medium mt-1">Total Revenue: <strong className="text-green-600">₹{stats.today_revenue}</strong></p>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                 {stats.recent_orders.length > 0 ? stats.recent_orders.map((order, idx) => (
                   <div key={idx} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center hover:bg-gray-50 hover:border-gray-200 transition-all">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                          <IndianRupee size={20} />
                       </div>
                       <div>
                         <p className="font-bold text-sm text-gray-900">{order.user_name}</p>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">#{order.order_id.slice(0,8).toUpperCase()}</span>
                           <span className="text-xs text-gray-400 font-bold">{order.item_count} items</span>
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-xl font-black text-gray-900">₹{order.total}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                   </div>
                 )) : (
                   <p className="text-center text-gray-500 py-10 font-bold text-sm">No bills generated today.</p>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* --- ADD PRODUCT TAB --- */}
        {activeTab === 'add_product' && (
          <div className="animate-fade-in w-full max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Add New Product</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed w-full max-w-7xl">
                Paste the product data below. The system will automatically parse standard JSON or your custom extracted text format!
              </p>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-6">
              
              <div className="bg-white p-2 rounded-[2rem] border border-gray-200 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                <textarea 
                  required
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  placeholder="Paste JSON or structured text here..."
                  className="w-full h-[250px] sm:h-[300px] md:h-[400px] p-3 md:p-4 bg-transparent resize-none outline-none text-sm font-mono text-gray-700 leading-relaxed CustomScrollbar placeholder:text-gray-300"
                ></textarea>
              </div>

              {productFormState.error && (
                <div className="p-4 bg-danger-bg text-danger font-bold text-sm rounded-2xl flex items-start gap-3 border border-danger/20">
                  <XCircle size={20} className="shrink-0" />
                  <span className="leading-snug">{productFormState.error}</span>
                </div>
              )}

              {productFormState.success && (
                <div className="p-4 bg-success-bg text-success font-bold text-sm rounded-2xl flex items-center gap-3 border border-success/30 shadow-md shadow-success/10">
                  <CheckCircle2 size={20} className="shrink-0" />
                  {productFormState.success}
                </div>
              )}

              <button 
                type="submit"
                disabled={productFormState.loading || !productInput.trim()}
                className="w-full bg-primary hover:bg-primary-600 active:scale-95 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:active:scale-100 transition-all"
              >
                {productFormState.loading ? <RefreshCw className="animate-spin" /> : <><PackagePlus size={22} /> Ingest Product Data</>}
              </button>
            </form>
          </div>
        )}

        {/* --- USERS LIST TAB --- */}
        {activeTab === 'users' && (
          <div className="animate-fade-in w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[500px]">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Registered Users</h2>
              <p className="text-gray-500 text-sm font-medium mt-2">Currently displaying all customer records.</p>
            </div>
            
            {listsLoading ? (
              <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-primary" size={32} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-medium text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="pb-4 pt-2 px-4 uppercase tracking-wider text-xs font-bold">Full Name</th>
                      <th className="pb-4 pt-2 px-4 uppercase tracking-wider text-xs font-bold">Email Address</th>
                      <th className="pb-4 pt-2 px-4 uppercase tracking-wider text-xs font-bold text-center">Purchases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length > 0 ? usersList.map((u, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 border-l-[3px] border-transparent hover:border-primary font-bold">
                          {u.full_name || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-gray-500">{u.email}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${u.purchase_count > 0 ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                            {u.purchase_count} {u.purchase_count === 1 ? 'order' : 'orders'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                       <tr><td colSpan="3" className="py-12 text-center text-gray-400">No users found in database.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- GUARDS LIST TAB --- */}
        {activeTab === 'guards' && (
          <div className="animate-fade-in space-y-6">
            <div className="w-full max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Security Staff Directory</h2>
                  <p className="text-gray-500 text-sm font-medium mt-2">Review current guard credentials used for physical verification.</p>
                </div>
              </div>
              
              {listsLoading ? (
                <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-primary" size={32} /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {guardsList.length > 0 ? guardsList.map((g, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group bg-gray-50 cursor-default">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight">{g.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1 opacity-70">
                           <span className="text-[10px] uppercase font-black tracking-wider text-gray-500">ID:</span>
                           <code className="text-xs text-primary font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200">{g.guard_id}</code>
                        </div>
                      </div>
                    </div>
                  )) : (
                     <div className="col-span-full py-12 text-center text-gray-400">No registered security guards.</div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="mb-8">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Add New Guard</h2>
                  <p className="text-gray-500 text-sm font-medium mt-2">Create new credentials to give verify-access to a guard.</p>
              </div>

              <form onSubmit={handleGuardSubmit} className="space-y-4">
                 {guardFormState.error && (
                  <div className="p-4 bg-danger-bg text-danger font-bold text-sm rounded-2xl flex items-start gap-3 border border-danger/20">
                    <XCircle size={20} className="shrink-0" />
                    <span className="leading-snug">{guardFormState.error}</span>
                  </div>
                 )}

                 {guardFormState.success && (
                  <div className="p-4 bg-success-bg text-success font-bold text-sm rounded-2xl flex items-center gap-3 border border-success/30 shadow-md shadow-success/10">
                    <CheckCircle2 size={20} className="shrink-0" />
                    {guardFormState.success}
                  </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Guard Name</label>
                      <input 
                        type="text" 
                        required
                        value={guardForm.name}
                        onChange={e => setGuardForm({...guardForm, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 text-sm"
                        placeholder="e.g. Ramesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Guard ID</label>
                      <input 
                        type="text" 
                        required
                        value={guardForm.guard_id}
                        onChange={e => setGuardForm({...guardForm, guard_id: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 text-sm"
                        placeholder="e.g. guard12"
                      />
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                    <input 
                      type="password" 
                      required
                      value={guardForm.password}
                      onChange={e => setGuardForm({...guardForm, password: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 text-sm"
                      placeholder="Assign a secure password"
                    />
                 </div>

                 <button 
                  type="submit"
                  disabled={guardFormState.loading || !guardForm.name || !guardForm.guard_id || !guardForm.password}
                  className="w-full mt-4 bg-primary hover:bg-primary-600 active:scale-95 text-white py-4 rounded-xl font-bold text-md flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:active:scale-100 transition-all"
                 >
                  {guardFormState.loading ? <RefreshCw className="animate-spin" /> : <><ShieldCheck size={20} /> Register Guard</>}
                 </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboardScreen;
