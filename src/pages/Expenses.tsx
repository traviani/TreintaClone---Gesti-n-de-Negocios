import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, 
  Receipt, 
  Trash2, 
  Calendar,
  Tag,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: any;
}

export default function Expenses() {
  const { user, effectiveUid } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'General',
    paymentStatus: 'contado'
  });

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    const q = query(
      collection(db, 'expenses'),
      where('ownerId', 'in', allowedOwnerIds)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'expenses'));

    return unsubscribe;
  }, [effectiveUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'expenses'), {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentStatus: formData.paymentStatus,
        ownerId: effectiveUid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', category: 'General', paymentStatus: 'contado' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, 'expenses', id), { paymentStatus: 'contado' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'expenses');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este gasto?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'expenses');
    }
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gastos</h1>
          <p className="text-slate-500 mt-1">Lleva el control de los costos de tu negocio.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-red-500">
               <Receipt size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400 uppercase tracking-widest italic serif">Total acumulado</p>
              <h2 className="text-3xl font-black text-red-600">{formatCurrency(totalExpenses)}</h2>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500">
               <Receipt size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-400 uppercase tracking-widest italic serif">Cuentas por Pagar</p>
              <h2 className="text-3xl font-black text-amber-600">
                {formatCurrency(expenses.filter(e => (e as any).paymentStatus === 'credito').reduce((acc, e) => acc + e.amount, 0))}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Historial de Gastos</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {expenses.map((expense) => (
            <div key={expense.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{expense.description}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> 
                      {(() => {
                        const date = expense.createdAt?.toDate?.() || (expense.createdAt ? new Date(expense.createdAt) : null);
                        return date && !isNaN(date.getTime()) ? format(date, 'dd MMM yyyy', { locale: es }) : 'Reciente';
                      })()}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-tighter">{expense.category}</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded font-black italic text-[9px] tracking-widest",
                        (expense as any).paymentStatus === 'credito' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                        {(expense as any).paymentStatus === 'credito' ? 'CRÉDITO' : 'PAGADO'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(expense.amount)}</p>
                    {(expense as any).paymentStatus === 'credito' && (
                        <button 
                            onClick={() => markAsPaid(expense.id)}
                            className="text-[10px] font-bold text-emerald-600 hover:underline"
                        >
                            Marcar como Pagado
                        </button>
                    )}
                </div>
                <button 
                  onClick={() => handleDelete(expense.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="py-20 text-center">
              <Receipt size={48} className="text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No has registrado gastos todavía</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
                <h2 className="text-xl font-bold text-slate-900 italic serif uppercase tracking-tight">Registrar Gasto</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Descripción</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ej. Pago de luz, Alquiler..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Monto</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold tabular-nums text-lg"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Categoría</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Alquiler">Alquiler</option>
                    <option value="Proveedores">Proveedores</option>
                    <option value="Sueldos">Sueldos</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Estado de Pago</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                  >
                    <option value="contado">De Contado (Pagado)</option>
                    <option value="credito">Cuentas por Pagar (Crédito)</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
                  >
                    Guardar Gasto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
