import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  runTransaction, 
  doc 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn, getGoogleDriveDirectLink } from '../lib/utils';
import { Receipt, sendSaleWhatsApp } from '../components/Receipt';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  User, 
  CheckCircle2, 
  X, 
  Printer, 
  Receipt as ReceiptIcon,
  MessageCircle,
  ChevronDown, 
  Package 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  stock: number;
  unit?: string;
  category: string;
  imageUrl?: string;
  isBajoPedido?: boolean;
}

interface Customer {
  id: string;
  name: string;
  idNumber: string;
  phone?: string;
  address?: string;
  priceType: 'detal' | 'mayor';
  balance: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const { user, effectiveUid } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeActionLoading, setActiveActionLoading] = useState<'letter' | 'ticket' | 'whatsapp' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [autoReceiptTrigger, setAutoReceiptTrigger] = useState<'letter' | 'ticket' | 'whatsapp' | undefined>(undefined);

  // Discount and Sample state
  const [discount, setDiscount] = useState<number>(0);
  const [isSample, setIsSample] = useState(false);

  // Flow State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleType, setSaleType] = useState<'contado' | 'credito'>('credito');
  const [priceType, setPriceType] = useState<'detal' | 'mayor'>('detal');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    const pq = query(collection(db, 'products'), where('ownerId', 'in', allowedOwnerIds));
    const cq = query(collection(db, 'customers'), where('ownerId', 'in', allowedOwnerIds));

    const unsubProducts = onSnapshot(pq, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubCustomers = onSnapshot(cq, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

    return () => {
      unsubProducts();
      unsubCustomers();
    };
  }, [effectiveUid]);

  // Sync priceType with customer preference
  useEffect(() => {
    if (selectedCustomer) {
      setPriceType(selectedCustomer.priceType || 'detal');
    }
  }, [selectedCustomer]);

  const addToCart = (product: Product) => {
    const isOutOfStock = product.stock <= 0;
    if (isOutOfStock && !product.isBajoPedido) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // If not bajo pedido, respect product stock
        if (!product.isBajoPedido && existing.quantity >= product.stock) return prev;
        
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => {
    const price = priceType === 'mayor' && item.wholesalePrice ? item.wholesalePrice : item.price;
    return acc + (price * item.quantity);
  }, 0);

  const total = isSample ? 0 : Math.max(0, subtotal - discount);

  const handleCheckout = async (actionType: 'letter' | 'ticket' | 'whatsapp') => {
    if (cart.length === 0 || !selectedCustomer || isProcessing) return;
    setIsProcessing(true);
    setActiveActionLoading(actionType);

    try {
      let saleWithId: any = null;
      
      await runTransaction(db, async (transaction) => {
        // 1. Get and Increment Invoice Counter
        const counterRef = doc(db, 'metadata', 'global_sales_counter');
        const counterSnap = await transaction.get(counterRef);
        
        let nextInvoiceNumber = 1;
        if (counterSnap.exists()) {
          const val = counterSnap.data().lastNumber;
          // Ensure it's treated as a number regardless of how it's stored
          const currentNumber = typeof val === 'number' ? val : parseInt(String(val || 0));
          nextInvoiceNumber = (isNaN(currentNumber) ? 0 : currentNumber) + 1;
        }
        
        transaction.set(counterRef, { lastNumber: nextInvoiceNumber }, { merge: true });

        // 2. Prepare Sale Data
        const currentSubtotal = cart.reduce((acc, item) => {
          const price = priceType === 'mayor' && item.wholesalePrice ? item.wholesalePrice : item.price;
          return acc + (price * item.quantity);
        }, 0);
        const currentTotal = isSample ? 0 : Math.max(0, currentSubtotal - discount);

        const saleRef = doc(collection(db, 'sales'));
        const saleData = {
          ownerId: effectiveUid,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerIdNumber: selectedCustomer.idNumber,
          customerPhone: selectedCustomer.phone || '',
          customerAddress: selectedCustomer.address || '',
          items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: priceType === 'mayor' && item.wholesalePrice ? item.wholesalePrice : item.price,
            quantity: item.quantity,
            isBajoPedido: item.stock <= 0 || item.isBajoPedido
          })),
          hasBajoPedido: cart.some(item => item.stock <= 0 || item.isBajoPedido),
          subtotal: currentSubtotal,
          discount: isSample ? currentSubtotal : discount,
          isSample,
          total: currentTotal,
          balance: saleType === 'credito' ? currentTotal : 0,
          payments: [],
          saleType,
          priceType,
          status: 'completed',
          invoiceNumber: nextInvoiceNumber,
          createdAt: serverTimestamp()
        };

        transaction.set(saleRef, saleData);

        // 3. Update Customer Balance
        if (saleType === 'credito') {
          const customerRef = doc(db, 'customers', selectedCustomer.id);
          transaction.update(customerRef, {
            balance: increment(currentTotal)
          });
        }

        // 4. Update Inventory
        cart.forEach(item => {
          const productRef = doc(db, 'products', item.id);
          transaction.update(productRef, {
            stock: increment(-item.quantity),
            updatedAt: serverTimestamp()
          });
        });

        saleWithId = { ...saleData, id: saleRef.id };
      });
      
      if (saleWithId) {
        // If action is WhatsApp, open directly
        if (actionType === 'whatsapp') {
          sendSaleWhatsApp(saleWithId);
        }

        setAutoReceiptTrigger(actionType);
        setLastSale(saleWithId);
        setCart([]);
        setDiscount(0);
        setIsSample(false);
        setShowSuccess(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    } finally {
      setIsProcessing(false);
      setActiveActionLoading(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const isFinished = (p as any).isFinishedProduct;
    const isIngredient = (p as any).isIngredient;
    const search = searchTerm.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const matchesFilter = (isFinished === true || isFinished === 'true') && 
                          (isIngredient !== true && isIngredient !== 'true');

    if (!search) return matchesFilter;
    
    const name = (p.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return matchesFilter && name.includes(search);
  });

  const filteredCustomers = customers.filter(c => {
    const search = searchCustomer.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!search) return true;
    
    const name = (c.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const idNumber = (c.idNumber || '').toLowerCase();
    
    return name.includes(search) || idNumber.includes(search);
  });

  if (showSuccess && lastSale) {
    return (
      <div className="fixed inset-0 bg-app-background z-50 flex flex-col items-center justify-start p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:block">
        <div className="h-full min-h-max py-8 flex flex-col items-center print:p-0 print:m-0 print:block print:h-auto w-full max-w-4xl">
          <Receipt 
            sale={lastSale} 
            initialFormat={autoReceiptTrigger === 'ticket' ? 'ticket' : 'letter'}
            autoTrigger={autoReceiptTrigger}
            onSecondaryAction={() => {
              setShowSuccess(false);
              setLastSale(null);
              setAutoReceiptTrigger(undefined);
              setSelectedCustomer(null);
              setSaleType('credito');
            }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-6 print:hidden">
      {/* Main Content Area: Controls + Products */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-hidden">
        
        {/* Top Controls Grid: Customer, Condition, Tarifa */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Step 1: Customer Selection */}
          <div className="md:col-span-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">1. Cliente</h3>
              {selectedCustomer && (
                <button onClick={() => setSelectedCustomer(null)} className="text-blue-600 text-xs font-bold hover:underline italic cursor-pointer">Cambiar</button>
              )}
            </div>
            
            {!selectedCustomer ? (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Seleccionar cliente..."
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                      value={searchCustomer}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onChange={(e) => {
                        setSearchCustomer(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onClick={() => setShowCustomerDropdown(true)}
                    />
                    <ChevronDown size={16} className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform", showCustomerDropdown && "rotate-180")} />
                  </div>
                  
                  {showCustomerDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowCustomerDropdown(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => (
                            <button 
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setSearchCustomer('');
                                setShowCustomerDropdown(false);
                              }}
                              className="w-full text-left p-3 hover:bg-teal-50 rounded-xl transition-all border border-transparent hover:border-teal-100 group flex items-center justify-between mb-1 last:mb-0 cursor-pointer"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary">{c.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.idNumber}</p>
                              </div>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 p-3 text-center">No hay clientes</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{selectedCustomer.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">CI/RIF: {selectedCustomer.idNumber}</p>
                  </div>
                </div>
                {selectedCustomer.phone && (
                  <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {selectedCustomer.phone}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Condición de Pago */}
          <div className="md:col-span-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">2. Condición</h3>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button 
                type="button"
                onClick={() => setSaleType('credito')}
                className={cn(
                  "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                  saleType === 'credito' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Crédito
              </button>
              <button 
                type="button"
                onClick={() => setSaleType('contado')}
                className={cn(
                  "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                  saleType === 'contado' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Contado
              </button>
            </div>
          </div>

          {/* Step 3: Tipo de Tarifa */}
          <div className="md:col-span-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">3. Tarifa</h3>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button 
                type="button"
                onClick={() => setPriceType('detal')}
                className={cn(
                  "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                  priceType === 'detal' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Detal
              </button>
              <button 
                type="button"
                onClick={() => setPriceType('mayor')}
                className={cn(
                  "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                  priceType === 'mayor' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Mayor
              </button>
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar por nombre de producto terminado..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {filteredProducts.length} Productos Disponibles
            </div>
          </div>

          {/* Products Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(p => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0 && !p.isBajoPedido}
                  className={cn(
                    "p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group relative overflow-hidden cursor-pointer",
                    p.stock <= 0 && !p.isBajoPedido
                      ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                      {p.imageUrl ? (
                        <img 
                          src={getGoogleDriveDirectLink(p.imageUrl)} 
                          alt={p.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package size={14} className="text-slate-300" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                      p.stock > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-purple-50 text-purple-700 border-purple-100"
                    )}>
                      {p.stock > 0 ? `${p.stock} Disp.` : 'Bajo Pedido'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-xs font-black text-slate-900">
                      {formatCurrency(priceType === 'mayor' && p.wholesalePrice ? p.wholesalePrice : p.price)}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                <Search size={48} className="mb-4 text-slate-300" />
                <p className="font-bold uppercase italic tracking-widest text-slate-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={cn(
        "w-full lg:w-[420px] flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative transition-all",
        !selectedCustomer && "opacity-10 pointer-events-none translate-x-10"
      )}>
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight italic leading-none">CARRITO</h2>
            {selectedCustomer && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 truncate max-w-[200px]">{selectedCustomer.name}</p>}
          </div>
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 font-black tabular-nums shadow-sm">
            {cart.length}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3 bg-slate-50/50 hover:bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5 truncate">{item.name}</p>
                <p className="text-[10px] font-black text-slate-400 italic">
                  {formatCurrency(priceType === 'mayor' && item.wholesalePrice ? item.wholesalePrice : item.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-0.5 shadow-sm">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"><Minus size={12} /></button>
                  <span className="w-6 text-center text-xs font-black tabular-nums">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"><Plus size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-500 bg-white hover:bg-red-50 rounded-xl transition-all border border-slate-100 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-slate-200" />
              </div>
              <p className="text-sm font-black italic uppercase tracking-wider text-slate-400 text-center">Esperando Pedido</p>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
          {/* Discounts & Sample Toggle */}
          <div className="space-y-3 px-1">
            <div className="flex items-center justify-between">
              <label 
                className={cn(
                  "flex items-center gap-2 cursor-pointer group",
                  isSample ? "text-primary" : "text-slate-400"
                )}
              >
                <div className={cn(
                  "w-4 h-4 border-2 rounded flex items-center justify-center transition-all",
                  isSample ? "bg-primary border-primary shadow-sm" : "border-slate-300 group-hover:border-slate-400"
                )}>
                  {isSample && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isSample}
                  onChange={(e) => {
                    setIsSample(e.target.checked);
                    if (e.target.checked) setDiscount(0);
                  }}
                />
                <span className="text-[10px] font-black uppercase italic tracking-wider">ENTREGAR COMO MUESTRA</span>
              </label>

              {!isSample && (
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 italic">DESC: $</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-16 text-right text-xs font-black outline-none tabular-nums"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {discount > 0 && !isSample && (
              <div className="flex items-center justify-between text-[10px] font-black text-primary uppercase tracking-widest italic">
                <span>Descuento</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}

            {isSample && (
              <div className="flex items-center justify-between text-[10px] font-black text-primary uppercase tracking-widest italic">
                <span>Muestra (100% Bonificado)</span>
                <span>- {formatCurrency(subtotal)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-2xl font-black text-slate-900 tracking-tighter tabular-nums">
              <span className="italic">Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Quick Catalog Link Buttons */}
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/#/catalog/${effectiveUid}?type=detal`;
                navigator.clipboard.writeText(url);
                alert("✅ Enlace DETAL copiado con éxito.");
              }}
              className="flex-1 py-2 bg-teal-50 text-primary rounded-xl font-black text-[9px] uppercase tracking-widest border border-teal-100 flex items-center justify-center gap-1 hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <ShoppingCart size={12} />
              DETAL
            </button>
            <button 
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/#/catalog/${effectiveUid}?type=mayor`;
                navigator.clipboard.writeText(url);
                alert("✅ Enlace MAYORISTA copiado con éxito.");
              }}
              className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-purple-100 flex items-center justify-center gap-1 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Package size={12} />
              MAYOR
            </button>
          </div>

          {/* Direct POS Billing & Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
              Facturar y Emitir
            </p>

            {/* Button 1: Imprimir Hoja Carta (2 Copias) */}
            <button 
              type="button"
              disabled={cart.length === 0 || isProcessing || !selectedCustomer}
              onClick={() => handleCheckout('letter')}
              className={cn(
                "w-full py-3 px-3 rounded-xl font-black text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-md cursor-pointer",
                cart.length === 0 || !selectedCustomer || isProcessing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10"
              )}
            >
              {activeActionLoading === 'letter' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              <span>{activeActionLoading === 'letter' ? 'FACTURANDO...' : 'FACTURAR E IMPRIMIR CARTA'}</span>
            </button>

            {/* Button 2: Ticket Térmico Aclas PP7X */}
            <button 
              type="button"
              disabled={cart.length === 0 || isProcessing || !selectedCustomer}
              onClick={() => handleCheckout('ticket')}
              className={cn(
                "w-full py-3 px-3 rounded-xl font-black text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-md cursor-pointer",
                cart.length === 0 || !selectedCustomer || isProcessing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/10"
              )}
            >
              {activeActionLoading === 'ticket' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ReceiptIcon size={15} />
              )}
              <span>{activeActionLoading === 'ticket' ? 'FACTURANDO...' : 'FACTURAR Y TICKET ACLAS'}</span>
            </button>

            {/* Button 3: Enviar Nota por WhatsApp */}
            <button 
              type="button"
              disabled={cart.length === 0 || isProcessing || !selectedCustomer}
              onClick={() => handleCheckout('whatsapp')}
              className={cn(
                "w-full py-3 px-3 rounded-xl font-black text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-md cursor-pointer",
                cart.length === 0 || !selectedCustomer || isProcessing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-emerald-500/20"
              )}
            >
              {activeActionLoading === 'whatsapp' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MessageCircle size={16} />
              )}
              <span>{activeActionLoading === 'whatsapp' ? 'FACTURANDO...' : 'FACTURAR Y ENVIAR WHATSAPP'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
