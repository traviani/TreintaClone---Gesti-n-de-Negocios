import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  LogOut,
  Menu,
  X,
  Loader,
  Truck,
  HandCoins,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { id: 'dashboard', label: 'Tablero', path: '/', icon: LayoutDashboard },
  { id: 'pos', label: 'Ventas (POS)', path: '/pos', icon: ShoppingCart },
  { id: 'sales', label: 'Historial de Ventas', path: '/sales', icon: Receipt },
  { id: 'inventory', label: 'Inventario', path: '/inventory', icon: Package },
  { id: 'manufacturing', label: 'Producción / Recetas', path: '/manufacturing', icon: Loader },
  { id: 'purchases', label: 'Compras / Abastecimiento', path: '/purchases', icon: Truck },
  { id: 'expenses', label: 'Gastos', path: '/expenses', icon: Receipt },
  { id: 'receivable', label: 'Cuentas por Cobrar', path: '/receivable', icon: HandCoins },
  { id: 'customers', label: 'Clientes / Fiados', path: '/customers', icon: Users },
  { id: 'demand', label: 'Análisis IA', path: '/demand', icon: Sparkles },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 print:hidden">
        <h1 className="text-xl font-bold text-blue-600 italic tracking-tighter">Traviani Sales</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <AnimatePresence>
        {(isMobileMenuOpen || !window.matchMedia('(max-width: 768px)').matches) && (
          <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            className={cn(
              "fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40 print:hidden",
              "transition-all duration-300 transform",
              isMobileMenuOpen ? "translate-x-0" : "hidden md:flex"
            )}
          >
            <div className="p-6 hidden md:block">
              <h1 className="text-2xl font-black text-blue-600 italic tracking-tighter">Traviani Sales</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-black text-center mt-4">Inversiones Traviani C.A.</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-blue-50 text-blue-600 font-medium" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <item.icon size={20} className={isActive ? "text-blue-600" : "text-slate-400"} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3 px-4 py-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  {user.photoURL && <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
