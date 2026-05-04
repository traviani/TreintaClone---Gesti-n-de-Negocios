import React from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import Login from './pages/Login';

// Lazy load components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const POS = React.lazy(() => import('./pages/POS'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Manufacturing = React.lazy(() => import('./pages/Manufacturing'));
const Purchases = React.lazy(() => import('./pages/Purchases'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const Sales = React.lazy(() => import('./pages/Sales'));
const ReceiptPage = React.lazy(() => import('./pages/ReceiptPage'));
const AccountsReceivable = React.lazy(() => import('./pages/AccountsReceivable'));
const DemandAnalysis = React.lazy(() => import('./pages/DemandAnalysis'));

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <React.Suspense fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-italy-gradient font-sans">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium animate-pulse">Iniciando aplicación...</p>
            </div>
          </div>
        }>
          <Routes>
            {/* Public Routes - No Layout */}
            <Route path="/receipt/:id" element={<ReceiptPage />} />
            <Route path="/catalog/:ownerId" element={<Catalog />} />
            <Route path="/catalog" element={<Layout><Catalog /></Layout>} />

            {/* Direct Routes - No Auth Required */}
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
            <Route path="/pos" element={<Layout><POS /></Layout>} />
            <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
            <Route path="/customers" element={<Layout><Customers /></Layout>} />
            <Route path="/manufacturing" element={<Layout><Manufacturing /></Layout>} />
            <Route path="/purchases" element={<Layout><Purchases /></Layout>} />
            <Route path="/sales" element={<Layout><Sales /></Layout>} />
            <Route path="/receivable" element={<Layout><AccountsReceivable /></Layout>} />
            <Route path="/demand" element={<Layout><DemandAnalysis /></Layout>} />
            
            {/* Registration/Login still available if someone wants to use it */}
            <Route path="/login" element={<Login />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </AuthProvider>
  );
}
