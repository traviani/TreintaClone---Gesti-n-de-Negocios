import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  deleteDoc,
  writeBatch,
  increment,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Search, 
  Trash2, 
  Calendar,
  User,
  ShoppingBag,
  MoreVertical,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Receipt } from '../components/Receipt';

interface Sale {
  id: string;
  customerName: string;
  customerId: string;
  customerIdNumber?: string;
  customerPhone?: string;
  customerAddress?: string;
  phone?: string;
  address?: string;
  total: number;
  saleType: 'contado' | 'credito';
  createdAt: any;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export default function Sales() {
  const { user, effectiveUid } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    const q = query(
      collection(db, 'sales'),
      where('ownerId', 'in', allowedOwnerIds)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setSales(data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));

    return () => unsubscribe();
  }, [effectiveUid]);

  const handleDeleteSale = async (sale: Sale) => {
    setIsDeleting(true);

    try {
      const batch = writeBatch(db);

      // 1. Restituir inventario
      if (sale.items && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          if (!item.productId) continue;
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, {
            stock: increment(item.quantity),
            updatedAt: serverTimestamp()
          });
        }
      }

      // 2. Si fue a crédito, descontar del balance del cliente
      if (sale.saleType === 'credito' && sale.customerId) {
        const customerRef = doc(db, 'customers', sale.customerId);
        batch.update(customerRef, {
          balance: increment(-sale.total)
        });
      }

      // 3. Eliminar la venta
      const saleRef = doc(db, 'sales', sale.id);
      batch.delete(saleRef);

      await batch.commit();
      setShowConfirmDelete(null);
      setSelectedSale(null);
      alert('Venta eliminada e inventario restituido correctamente.');
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la venta. Verifique sus permisos o conexión.');
      handleFirestoreError(error, OperationType.DELETE, `sales/${sale.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSaleType = async (sale: Sale, newType: 'contado' | 'credito') => {
    if (sale.saleType === newType) return;
    setIsUpdating(true);
    
    try {
      const batch = writeBatch(db);
      const saleRef = doc(db, 'sales', sale.id);
      
      // Actualizar tipo de venta
      batch.update(saleRef, { saleType: newType });
      
      // Actualizar balance del cliente
      if (sale.customerId) {
        const customerRef = doc(db, 'customers', sale.customerId);
        if (newType === 'credito') {
          // Cambió a crédito: aumenta la deuda (balance)
          batch.update(customerRef, { balance: increment(sale.total) });
        } else {
          // Cambió a contado: disminuye la deuda (balance)
          batch.update(customerRef, { balance: increment(-sale.total) });
        }
      }
      
      await batch.commit();
      setSelectedSale({ ...sale, saleType: newType });
      alert('Forma de pago actualizada correctamente.');
    } catch (error) {
      console.error(error);
      alert('Error al actualizar la forma de pago.');
      handleFirestoreError(error, OperationType.UPDATE, `sales/${sale.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredSales = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase">Historial de Ventas</h1>
          <p className="text-slate-500 font-medium italic">Gestiona y consulta todas las operaciones realizadas.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente o ID..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map((sale) => (
                <tr 
                  key={sale.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">
                        {(() => {
                          const date = sale.createdAt?.toDate?.() || (sale.createdAt ? new Date(sale.createdAt) : null);
                          return date && !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy', { locale: es }) : 'Reciente';
                        })()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {sale.invoiceNumber ? `NE-${String(sale.invoiceNumber).padStart(6, '0')}` : `ID-${sale.id.slice(-6).toUpperCase()}`} | {(() => {
                          const date = sale.createdAt?.toDate?.() || (sale.createdAt ? new Date(sale.createdAt) : null);
                          return date && !isNaN(date.getTime()) ? format(date, 'hh:mm a', { locale: es }) : 'Pendiente';
                        })()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                        {sale.customerName.charAt(0)}
                      </div>
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{sale.customerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest",
                      sale.saleType === 'credito' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {sale.saleType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(sale.total)}</span>
                      {sale.saleType === 'credito' && (sale as any).balance > 0 && (
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                          Pendiente: {formatCurrency((sale as any).balance)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSale(sale);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <ShoppingBag size={48} className="mb-4 text-slate-300" />
                      <p className="font-bold uppercase italic tracking-widest text-slate-500 underline decoration-blue-500">No se encontraron ventas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Sidebar */}
      <AnimatePresence>
        {selectedSale && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSale(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Detalle de Venta</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedSale.invoiceNumber ? `№ ${String(selectedSale.invoiceNumber).padStart(6, '0')}` : `ID: ${selectedSale.id.toUpperCase()}`}
                  </p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Total Recaudado</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{formatCurrency(selectedSale.total)}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Forma de Pago</p>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateSaleType(selectedSale, 'contado')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                          selectedSale.saleType === 'contado' 
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" 
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Contado
                      </button>
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateSaleType(selectedSale, 'credito')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                          selectedSale.saleType === 'credito' 
                            ? "bg-amber-600 text-white shadow-md shadow-amber-100" 
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Crédito
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic border-b-2 border-slate-900 pb-2 inline-block">Items Vendidos</h3>
                  <div className="space-y-3">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-900 text-xs tabular-nums">
                             {item.quantity}
                           </div>
                           <p className="text-sm font-bold text-slate-700">{item.name}</p>
                        </div>
                        <p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Zona de Peligro</p>
                  </div>
                  <p className="text-xs text-red-500/80 font-medium leading-relaxed">
                    Al eliminar esta venta, se restituirá el inventario automáticamente y se ajustará el balance del cliente si fue una venta a crédito. Esta acción no se puede deshacer.
                  </p>
                  
                  {showConfirmDelete === selectedSale.id ? (
                    <div className="flex gap-2">
                       <button 
                         disabled={isDeleting}
                         onClick={() => handleDeleteSale(selectedSale)}
                         className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-3 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                       >
                         {isDeleting ? 'PROCESANDO...' : 'SÍ, ELIMINAR TODO'}
                       </button>
                       <button 
                         onClick={() => setShowConfirmDelete(null)}
                         className="px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase"
                       >
                         CANCELAR
                       </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowConfirmDelete(selectedSale.id)}
                      className="w-full border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all text-[10px] font-black py-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} />
                      ELIMINAR ESTA VENTA
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <button 
                  onClick={() => setShowReceipt(true)}
                  className="flex-1 bg-white border border-slate-200 text-slate-900 text-[10px] font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-slate-100 transition-all font-sans"
                 >
                    <Printer size={16} />
                    REIMPRIMIR TICKET
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceipt && selectedSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            <div className="max-w-2xl w-full flex flex-col items-center">
              <Receipt 
                sale={selectedSale} 
                onSecondaryAction={() => setShowReceipt(false)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
