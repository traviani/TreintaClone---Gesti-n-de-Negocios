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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Cargando...</p>
      </div>
    </div>
  );

  if (!user) return <Login />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <React.Suspense fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-slate-50 font-sans">
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

            {/* Protected Routes - With Layout */}
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute><Layout><POS /></Layout></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
            <Route path="/manufacturing" element={<ProtectedRoute><Layout><Manufacturing /></Layout></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><Layout><Purchases /></Layout></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />
            <Route path="/receivable" element={<ProtectedRoute><Layout><AccountsReceivable /></Layout></ProtectedRoute>} />
            <Route path="/demand" element={<ProtectedRoute><Layout><DemandAnalysis /></Layout></ProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </AuthProvider>
  );
}
