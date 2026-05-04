import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  increment,
  writeBatch,
  doc,
  deleteDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, 
  Truck, 
  Trash2, 
  ShoppingCart,
  Calendar,
  X,
  Package,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  cost: number;
}

interface Purchase {
  id: string;
  supplierName: string;
  supplierIdNumber?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  documentNumber?: string;
  paymentStatus?: string;
  items: any[];
  total: number;
  createdAt: any;
}

export default function Purchases() {
  const { user, effectiveUid } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ productId: string; quantity: number; cost: number; totalPaid?: number }[]>([]);
  const [supplierData, setSupplierData] = useState({
    supplierName: '',
    supplierIdNumber: '',
    supplierAddress: '',
    supplierPhone: '',
    supplierEmail: '',
    documentNumber: '',
    paymentStatus: 'contado'
  });

  // Extract unique suppliers for autocomplete
  const suppliers = Array.from(new Map(purchases.map(p => [p.supplierName, p])).values())
    .filter((p: any) => p && p.supplierName)
    .sort((a: any, b: any) => (a.supplierName || '').localeCompare(b.supplierName || '')) as Purchase[];

  const handleSupplierNameChange = (name: string) => {
    setSupplierData(prev => ({ ...prev, supplierName: name }));
    const existingSupplier = suppliers.find(s => s.supplierName.toLowerCase() === name.toLowerCase());
    if (existingSupplier) {
      setSupplierData({
        supplierName: existingSupplier.supplierName,
        supplierIdNumber: existingSupplier.supplierIdNumber || '',
        supplierAddress: existingSupplier.supplierAddress || '',
        supplierPhone: existingSupplier.supplierPhone || '',
        supplierEmail: existingSupplier.supplierEmail || '',
        documentNumber: '', // Don't autocomplete document number
        paymentStatus: existingSupplier.paymentStatus || 'contado'
      });
    }
  };

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    const pq = query(collection(db, 'products'), where('ownerId', 'in', allowedOwnerIds));
    const pquery = query(collection(db, 'purchases'), where('ownerId', 'in', allowedOwnerIds));

    const unsubProducts = onSnapshot(pq, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubPurchases = onSnapshot(pquery, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setPurchases(data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'purchases'));

    return () => { unsubProducts(); unsubPurchases(); };
  }, [effectiveUid]);

  const addToCart = () => {
    setCart([...cart, { productId: '', quantity: 1, cost: 0, totalPaid: 0 } as any]);
  };

  const handlePurchase = async () => {
    if (cart.length === 0 || !supplierData.supplierName) {
        alert('Por favor agrega al menos un producto y el nombre del proveedor.');
        return;
    }

    // Verify all items have cost calculated
    const invalidItems = cart.filter((item: any) => !item.productId || item.quantity <= 0 || item.cost < 0);
    if (invalidItems.length > 0) {
        alert('Por favor verifica que todos los productos tengan cantidad y precio válido.');
        return;
    }

    try {
      const batch = writeBatch(db);
      const total = cart.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
      const purchaseData = {
        ownerId: effectiveUid,
        ...supplierData,
        items: cart,
        total,
        updatedAt: serverTimestamp()
      };

      if (editingPurchaseId) {
        // Find existing purchase to calculate stock diff
        const existingPurchase = purchases.find(p => p.id === editingPurchaseId);
        if (existingPurchase) {
          // Revert old stocks
          existingPurchase.items.forEach((oldItem: any) => {
            const productRef = doc(db, 'products', oldItem.productId);
            batch.update(productRef, { stock: increment(-oldItem.quantity) });
          });
        }
        
        // Update purchase record
        const purchaseRef = doc(db, 'purchases', editingPurchaseId);
        batch.update(purchaseRef, purchaseData as any);
      } else {
        // Create new record
        const purchaseRef = doc(collection(db, 'purchases'));
        batch.set(purchaseRef, { ...purchaseData, createdAt: serverTimestamp() });
      }

      // Update Inventory stocks and costs with new items
      cart.forEach((item: any) => {
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, {
          stock: increment(item.quantity),
          cost: item.cost,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      setIsModalOpen(false);
      setEditingPurchaseId(null);
      setCart([]);
      resetSupplierData();
      alert(editingPurchaseId ? '¡Compra actualizada!' : '¡Compra registrada e inventario actualizado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'purchases');
    }
  };

  const resetSupplierData = () => {
    setSupplierData({
        supplierName: '',
        supplierIdNumber: '',
        supplierAddress: '',
        supplierPhone: '',
        supplierEmail: '',
        documentNumber: '',
        paymentStatus: 'contado'
    });
  };

  const startEdit = (purchase: any) => {
    setEditingPurchaseId(purchase.id);
    setSupplierData({
      supplierName: purchase.supplierName || '',
      supplierIdNumber: purchase.supplierIdNumber || '',
      supplierAddress: purchase.supplierAddress || '',
      supplierPhone: purchase.supplierPhone || '',
      supplierEmail: purchase.supplierEmail || '',
      documentNumber: purchase.documentNumber || '',
      paymentStatus: purchase.paymentStatus || 'contado'
    });
    setCart(purchase.items.map((item: any) => ({
        ...item,
        totalPaid: item.totalPaid || (item.quantity * item.cost)
    })));
    setIsModalOpen(true);
  };

  const handleDelete = async (purchase: any) => {
    if (!confirm('¿Estás seguro de eliminar esta compra? El stock se descontará del inventario.')) return;

    try {
      const batch = writeBatch(db);
      
      // Revert stock
      purchase.items.forEach((item: any) => {
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      });

      // Delete purchase
      batch.delete(doc(db, 'purchases', purchase.id));

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'purchases');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 italic serif">Abastecimiento</h1>
          <p className="text-slate-500">Registra tus compras y actualiza tu stock automáticamente.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Plus size={20} /> Registrar Compra
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 italic serif">Historial de Compras</h2>
          <Truck className="text-emerald-500" />
        </div>
        <div className="divide-y divide-slate-100">
          {purchases.map(p => (
            <div key={p.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4 group">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                  <ShoppingCart size={20} />
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic font-serif">DOC: {p.documentNumber || 'S/N'}</p>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded italic">#{p.id.slice(-4)}</span>
                        <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded italic uppercase tracking-tighter",
                            p.paymentStatus === 'credito' ? "bg-amber-100 text-amber-600" : "bg-emerald-500 text-white"
                        )}>
                            {p.paymentStatus === 'credito' ? 'Cuentas x Pagar' : 'PAGADO'}
                        </span>
                   </div>
                   <p className="text-sm font-bold text-slate-900 truncate">{p.supplierName || 'Proveedor Desconocido'}</p>
                   <p className="text-xs text-slate-500 font-medium">{p.items.length} productos • {p.supplierIdNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 justify-between md:justify-end">
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">{formatCurrency(p.total)}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                      <Calendar size={12} /> {(() => {
                        const date = p.createdAt?.toDate?.() || (p.createdAt ? new Date(p.createdAt) : null);
                        return date && !isNaN(date.getTime()) ? format(date, 'dd MMM, yyyy', { locale: es }) : 'Reciente';
                      })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => startEdit(p)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Editar Compra"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(p)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar Compra"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nueva Compra */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
             <motion.div initial={{scale:0.95}} animate={{scale:1}} className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 shrink-0 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 italic serif">
                        {editingPurchaseId ? 'Editar Registro de Compra' : 'Abastecimiento de Mercancía'}
                    </h2>
                    <button onClick={() => { setIsModalOpen(false); setEditingPurchaseId(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Supplier Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 mb-1 block">DATOS DEL PROVEEDOR</label>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Nombre / Razón Social</label>
                            <input 
                                type="text"
                                list="supplier-names"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                                value={supplierData.supplierName}
                                onChange={(e) => handleSupplierNameChange(e.target.value)}
                                placeholder="Ej: Polar C.A."
                            />
                            <datalist id="supplier-names">
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.supplierName} />
                                ))}
                            </datalist>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">CI / RIF</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                                value={supplierData.supplierIdNumber}
                                onChange={(e) => setSupplierData({...supplierData, supplierIdNumber: e.target.value})}
                                placeholder="J-12345678-0"
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Dirección de Entrega / Origen</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                                value={supplierData.supplierAddress}
                                onChange={(e) => setSupplierData({...supplierData, supplierAddress: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Teléfono</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                                value={supplierData.supplierPhone}
                                onChange={(e) => setSupplierData({...supplierData, supplierPhone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Email</label>
                            <input 
                                type="email"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                                value={supplierData.supplierEmail}
                                onChange={(e) => setSupplierData({...supplierData, supplierEmail: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Condición de Pago</label>
                            <select 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                value={supplierData.paymentStatus}
                                onChange={(e) => setSupplierData({...supplierData, paymentStatus: e.target.value})}
                            >
                                <option value="contado">De Contado (Pagado)</option>
                                <option value="credito">A Crédito (Por Pagar)</option>
                            </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Número de Documento / Factura</label>
                            <input 
                                type="text"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-500 shadow-sm shadow-emerald-50"
                                value={supplierData.documentNumber}
                                onChange={(e) => setSupplierData({...supplierData, documentNumber: e.target.value})}
                                placeholder="#00123"
                            />
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1 block">PRODUCTOS ADQUIRIDOS</label>
                        {cart.map((item: any, idx) => (
                            <div key={idx} className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-slate-400 uppercase font-black block ml-1 italic">Producto a Ingresar</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold appearance-none focus:ring-2 focus:ring-emerald-500"
                                        value={item.productId}
                                        onChange={(e) => {
                                            const newCart = [...cart] as any;
                                            newCart[idx].productId = e.target.value;
                                            setCart(newCart);
                                        }}
                                    >
                                        <option value="">Seleccionar Producto...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({(p as any).unit || 'unid'})</option>)}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 uppercase font-black block ml-1 italic">Cant. Comprada</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-center text-slate-900 focus:ring-2 focus:ring-emerald-500"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const newCart = [...cart] as any;
                                                const val = parseFloat(e.target.value) || 0;
                                                newCart[idx].quantity = val;
                                                if (val > 0) {
                                                    newCart[idx].cost = newCart[idx].totalPaid / val;
                                                }
                                                setCart(newCart);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 uppercase font-black block ml-1 italic">Total Pagado ($)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none font-black tabular-nums text-center text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                                            value={item.totalPaid || 0}
                                            onChange={(e) => {
                                                const newCart = [...cart] as any;
                                                const val = parseFloat(e.target.value) || 0;
                                                newCart[idx].totalPaid = val;
                                                if (newCart[idx].quantity > 0) {
                                                    newCart[idx].cost = val / newCart[idx].quantity;
                                                }
                                                setCart(newCart);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 uppercase font-black block ml-1 italic">Costo Unitario</label>
                                        <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-black text-center text-slate-500 text-sm">
                                            {formatCurrency(item.cost || 0)}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    className="absolute -top-2 -right-2 p-2 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded-full shadow-md transition-all z-10" 
                                    onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        
                        <button 
                            onClick={addToCart}
                            className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-emerald-300 hover:text-emerald-600 transition-all bg-slate-50/50"
                        >
                            <Plus size={20} /> AGREGAR OTRO PRODUCTO
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-3xl mb-4 shadow-xl shadow-slate-200">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Total de Compra</p>
                            <span className="text-xl font-bold italic serif">Monto a Liquidar</span>
                        </div>
                        <span className="text-3xl font-black tabular-nums">{formatCurrency(cart.reduce((acc, item) => acc + (item.cost * item.quantity), 0))}</span>
                    </div>

                    <button 
                        onClick={handlePurchase}
                        disabled={cart.length === 0 || !supplierData.supplierName}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-emerald-100 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-[0.98]"
                    >
                        {editingPurchaseId ? 'Actualizar Registro de Compra' : 'Confirmar Ingreso de Mercancía'}
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
