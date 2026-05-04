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
  Sparkles,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../lib/firebase';
import { cn, getGoogleDriveDirectLink } from '../lib/utils';
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
  { id: 'catalog', label: 'Catálogo', path: '/catalog', icon: Share2 },
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

  return (
    <div className="min-h-screen bg-italy-gradient flex flex-col md:flex-row">
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center p-1 overflow-hidden border border-slate-100">
            <img 
              src={getGoogleDriveDirectLink('https://drive.google.com/file/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5/view?usp=sharing')} 
              alt="Logo" 
              className="h-full w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-lg font-bold text-slate-900 italic tracking-tighter">Traviani Sales</h1>
        </div>
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
              "fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50 print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.05)]",
              "transition-all duration-300 transform",
              isMobileMenuOpen ? "translate-x-0" : "hidden md:flex"
            )}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center p-1.5 overflow-hidden border border-slate-100">
                  <img 
                    src={getGoogleDriveDirectLink('https://drive.google.com/file/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5/view?usp=sharing')} 
                    alt="Logo" 
                    className="h-full w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 italic tracking-tighter leading-none">Traviani Sales</h1>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-[0.1em] font-black">Inversiones Traviani C.A.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
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
                        ? "bg-slate-900 text-white font-medium shadow-lg shadow-slate-100" 
                        : "text-slate-600 hover:bg-slate-100 border border-transparent"
                    )}
                  >
                    <item.icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              {user ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                      T
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">Empresa Traviani</p>
                      <p className="text-xs text-slate-500 truncate">Modo Público</p>
                    </div>
                  </div>
                  <Link 
                    to="/login"
                    className="flex items-center gap-3 w-full px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all rounded-xl border border-transparent hover:border-slate-200"
                  >
                    <Sparkles size={20} />
                    <span>Iniciar Sesión</span>
                  </Link>
                </>
              )}
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
          className="fixed inset-0 bg-black/20 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
