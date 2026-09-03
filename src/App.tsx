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
const Promotions = React.lazy(() => import('./pages/Promotions'));

function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isClientSession = typeof window !== 'undefined' && sessionStorage.getItem('traviani_client_mode') === 'true';

  // If a client entered through a public catalog link and attempts to open internal administrative routes
  if (isClientSession && !user) {
    const catalogPath = sessionStorage.getItem('traviani_catalog_link') || '/catalog/public_traviani';
    return <Navigate to={catalogPath} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <React.Suspense fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-app-background font-sans">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium animate-pulse">Iniciando aplicación...</p>
            </div>
          </div>
        }>
          <Routes>
            {/* Public Standalone Routes - No Layout & No Admin Navigation */}
            <Route path="/receipt/:id" element={<ReceiptPage />} />
            <Route path="/catalog/:ownerId" element={<Catalog />} />

            {/* Internal Admin Routes - Protected with Layout and Access Guard */}
            <Route path="/catalog" element={<AdminRouteGuard><Layout><Catalog /></Layout></AdminRouteGuard>} />
            <Route path="/" element={<AdminRouteGuard><Layout><Dashboard /></Layout></AdminRouteGuard>} />
            <Route path="/inventory" element={<AdminRouteGuard><Layout><Inventory /></Layout></AdminRouteGuard>} />
            <Route path="/pos" element={<AdminRouteGuard><Layout><POS /></Layout></AdminRouteGuard>} />
            <Route path="/expenses" element={<AdminRouteGuard><Layout><Expenses /></Layout></AdminRouteGuard>} />
            <Route path="/customers" element={<AdminRouteGuard><Layout><Customers /></Layout></AdminRouteGuard>} />
            <Route path="/manufacturing" element={<AdminRouteGuard><Layout><Manufacturing /></Layout></AdminRouteGuard>} />
            <Route path="/purchases" element={<AdminRouteGuard><Layout><Purchases /></Layout></AdminRouteGuard>} />
            <Route path="/sales" element={<AdminRouteGuard><Layout><Sales /></Layout></AdminRouteGuard>} />
            <Route path="/receivable" element={<AdminRouteGuard><Layout><AccountsReceivable /></Layout></AdminRouteGuard>} />
            <Route path="/demand" element={<AdminRouteGuard><Layout><DemandAnalysis /></Layout></AdminRouteGuard>} />
            <Route path="/promotions" element={<AdminRouteGuard><Layout><Promotions /></Layout></AdminRouteGuard>} />
            
            {/* Registration/Login */}
            <Route path="/login" element={<Login />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </AuthProvider>
  );
}
