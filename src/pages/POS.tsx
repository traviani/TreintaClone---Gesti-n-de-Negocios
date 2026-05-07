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
  doc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn, getGoogleDriveDirectLink } from '../lib/utils';
import { Receipt } from '../components/Receipt';
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  // Discount and Sample state
  const [discount, setDiscount] = useState<number>(0);
  const [isSample, setIsSample] = useState(false);

  // Flow State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleType, setSaleType] = useState<'contado' | 'credito'>('credito');
  const [priceType, setPriceType] = useState<'detal' | 'mayor'>('detal');
  const [searchCustomer, setSearchCustomer] = useState('');

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

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedCustomer) return;
    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      
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
        subtotal,
        discount: isSample ? subtotal : discount,
        isSample,
        total,
        balance: saleType === 'credito' ? total : 0,
        payments: [],
        saleType,
        priceType,
        status: 'completed',
        createdAt: serverTimestamp()
      };

      const saleRef = doc(collection(db, 'sales'));
      batch.set(saleRef, saleData);

      // If Credit, update customer balance
      if (saleType === 'credito') {
        const customerRef = doc(db, 'customers', selectedCustomer.id);
        batch.update(customerRef, {
          balance: increment(total)
        });
      }

      // Update Inventory
      cart.forEach(item => {
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, {
          stock: increment(-item.quantity),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      
      setLastSale({ ...saleData, id: saleRef.id });
      setCart([]);
      setDiscount(0);
      setIsSample(false);
      setShowSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    } finally {
      setIsProcessing(false);
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
    const idNumber = (c.idNumber || '').toLowerCase(); // Usually IDs don't have accents but for safety...
    
    return name.includes(search) || idNumber.includes(search);
  });

  if (showSuccess && lastSale) {
    return (
        <div className="fixed inset-0 bg-app-background z-50 flex flex-col items-center justify-start p-4 overflow-y-auto print:p-0 print:bg-white print:block">
            <div className="h-full min-h-max py-8 flex flex-col items-center">
              <Receipt sale={lastSale} onSecondaryAction={() => {
                  setShowSuccess(false);
                  setLastSale(null);
                  setSelectedCustomer(null);
                  setSaleType('credito');
              }} />
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
                <button onClick={() => setSelectedCustomer(null)} className="text-blue-600 text-xs font-bold hover:underline italic">Cambiar</button>
              )}
            </div>
            
              {!selectedCustomer ? (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar cliente..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                  />
                  {searchCustomer && filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-2">
                       {filteredCustomers.map(c => (
                        <button 
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setSearchCustomer('');
                          }}
                          className="w-full text-left p-3 hover:bg-teal-50 rounded-xl transition-all border border-transparent hover:border-teal-100 group flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.idNumber}</p>
                          </div>
                          <ChevronRight size={14} className="text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-teal-50/50 p-3 rounded-2xl border border-teal-100">
                <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black italic">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900 uppercase">{selectedCustomer.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest">{selectedCustomer.idNumber}</p>
                </div>
                <CheckCircle2 className="text-primary" size={20} />
              </div>
            )}
          </div>

          {/* Combined Step 2 & 3: Condicion y Tarifa */}
          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            {/* Step 2: Sale Type */}
            <div className={cn(
              "bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 transition-all",
              !selectedCustomer && "opacity-40 pointer-events-none grayscale"
            )}>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">2. Condición</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setSaleType('contado')}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black italic transition-all border-2",
                    saleType === 'contado' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-slate-50 border-transparent text-slate-400"
                  )}
                >
                  DE CONTADO
                </button>
                <button 
                  onClick={() => setSaleType('credito')}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black italic transition-all border-2",
                    saleType === 'credito' ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-slate-50 border-transparent text-slate-400"
                  )}
                >
                  CRÉDITO
                </button>
              </div>
            </div>

            {/* Step 3: Price Type (Tarifa) */}
            <div className={cn(
              "bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 transition-all",
              !selectedCustomer && "opacity-40 pointer-events-none grayscale"
            )}>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">3. Tarifa</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setPriceType('detal')}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black italic transition-all border-2",
                    priceType === 'detal' ? "bg-primary border-primary/50 text-white shadow-sm" : "bg-slate-50 border-transparent text-slate-400"
                  )}
                >
                  DETAL (PVP)
                </button>
                <button 
                  onClick={() => setPriceType('mayor')}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black italic transition-all border-2",
                    priceType === 'mayor' ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm" : "bg-slate-50 border-transparent text-slate-400"
                  )}
                >
                  MAYORISTA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Section: Search and List */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all",
          !selectedCustomer && "opacity-20 pointer-events-none blur-[2px]"
        )}>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar productos por nombre o categoría..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[2rem] outline-none shadow-xl shadow-slate-100 focus:ring-2 focus:ring-primary/50 transition-all font-bold italic"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <motion.button
                  layout
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0 && !product.isBajoPedido}
                  className={cn(
                    "rounded-3xl border text-left flex flex-col h-64 transition-all group relative overflow-hidden",
                    (product.stock <= 0 && !product.isBajoPedido)
                    ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" 
                    : "bg-white border-slate-200 hover:border-blue-500 hover:shadow-2xl active:scale-95"
                  )}
                >
                  {/* Imagen del Producto - Ancho completo */}
                  <div className="h-32 w-full bg-slate-50 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img 
                        src={getGoogleDriveDirectLink(product.imageUrl)} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <ShoppingCart size={32} />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight line-clamp-2 text-sm">{product.name}</h3>
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary bg-teal-50 px-1.5 py-0.5 rounded italic mt-1 inline-block">
                          {product.category}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-right">
                      <p className="text-2xl font-black text-slate-900 flex items-baseline gap-1 tracking-tighter">
                        <span className="text-xs text-slate-400 font-bold">$</span>
                        {formatCurrency(priceType === 'mayor' && product.wholesalePrice ? product.wholesalePrice : product.price).replace('$','')}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                          <div className={cn("w-1.5 h-1.5 rounded-full", product.stock <= 0 ? "bg-amber-500" : product.stock <= 5 ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                          <p className={cn("text-[10px] font-bold uppercase", product.stock <= 0 ? "text-amber-600" : product.stock <= 5 ? "text-amber-500" : "text-slate-400")}>
                            {product.stock > 0 ? `${product.stock} ${product.unit || 'und'}` : product.isBajoPedido ? "Bajo Pedido" : "Agotado"}
                          </p>
                      </div>
                    </div>
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
        "w-full lg:w-[400px] flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative transition-all",
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
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 text-slate-400 hover:text-blue-600"><Minus size={12} /></button>
                  <span className="w-6 text-center text-xs font-black tabular-nums">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 text-slate-400 hover:text-blue-600"><Plus size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-500 bg-white hover:bg-red-50 rounded-xl transition-all border border-slate-100"><Trash2 size={14} /></button>
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

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
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

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/#/catalog/${effectiveUid}?type=detal`;
                    navigator.clipboard.writeText(url);
                    alert("✅ Enlace DETAL copiado con éxito.");
                  }}
                  className="flex-1 py-2 bg-teal-50 text-primary rounded-xl font-black text-[9px] uppercase tracking-widest border border-teal-100 flex items-center justify-center gap-1 hover:bg-teal-100 transition-colors"
                >
                  <ShoppingCart size={12} />
                  DETAL
                </button>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/#/catalog/${effectiveUid}?type=mayor`;
                    navigator.clipboard.writeText(url);
                    alert("✅ Enlace MAYORISTA copiado con éxito.");
                  }}
                  className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-purple-100 flex items-center justify-center gap-1 hover:bg-purple-100 transition-colors"
                >
                  <Package size={12} />
                  MAYOR
                </button>
              </div>

            <button 
              disabled={cart.length === 0 || isProcessing || !selectedCustomer}
              onClick={handleCheckout}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-base transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-lg",
                cart.length === 0 || !selectedCustomer
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-primary hover:opacity-90 text-white shadow-primary/20"
              )}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  FACTURAR
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
