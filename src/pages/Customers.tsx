import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
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
  Users, 
  Trash2, 
  ChevronRight,
  Phone,
  Mail,
  UserPlus,
  CreditCard,
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Customer {
  id: string;
  name: string;
  idNumber: string;
  address: string;
  phone: string;
  email: string;
  priceType: 'detal' | 'mayor';
  balance: number;
}

export default function Customers() {
  const { user, effectiveUid } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    address: '',
    phone: '',
    email: '',
    priceType: 'detal',
    balance: '0'
  });

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    const q = query(
      collection(db, 'customers'),
      where('ownerId', 'in', allowedOwnerIds),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

    return unsubscribe;
  }, [effectiveUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        balance: parseFloat(formData.balance || '0'),
        ownerId: effectiveUid,
        updatedAt: serverTimestamp()
      };

      if (selectedCustomerId) {
        await updateDoc(doc(db, 'customers', selectedCustomerId), data);
      } else {
        await addDoc(collection(db, 'customers'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      
      handleCloseModal();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomerId(null);
    setFormData({ name: '', idNumber: '', address: '', phone: '', email: '', priceType: 'detal', balance: '0' });
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setFormData({
      name: customer.name,
      idNumber: customer.idNumber || '',
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
      priceType: customer.priceType,
      balance: customer.balance.toString()
    });
    setIsModalOpen(true);
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'customers');
    }
  };

  const updateBalance = async (id: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, 'customers', id), { balance: newBalance });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'customers');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">Gestiona tus contactos y cuentas por cobrar.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-100 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <motion.div 
            layout
            key={customer.id} 
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl hover:bg-amber-600 hover:text-white transition-colors">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{customer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded italic">
                        {customer.idNumber || 'Sin CI/RIF'}
                    </span>
                    <span className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded italic uppercase tracking-tighter",
                        customer.priceType === 'mayor' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                        {customer.priceType === 'mayor' ? 'MAYOR' : 'DETAL'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleEdit(customer)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <ChevronRight size={18} />
                </button>
                <button 
                  onClick={() => deleteCustomer(customer.id)}
                  className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                <ArrowRight size={14} className="text-slate-300" />
                <span className="truncate">{customer.address || 'Sin dirección registrada'}</span>
              </div>

              <div className={cn(
                "p-4 rounded-2xl flex items-center justify-between transition-all",
                customer.balance > 0 ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-slate-100"
              )}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Deuda Actual</p>
                  <p className={cn("text-xl font-black tabular-nums", customer.balance > 0 ? "text-amber-600" : "text-slate-400")}>
                    {formatCurrency(customer.balance)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                    <button 
                        onClick={() => {
                            const val = prompt('Indica el abono a la deuda:');
                            if (val) updateBalance(customer.id, Math.max(0, customer.balance - parseFloat(val)));
                        }}
                        className="px-3 py-1 bg-white border border-amber-200 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                    >
                        Abonar
                    </button>
                    <button 
                         onClick={() => {
                            const val = prompt('Indica el nuevo cargo (deuda):');
                            if (val) updateBalance(customer.id, customer.balance + parseFloat(val));
                        }}
                        className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-all shadow-sm"
                    >
                        Fiado
                    </button>
                </div>
              </div>
            </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium italic lowercase tracking-tight">
                  <Mail size={12} /> {customer.email || 'no-email@business.com'}
                </div>
              </div>
            </motion.div>
        ))}

        {customers.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-500 font-medium">Aún no tienes clientes registrados</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs px-6">Lleva el control de quién te debe y mantén tus cuentas al día.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
                <h2 className="text-xl font-bold text-slate-900 italic serif uppercase tracking-widest text-center">
                  {selectedCustomerId ? 'Editar Cliente' : 'Registrar Cliente'}
                </h2>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Nombre</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">CI / RIF</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                            value={formData.idNumber}
                            onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Dirección</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Teléfono</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Tipo de Precio</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                        value={formData.priceType}
                        onChange={(e) => setFormData({...formData, priceType: e.target.value as any})}
                    >
                        <option value="detal">Detal (PVP)</option>
                        <option value="mayor">Al Mayor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Email (Opcional)</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Saldo Inicial</label>
                        <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold tabular-nums"
                        value={formData.balance}
                        onChange={(e) => setFormData({...formData, balance: e.target.value})}
                        />
                    </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-100 transition-all active:scale-[0.98]"
                  >
                    {selectedCustomerId ? 'Guardar Cambios' : 'Agregar Cliente'}
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
