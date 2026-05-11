import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Search, 
  Calendar,
  User,
  CreditCard,
  AlertCircle,
  X,
  ChevronRight,
  HandCoins,
  History,
  Clock,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payment {
  amount: number;
  discount?: number;
  date: any;
  method: string;
  note?: string;
}

interface Sale {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerId: string;
  total: number;
  balance?: number; // amount still owed
  saleType: 'contado' | 'credito';
  createdAt: any;
  payments?: Payment[];
}

export default function AccountsReceivable() {
  const { user, effectiveUid } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDiscount, setPaymentDiscount] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    // Fetch all sales for the user and filter the "credito" ones with balance in memory
    const q = query(
      collection(db, 'sales'),
      where('ownerId', 'in', allowedOwnerIds)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            balance: data.balance !== undefined ? data.balance : data.total
          } as Sale;
        })
        .filter(s => s.saleType === 'credito' && s.balance! > 0.01 && s.customerId) // Ensure customerId exists
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      
      setSales(salesData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));

    return () => unsubscribe();
  }, [effectiveUid]);

  const handleRegisterPayment = async () => {
    if (!selectedSale || !paymentAmount) return;
    
    if (!selectedSale.customerId) {
      alert('Error: Esta venta no tiene un cliente asociado válido.');
      return;
    }

    const amount = parseFloat(paymentAmount);
    const discountInput = parseFloat(paymentDiscount || '0');
    
    if (isNaN(amount) || amount <= 0) {
      alert('Monto inválido');
      return;
    }

    if (isNaN(discountInput) || discountInput < 0) {
      alert('Monto/Porcentaje de descuento inválido');
      return;
    }

    let discount = discountInput;
    if (discountType === 'percent') {
      discount = ((selectedSale.balance || selectedSale.total) * discountInput) / 100;
    }

    const totalReduction = amount + discount;

    if (totalReduction > (selectedSale.balance || selectedSale.total) + 0.01) {
      alert('La suma del abono y descuento no puede ser mayor al saldo pendiente.');
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const saleRef = doc(db, 'sales', selectedSale.id);
      const customerRef = doc(db, 'customers', selectedSale.customerId);

      const newPayment: any = {
        amount,
        date: new Date(),
        method: paymentMethod,
      };

      if (discount > 0) newPayment.discount = discount;
      if (paymentNote && paymentNote.trim()) newPayment.note = paymentNote.trim();

      // 1. Update Sale Balance and add to Payments History
      batch.update(saleRef, {
        balance: increment(-totalReduction),
        payments: arrayUnion(newPayment)
      });

      // 2. Update Customer overall balance
      batch.update(customerRef, {
        balance: increment(-totalReduction)
      });

      await batch.commit();
      
      alert('Abono registrado con éxito');
      setShowPaymentModal(false);
      setSelectedSale(null);
      setPaymentAmount('');
      setPaymentDiscount('');
      setPaymentNote('');
    } catch (error) {
      console.error(error);
      alert('Error al registrar el pago');
      handleFirestoreError(error, OperationType.UPDATE, `sales/${selectedSale.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSales = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendWhatsAppStatement = (sale: Sale) => {
    if (!sale.customerPhone) {
      alert("No hay teléfono registrado para este cliente.");
      return;
    }

    // Calculate total balance for this specific customer across all pending sales
    const customerTotalBalance = sales
      .filter(s => s.customerId === sale.customerId)
      .reduce((sum, s) => sum + (s.balance || 0), 0);

    const days = differenceInDays(new Date(), sale.createdAt.toDate());
    
    const message = `*ESTADO DE CUENTA*\n\nHola ${sale.customerName}, te enviamos un recordatorio de tu saldo pendiente.\n\n💰 *Saldo Total:* ${formatCurrency(customerTotalBalance)}\n⏰ *Retraso mayor:* ${days} días\n\nPor favor, procesa tu abono cuando te sea posible. ¡Muchas gracias!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${sale.customerPhone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase">Cuentas por Cobrar</h1>
          <p className="text-slate-500 font-medium italic text-sm">Gestiona créditos pendientes y registra abonos de clientes.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente o factura..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-primary/50 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Pendiente</p>
             <p className="text-3xl font-black text-slate-900 tabular-nums">
                {formatCurrency(sales.reduce((sum, s) => sum + (s.balance || 0), 0))}
             </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Facturas Vencidas (+15d)</p>
             <p className="text-3xl font-black text-red-500 tabular-nums">
                {sales.filter(s => differenceInDays(new Date(), s.createdAt.toDate()) > 15).length}
             </p>
          </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Clientes con Deuda</p>
             <p className="text-3xl font-black text-primary tabular-nums">
                {new Set(sales.map(s => s.customerId)).size}
             </p>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Factura / Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Días transcurridos</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Saldo Pendiente</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map((sale) => {
                const days = differenceInDays(new Date(), sale.createdAt.toDate());
                const isOverdue = days > 15;
                
                return (
                  <tr 
                    key={sale.id} 
                    className={cn(
                      "group hover:bg-slate-50/50 transition-colors",
                      isOverdue && "bg-red-50/30"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          V-{sale.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {format(sale.createdAt.toDate(), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center font-black text-xs">
                          {sale.customerName.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{sale.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isOverdue ? <AlertCircle size={14} className="text-red-500" /> : <Clock size={14} className="text-slate-400" />}
                        <span className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          isOverdue ? "text-red-600" : "text-slate-600"
                        )}>
                          {days} Días
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-400 tabular-nums line-through decoration-slate-300">
                        {formatCurrency(sale.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {formatCurrency(sale.balance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => sendWhatsAppStatement(sale)}
                          className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-100 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                          title="Enviar Estado por WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button 
                          onClick={() => setSelectedSale(sale)}
                          className="p-2.5 bg-primary text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                        >
                          <HandCoins size={14} />
                          Abonar
                        </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <CheckCircle2 size={48} className="mb-4 text-emerald-300" />
                      <p className="font-bold uppercase italic tracking-widest text-slate-500">No hay deudas pendientes</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Side Panel / Modal */}
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
                  <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Registrar Abono</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Factura: {selectedSale.id}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">Saldo Pendiente</span>
                    <Clock size={16} />
                  </div>
                  <p className="text-4xl font-black tracking-tighter tabular-nums">
                    {formatCurrency(selectedSale.balance || 0)}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <User size={14} className="opacity-60" />
                    <span className="text-sm font-bold uppercase">{selectedSale.customerName}</span>
                  </div>
                </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Monto del Abono</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">$</span>
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] pl-10 pr-4 py-4 text-xl font-black text-slate-900 outline-none focus:border-primary transition-all tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black text-primary uppercase tracking-widest italic">Descuento</label>
                          <div className="flex bg-teal-50 rounded-lg p-0.5 border border-teal-100">
                            <button 
                              onClick={() => setDiscountType('fixed')}
                              className={cn(
                                "px-2 py-0.5 text-[8px] font-black rounded-md transition-all",
                                discountType === 'fixed' ? "bg-primary text-white" : "text-primary/60"
                              )}
                            >
                              $
                            </button>
                            <button 
                              onClick={() => setDiscountType('percent')}
                              className={cn(
                                "px-2 py-0.5 text-[8px] font-black rounded-md transition-all",
                                discountType === 'percent' ? "bg-primary text-white" : "text-primary/60"
                              )}
                            >
                              %
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/30 font-black text-xl">
                            {discountType === 'fixed' ? '$' : '%'}
                          </span>
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={paymentDiscount}
                            onChange={(e) => setPaymentDiscount(e.target.value)}
                            className="w-full bg-teal-50 border-2 border-teal-100/50 rounded-[2rem] pl-10 pr-4 py-4 text-xl font-black text-primary outline-none focus:border-primary transition-all tabular-nums"
                          />
                        </div>
                      </div>
                    </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Método de Pago</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['Efectivo', 'Transferencia', 'Pago Móvil', 'Dólares'].map(method => (
                           <button 
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={cn(
                              "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                              paymentMethod === method ? "bg-teal-50 border-primary text-primary shadow-md shadow-primary/10" : "bg-white border-slate-100 text-slate-400"
                            )}
                           >
                             {method}
                           </button>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Nota adicional (Opcional)</label>
                    <textarea 
                      placeholder="Ej: Pago parcial semanal..."
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none"
                    />
                  </div>
                </div>

                {/* Payment History */}
                {selectedSale.payments && selectedSale.payments.length > 0 && (
                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                       <History size={16} className="text-slate-400" />
                       <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Historial de Abonos</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedSale.payments.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-900">{formatCurrency(p.amount)}</p>
                              {p.discount && p.discount > 0 && (
                                <span className="text-[9px] font-black text-primary bg-teal-50 px-1.5 py-0.5 rounded italic">
                                  DESC: {formatCurrency(p.discount)}
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase italic">{p.method} • {p.date?.toDate ? format(p.date.toDate(), 'dd/MM/yy') : format(new Date(p.date), 'dd/MM/yy')}</p>
                          </div>
                          {p.note && <span className="text-[8px] max-w-[100px] text-right truncate italic text-slate-400">{p.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                 <button 
                  disabled={isProcessing || !paymentAmount}
                  onClick={handleRegisterPayment}
                  className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-primary/10 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <HandCoins size={18} />
                        Confirmar Abono
                      </>
                    )}
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
