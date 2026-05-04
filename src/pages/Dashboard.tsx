import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { 
  Link
} from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Share2,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  Package,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'amber';
  trend?: { value: number; isUp: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colors = {
    blue: 'bg-slate-50 text-slate-900 border-slate-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("p-4 rounded-3xl border bg-white card-depth flex flex-col justify-between", colors[color])}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-xl", colors[color].split(' ')[0])}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={cn("flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full", trend.isUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
            {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-medium text-slate-500 mb-0.5 uppercase tracking-wider">{title}</p>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{formatCurrency(value)}</h3>
      </div>
    </motion.div>
  );
};

// Helper to use cn in this file
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const { user, effectiveUid } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const monthStart = startOfMonth(new Date());

  useEffect(() => {
    const salesQuery = query(
      collection(db, 'sales'),
      where('ownerId', '==', effectiveUid)
    );

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('ownerId', '==', effectiveUid)
    );

    const purchasesQuery = query(
      collection(db, 'purchases'),
      where('ownerId', '==', effectiveUid)
    );

    const customersQuery = query(
      collection(db, 'customers'),
      where('ownerId', '==', effectiveUid)
    );

    const productsQuery = query(
      collection(db, 'products'),
      where('ownerId', '==', effectiveUid)
    );

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));

    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'expenses'));

    const unsubPurchases = onSnapshot(purchasesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPurchases(data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'purchases'));

    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    return () => {
      unsubSales();
      unsubExpenses();
      unsubPurchases();
      unsubCustomers();
      unsubProducts();
    };
  }, [effectiveUid]);

  const currentMonthSales = sales.filter(s => {
    const date = s.createdAt?.toDate?.() || new Date();
    return date >= monthStart;
  });

  const currentMonthExpenses = expenses.filter(e => {
    const date = e.createdAt?.toDate?.() || new Date();
    return date >= monthStart;
  });

  const totalSalesAmount = currentMonthSales.reduce((acc, sale) => acc + (Number(sale.total) || 0), 0);
  const totalExpensesAmount = currentMonthExpenses.reduce((acc, expense) => acc + (Number(expense.amount) || 0), 0);
  const totalDebts = customers.reduce((acc, customer) => acc + (Number(customer.balance) || 0), 0);
  const lowStockCount = products.filter(p => Number(p.stock || 0) <= (Number(p.lowStockThreshold) || 5)).length;
  
  // Calculate inventory value at cost, ignoring negative stocks
  const totalInventoryValue = products.reduce((acc, p) => {
    const stock = Math.max(0, Number(p.stock || 0));
    const cost = Number(p.cost || 0);
    return acc + (stock * cost);
  }, 0);

  // Calculate estimated sales value based on wholesale price for sellable products only
  const totalRetailValue = products
    .filter(p => {
      const isFinished = (p as any).isFinishedProduct;
      const isIngredient = (p as any).isIngredient;
      return (isFinished === true || isFinished === 'true') && 
             (isIngredient !== true && isIngredient !== 'true');
    })
    .reduce((acc, p) => {
      const stock = Math.max(0, Number(p.stock || 0));
      const wholesalePrice = Number(p.wholesalePrice || p.price || 0);
      return acc + (stock * wholesalePrice);
    }, 0);
  
  const accountsPayable = 
    currentMonthExpenses.filter(e => e.paymentStatus === 'credito').reduce((acc, e) => acc + (Number(e.amount) || 0), 0) +
    purchases.filter(p => {
      const date = p.createdAt?.toDate?.() || new Date();
      return date >= monthStart && p.paymentStatus === 'credito';
    }).reduce((acc, p) => acc + (Number(p.total) || 0), 0);

  const profit = totalSalesAmount - totalExpensesAmount;

  const chartData = [
    { name: 'Ventas', value: totalSalesAmount, color: '#0f172a' },
    { name: 'Gastos', value: totalExpensesAmount, color: '#dc2626' },
  ];

  const shareUrl = `${window.location.origin}/#/catalog/${effectiveUid}`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic serif tracking-tight">RESUMEN MENSUAL</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Hola{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}. Revisa el estado de tu negocio este mes.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 card-depth flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{format(new Date(), 'MMMM yyyy', { locale: es })}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          title="Ventas del Mes" 
          value={totalSalesAmount} 
          icon={TrendingUp} 
          color="blue" 
          trend={{ value: 12, isUp: true }}
        />
        <StatCard 
          title="Utilidad del Mes" 
          value={profit} 
          icon={Receipt} 
          color="green" 
        />
        <StatCard 
          title="Cuentas por Cobrar" 
          value={totalDebts} 
          icon={CreditCard} 
          color="blue" 
        />
        <StatCard 
          title="Cuentas por Pagar" 
          value={accountsPayable} 
          icon={TrendingDown} 
          color="red" 
        />
        <StatCard 
          title="Inversión en Inventario" 
          value={totalInventoryValue} 
          icon={Package} 
          color="amber" 
        />
        <StatCard 
          title="Valor de Venta Est." 
          value={totalRetailValue} 
          icon={TrendingUp} 
          color="blue" 
        />
        {lowStockCount > 0 ? (
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-4 rounded-3xl border border-red-100 bg-red-100 card-depth flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex items-center text-[8px] font-black px-1.5 py-0.5 bg-red-600 text-white rounded-full uppercase animate-pulse">
                Acción
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-500 mb-0.5 whitespace-nowrap">Stock Crítico</p>
              <h3 className="text-lg font-black text-red-600 italic serif leading-tight">{lowStockCount} items</h3>
              <Link to="/inventory" className="text-[8px] font-bold text-red-400 hover:text-red-600 flex items-center gap-0.5 mt-1 uppercase tracking-widest whitespace-nowrap">
                Revisar <ChevronRight size={8} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <StatCard 
            title="Stock Total" 
            value={products.reduce((acc, p) => acc + (p.stock || 0), 0)} 
            icon={Package} 
            color="green" 
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 card-depth">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 italic serif">Desempeño del Mes</h2>
            <div className="flex gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div> Ventas
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div> Gastos
                </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                          <p className="text-lg font-bold">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 card-depth flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Últimas Ventas</h2>
            <Link to="/sales" className="text-blue-600 text-sm font-bold hover:underline">Ver todas</Link>
          </div>
          <div className="flex-1 space-y-4">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-900">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Venta #{sale.id.slice(-4)}</p>
                    <p className="text-xs text-slate-500">{format(sale.createdAt?.toDate() || new Date(), 'dd MMM, HH:mm', { locale: es })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(sale.total)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{sale.paymentMethod || 'Efectivo'}</p>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No hay ventas aún</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
