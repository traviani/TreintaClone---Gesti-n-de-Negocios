import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  runTransaction, 
  doc,
  addDoc 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn, getGoogleDriveDirectLink } from '../lib/utils';
import { getProductEffectiveCost } from '../lib/recipeUtils';
import { Receipt, sendSaleWhatsApp } from '../components/Receipt';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  User, 
  UserPlus,
  CheckCircle2, 
  ArrowLeft,
  ArrowRight,
  X, 
  Printer, 
  Receipt as ReceiptIcon,
  MessageCircle,
  ExternalLink,
  ChevronDown, 
  Package,
  CreditCard,
  Banknote,
  DollarSign,
  Building2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  cost?: number | string;
  recipe?: any[];
  recipeYield?: number | string;
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
  const [activeActionLoading, setActiveActionLoading] = useState<'letter' | 'ticket' | 'whatsapp' | 'process_only' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [autoReceiptTrigger, setAutoReceiptTrigger] = useState<'letter' | 'ticket' | 'whatsapp' | undefined>(undefined);

  // Mobile Responsive State
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');
  const [showConfigMobile, setShowConfigMobile] = useState<boolean>(true);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Discount and Sample state
  const [discount, setDiscount] = useState<number>(0);
  const [isSample, setIsSample] = useState(false);

  // Flow State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleType, setSaleType] = useState<'contado' | 'credito'>('contado');
  const [priceType, setPriceType] = useState<'detal' | 'mayor'>('detal');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Payment Method for Contado
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo ($ USD)');
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Quick Customer Creation Modal state
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustIdNumber, setNewCustIdNumber] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustPriceType, setNewCustPriceType] = useState<'detal' | 'mayor'>('detal');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const PAYMENT_METHODS = [
    { id: 'Efectivo ($ USD)', label: 'Efectivo ($ USD)' },
    { id: 'Pago Móvil', label: 'Pago Móvil' },
    { id: 'Transferencia Bancaria', label: 'Transferencia' },
    { id: 'Divisas / Efectivo (Bs.)', label: 'Efectivo (Bs.)' },
    { id: 'Punto de Venta / Tarjeta', label: 'Punto de Venta' },
    { id: 'Zelle', label: 'Zelle' },
    { id: 'Binance', label: 'Binance' },
    { id: 'Otro', label: 'Otro' },
  ];

  const handleOpenNewCustomerModal = (presetName: string = '') => {
    setNewCustName(presetName || searchCustomer || '');
    setNewCustIdNumber('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustPriceType(priceType);
    setShowNewCustomerModal(true);
    setShowCustomerDropdown(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('Por favor ingresa el nombre o razón social del cliente.');
      return;
    }

    setIsSavingCustomer(true);
    try {
      const customerData = {
        name: newCustName.trim(),
        idNumber: newCustIdNumber.trim() || 'No registrado',
        phone: newCustPhone.trim() || '',
        address: newCustAddress.trim() || '',
        email: '',
        priceType: newCustPriceType,
        balance: 0,
        ownerId: effectiveUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'customers'), customerData);
      
      const newCustomer: Customer = {
        id: docRef.id,
        ...customerData,
      };

      setSelectedCustomer(newCustomer);
      setPriceType(newCustPriceType);
      setShowNewCustomerModal(false);
      setSearchCustomer('');
      setNewCustName('');
      setNewCustIdNumber('');
      setNewCustPhone('');
      setNewCustAddress('');
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      alert('Error al registrar el cliente. Por favor intente nuevamente.');
      handleFirestoreError(error, OperationType.WRITE, 'customers');
    } finally {
      setIsSavingCustomer(false);
    }
  };

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

  const handleCheckout = async (actionType: 'letter' | 'ticket' | 'whatsapp' | 'process_only') => {
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

        const currentPaymentMethod = saleType === 'contado' ? (paymentMethod || 'Efectivo ($ USD)') : 'Crédito';
        const cleanRef = paymentReference ? paymentReference.trim() : '';

        const paymentsList = saleType === 'contado' && currentTotal > 0 ? [
          {
            amount: currentTotal,
            date: new Date().toISOString(),
            method: currentPaymentMethod,
            reference: cleanRef,
            note: cleanRef 
              ? `Pago de contado (${currentPaymentMethod}) - Ref: ${cleanRef}`
              : `Pago de contado (${currentPaymentMethod})`
          }
        ] : [];

        const saleRef = doc(collection(db, 'sales'));
        const saleData = {
          ownerId: effectiveUid,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerIdNumber: selectedCustomer.idNumber || '',
          customerPhone: selectedCustomer.phone || '',
          customerAddress: selectedCustomer.address || '',
          items: cart.map(item => {
            const productCost = getProductEffectiveCost(item, products);
            return {
              productId: item.id,
              name: item.name,
              price: priceType === 'mayor' && item.wholesalePrice ? item.wholesalePrice : item.price,
              cost: productCost,
              quantity: item.quantity,
              isBajoPedido: item.stock <= 0 || item.isBajoPedido
            };
          }),
          hasBajoPedido: cart.some(item => item.stock <= 0 || item.isBajoPedido),
          subtotal: currentSubtotal,
          discount: isSample ? currentSubtotal : discount,
          isSample,
          total: currentTotal,
          paidAmount: saleType === 'contado' ? currentTotal : 0,
          balance: saleType === 'credito' ? currentTotal : 0,
          payments: paymentsList,
          paymentMethod: currentPaymentMethod,
          paymentReference: cleanRef,
          saleType,
          priceType,
          status: 'completed',
          invoiceNumber: nextInvoiceNumber,
          createdAt: serverTimestamp()
        };

        transaction.set(saleRef, saleData);

        // 3. Update Customer Balance (only if credit sale)
        if (saleType === 'credito') {
          const customerRef = doc(db, 'customers', selectedCustomer.id);
          transaction.update(customerRef, {
            balance: increment(currentTotal),
            updatedAt: serverTimestamp()
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

        if (actionType === 'process_only') {
          setAutoReceiptTrigger(undefined);
        } else {
          setAutoReceiptTrigger(actionType);
        }

        setLastSale(saleWithId);
        setCart([]);
        setDiscount(0);
        setIsSample(false);
        setPaymentReference('');
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

  return (
    <div className="min-h-[calc(100vh-90px)] lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 lg:gap-6 print:hidden relative pb-24 lg:pb-0">
      
      {/* Mobile Sticky Segmented Header (< lg screens) */}
      <div className="lg:hidden sticky top-0 z-30 bg-app-background/95 backdrop-blur-md pt-1 pb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileTab('products')}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border",
            mobileTab === 'products'
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50"
          )}
        >
          <Package size={15} />
          <span>1. Catálogo ({filteredProducts.length})</span>
        </button>
        
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border relative",
            mobileTab === 'cart'
              ? "bg-teal-700 text-white border-teal-700 shadow-md"
              : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50"
          )}
        >
          <ShoppingCart size={15} />
          <span>2. Carrito</span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-black ml-0.5",
            mobileTab === 'cart' ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
          )}>
            {cart.length} {cart.length > 0 ? `· ${formatCurrency(total)}` : ''}
          </span>
        </button>
      </div>

      {/* Main Content Area: Controls + Products */}
      <div className={cn(
        "flex-1 flex flex-col gap-4 lg:gap-6 min-w-0 lg:overflow-hidden",
        mobileTab === 'cart' ? "hidden lg:flex" : "flex"
      )}>
        
        {/* Top Controls: Customer, Tarifa, Condición & Forma de Pago */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          {/* Header with Mobile Collapse Toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 italic">
                Configuración de Venta
              </span>
              {selectedCustomer && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 truncate max-w-[200px]">
                  {selectedCustomer.name} · {priceType.toUpperCase()} · {saleType.toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowConfigMobile(!showConfigMobile)}
              className="lg:hidden text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200"
            >
              <span>{showConfigMobile ? 'Ocultar' : 'Configurar'}</span>
              <ChevronDown size={14} className={cn("transition-transform duration-200", !showConfigMobile && "-rotate-90")} />
            </button>
          </div>

          <div className={cn(
            "grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 transition-all",
            !showConfigMobile && "hidden lg:grid"
          )}>
            
            {/* Step 1: Customer Selection */}
            <div className="md:col-span-5 bg-slate-50/50 p-3 sm:p-4 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">1. Cliente</h3>
                {selectedCustomer ? (
                  <button 
                    type="button"
                    onClick={() => setSelectedCustomer(null)} 
                    className="text-blue-600 text-xs font-bold hover:underline italic cursor-pointer"
                  >
                    Cambiar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenNewCustomerModal()}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-xl transition-all border border-teal-200/60 cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>+ Nuevo</span>
                  </button>
                )}
              </div>
              
              {!selectedCustomer ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar cliente o escribir nombre..."
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer font-medium"
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
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map(c => (
                              <button 
                                key={c.id}
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setSearchCustomer('');
                                  setShowCustomerDropdown(false);
                                }}
                                className="w-full text-left p-2.5 hover:bg-teal-50 rounded-xl transition-all border border-transparent hover:border-teal-100 group flex items-center justify-between mb-1 last:mb-0 cursor-pointer"
                              >
                                <div>
                                  <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-800">{c.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.idNumber || 'Sin C.I/RIF'}</span>
                                    <span className={cn(
                                      "text-[9px] font-black px-1.5 py-0.2 rounded uppercase",
                                      c.priceType === 'mayor' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                                    )}>
                                      {c.priceType === 'mayor' ? 'Mayor' : 'Detal'}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-700 group-hover:translate-x-1 transition-all shrink-0" />
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center">
                              <p className="text-xs text-slate-400">No se encontraron clientes coincidentes</p>
                            </div>
                          )}

                          <div className="pt-2 mt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleOpenNewCustomerModal(searchCustomer)}
                              className="w-full text-left p-2.5 bg-teal-50 hover:bg-teal-100/90 rounded-xl text-teal-900 text-xs font-bold flex items-center gap-2 border border-teal-200/70 transition-colors cursor-pointer"
                            >
                              <UserPlus size={15} className="text-teal-700 shrink-0" />
                              <span className="truncate">
                                {searchCustomer.trim() ? `+ Registrar "${searchCustomer.trim()}" como cliente` : '+ Registrar un nuevo cliente'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenNewCustomerModal(searchCustomer)}
                    title="Registrar nuevo cliente"
                    className="px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-teal-100/80 rounded-xl flex items-center justify-center text-teal-800 font-bold shrink-0">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{selectedCustomer.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium truncate">CI/RIF: {selectedCustomer.idNumber || 'No registrado'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider",
                      priceType === 'mayor' ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-blue-50 text-blue-800 border border-blue-200"
                    )}>
                      Tarifa {priceType}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="text-[10px] font-bold text-slate-500">
                        {selectedCustomer.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Tipo de Tarifa (Detal / Mayor) */}
            <div className="md:col-span-3 bg-slate-50/50 p-3 sm:p-4 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">2. Tarifa</h3>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border",
                  priceType === 'mayor' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-700 border-slate-200"
                )}>
                  {priceType === 'mayor' ? 'Mayorista' : 'Detal'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-2xl border border-slate-200">
                <button 
                  type="button"
                  onClick={() => setPriceType('detal')}
                  className={cn(
                    "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                    priceType === 'detal' 
                      ? "bg-slate-900 text-white shadow-sm font-black" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Detal
                </button>
                <button 
                  type="button"
                  onClick={() => setPriceType('mayor')}
                  className={cn(
                    "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                    priceType === 'mayor' 
                      ? "bg-purple-700 text-white shadow-sm font-black" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Mayor
                </button>
              </div>
              
              <p className="text-[10px] font-medium text-slate-400 text-center">
                {priceType === 'mayor' ? 'Precios de venta al mayor aplicados' : 'Precios de venta al detal (PVP)'}
              </p>
            </div>

            {/* Step 3: Condición y Forma de Pago */}
            <div className="md:col-span-4 bg-slate-50/50 p-3 sm:p-4 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic serif">3. Condición y Pago</h3>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border",
                  saleType === 'contado' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                )}>
                  {saleType === 'contado' ? 'De Contado' : 'A Crédito'}
                </span>
              </div>

              {/* Condición toggle: Contado vs Crédito */}
              <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-2xl border border-slate-200">
                <button 
                  type="button"
                  onClick={() => setSaleType('contado')}
                  className={cn(
                    "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                    saleType === 'contado' 
                      ? "bg-emerald-600 text-white shadow-sm font-black" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Contado
                </button>
                <button 
                  type="button"
                  onClick={() => setSaleType('credito')}
                  className={cn(
                    "py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer",
                    saleType === 'credito' 
                      ? "bg-amber-600 text-white shadow-sm font-black" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Crédito
                </button>
              </div>

              {/* If Contado: Payment Method & Reference */}
              {saleType === 'contado' ? (
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                      >
                        {PAYMENT_METHODS.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input 
                    type="text"
                    placeholder="Ref. o comprobante (opcional)"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-400 font-medium"
                  />
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 text-[11px] text-amber-800 font-medium leading-snug">
                  ⚠️ <span className="font-bold">Venta a Crédito:</span> Se registrará como deuda en la cuenta por cobrar del cliente.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          {/* Search Header */}
          <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar por nombre de producto..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center justify-between">
              <span>{filteredProducts.length} Productos</span>
              <span className="lg:hidden text-teal-700 font-black">Toca para agregar</span>
            </div>
          </div>

          {/* Products Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredProducts.map(p => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0 && !p.isBajoPedido}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group relative overflow-hidden cursor-pointer",
                    p.stock <= 0 && !p.isBajoPedido
                      ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md active:border-teal-500"
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

      {/* Cart Sidebar / View */}
      <div className={cn(
        "w-full lg:w-[420px] flex flex-col bg-white rounded-3xl lg:rounded-[2.5rem] border border-slate-200 shadow-xl lg:shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden relative transition-all",
        mobileTab === 'products' ? "hidden lg:flex" : "flex",
        !selectedCustomer && "lg:opacity-30 lg:pointer-events-none"
      )}>
        {/* Mobile Header to go back to products */}
        <div className="lg:hidden p-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileTab('products')}
            className="text-xs font-black text-slate-700 hover:text-slate-900 flex items-center gap-1.5 py-1.5 px-3 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>← Seguir Agregando Productos</span>
          </button>
          <span className="text-[11px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
            {cart.length} ítems
          </span>
        </div>
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
                setCopyNotice('✅ Enlace DETAL copiado con éxito');
                setTimeout(() => setCopyNotice(null), 3000);
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
                setCopyNotice('✅ Enlace MAYORISTA copiado con éxito');
                setTimeout(() => setCopyNotice(null), 3000);
              }}
              className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-purple-100 flex items-center justify-center gap-1 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Package size={12} />
              MAYOR
            </button>
          </div>

          {copyNotice && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 animate-in fade-in duration-150">
              {copyNotice}
            </div>
          )}

          {/* Current Sale Configuration Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Cliente:</span>
              <span className={cn(
                "font-bold truncate max-w-[170px]",
                selectedCustomer ? "text-slate-900" : "text-amber-600 italic"
              )}>
                {selectedCustomer ? selectedCustomer.name : 'Sin seleccionar'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tarifa:</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                priceType === 'mayor' ? "bg-purple-100 text-purple-700" : "bg-blue-50 text-blue-700"
              )}>
                {priceType === 'mayor' ? 'Mayor' : 'Detal'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Condición:</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                saleType === 'contado' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              )}>
                {saleType === 'contado' ? `Contado (${paymentMethod})` : 'Crédito'}
              </span>
            </div>
          </div>

          {!selectedCustomer && (
            <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-2.5 text-[11px] text-amber-800 flex items-center justify-between gap-2">
              <span className="font-semibold">⚠️ Selecciona o registra un cliente para facturar</span>
              <button
                type="button"
                onClick={() => handleOpenNewCustomerModal()}
                className="text-[10px] font-bold bg-amber-200/60 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                + Crear
              </button>
            </div>
          )}

          {/* Direct POS Billing & Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
              Acciones de Venta
            </p>

            {/* Main Action: SOLO PROCESAR VENTA (Sin Imprimir) */}
            <button 
              type="button"
              disabled={cart.length === 0 || isProcessing || !selectedCustomer}
              onClick={() => handleCheckout('process_only')}
              className={cn(
                "w-full py-3.5 px-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all transform active:scale-95 flex items-center justify-center gap-2.5 shadow-md cursor-pointer border",
                cart.length === 0 || !selectedCustomer || isProcessing
                  ? "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed shadow-none" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20"
              )}
            >
              {activeActionLoading === 'process_only' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={19} className="shrink-0" />
              )}
              <div className="flex flex-col items-center leading-tight">
                <span className="tracking-wide">{activeActionLoading === 'process_only' ? 'PROCESANDO VENTA...' : 'SOLO PROCESAR VENTA'}</span>
                <span className="text-[9px] font-normal opacity-90 font-sans tracking-normal">
                  Guarda la venta e inventario sin enviar a impresora
                </span>
              </div>
            </button>

            {/* Divider */}
            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">o facturar con emisión</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Button 1: Imprimir Hoja Carta (2 Copias) */}
            <button 
              type="button"
              disabled={cart.length === 0 || isProcessing || !selectedCustomer}
              onClick={() => handleCheckout('letter')}
              className={cn(
                "w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer",
                cart.length === 0 || !selectedCustomer || isProcessing
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
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
                "w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer",
                cart.length === 0 || !selectedCustomer || isProcessing
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
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
                "w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer",
                cart.length === 0 || !selectedCustomer || isProcessing
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
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

      {/* Mobile Floating Checkout Pill at Bottom */}
      {mobileTab === 'products' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between font-black text-xs border border-slate-700 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-xs shadow-inner">
                {cart.length}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total en Carrito</div>
                <div className="text-sm font-black text-emerald-400 tabular-nums">{formatCurrency(total)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 py-2 px-3 rounded-xl text-white font-black text-[11px] uppercase tracking-wider transition-colors shadow-sm">
              <span>Revisar y Cobrar</span>
              <ArrowRight size={14} />
            </div>
          </button>
        </div>
      )}

      {/* Quick Customer Creation Modal */}
      <AnimatePresence>
        {showNewCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Registrar Nuevo Cliente</h3>
                    <p className="text-xs text-slate-500 font-medium">Se añadirá al directorio y se seleccionará de inmediato para esta venta</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre o Razón Social <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Los Andes / Juan Pérez"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      C.I. / RIF
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. J-12345678-0 o V-12345678"
                      value={newCustIdNumber}
                      onChange={(e) => setNewCustIdNumber(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. +58 412 1234567"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dirección o Zona de Despacho
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Principal, Galpón 4, Localidad..."
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tarifa Predeterminada
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewCustPriceType('detal')}
                      className={cn(
                        "py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer",
                        newCustPriceType === 'detal'
                          ? "bg-teal-50 border-teal-500 text-teal-800 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Detal (PVP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCustPriceType('mayor')}
                      className={cn(
                        "py-2.5 px-4 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer",
                        newCustPriceType === 'mayor'
                          ? "bg-purple-50 border-purple-500 text-purple-800 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Mayorista
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(false)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCustomer || !newCustName.trim()}
                    className={cn(
                      "px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-teal-700 hover:bg-teal-800 transition-all shadow-md flex items-center gap-2 cursor-pointer",
                      (isSavingCustomer || !newCustName.trim()) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSavingCustomer ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Guardar y Seleccionar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Off-screen or Modal Receipt Rendering for Printing and Preview */}
      {lastSale && (showReceiptModal || autoReceiptTrigger) && (
        <div 
          className={cn(
            showReceiptModal 
              ? "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col items-center justify-start p-4 overflow-y-auto" 
              : "fixed -left-[9999px] top-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="w-full max-w-4xl py-6 flex flex-col items-center">
            <Receipt 
              sale={lastSale} 
              initialFormat={autoReceiptTrigger === 'ticket' ? 'ticket' : 'letter'}
              autoTrigger={autoReceiptTrigger}
              onSecondaryAction={() => {
                setShowReceiptModal(false);
                setShowSuccess(false);
                setLastSale(null);
                setAutoReceiptTrigger(undefined);
                setSelectedCustomer(null);
                setSaleType('contado');
                setPaymentMethod('Efectivo ($ USD)');
                setPaymentReference('');
              }} 
            />
          </div>
        </div>
      )}

      {/* High-Clarity Success Dialog Over the Active POS Worksheet */}
      <AnimatePresence>
        {showSuccess && lastSale && !showReceiptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center relative"
            >
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  setLastSale(null);
                  setAutoReceiptTrigger(undefined);
                  setSelectedCustomer(null);
                  setSaleType('contado');
                  setPaymentMethod('Efectivo ($ USD)');
                  setPaymentReference('');
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Cerrar y volver a la hoja de trabajo"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-1">
                ¡Venta Registrada Exitosamente!
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">
                Factura Nº #{lastSale.invoiceNumber || '---'}
              </p>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-5 text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Cliente:</span>
                  <span className="font-black text-slate-800">{lastSale.customerName || 'Cliente General'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Condición:</span>
                  <span className={cn(
                    "font-black px-2 py-0.5 rounded-md text-[10px] uppercase",
                    lastSale.saleType === 'credito' ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  )}>
                    {lastSale.saleType === 'credito' ? 'A Crédito' : `Contado (${lastSale.paymentMethod || 'Efectivo'})`}
                  </span>
                </div>
                {lastSale.paymentReference && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Referencia:</span>
                    <span className="font-bold text-slate-700 font-mono text-[11px]">{lastSale.paymentReference}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-black uppercase">Total Facturado:</span>
                  <span className="text-base font-black text-emerald-700">{formatCurrency(lastSale.total)}</span>
                </div>
              </div>

              {/* Quick Print/WhatsApp Actions */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAutoReceiptTrigger('letter');
                    setShowReceiptModal(true);
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Reimprimir en Hoja Carta"
                >
                  <Printer size={16} />
                  <span className="text-[10px] font-black uppercase">Carta (2x)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAutoReceiptTrigger('ticket');
                    setShowReceiptModal(true);
                  }}
                  className="p-2.5 bg-teal-50 hover:bg-teal-100 active:scale-95 text-teal-800 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Reimprimir en Ticket Térmico Aclas PP7X"
                >
                  <ReceiptIcon size={16} />
                  <span className="text-[10px] font-black uppercase">Ticket Aclas</span>
                </button>

                <button
                  type="button"
                  onClick={() => sendSaleWhatsApp(lastSale)}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Reenviar comprobante por WhatsApp"
                >
                  <MessageCircle size={16} />
                  <span className="text-[10px] font-black uppercase">WhatsApp</span>
                </button>
              </div>

              {/* Direct Aclas External Tab Link (Guaranteed print on physical thermal printer) */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    const printUrl = `${window.location.origin}/#/receipt/${lastSale.id}?format=ticket&print=true`;
                    window.open(printUrl, '_blank');
                  }}
                  className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Abre el ticket en pestaña limpia para imprimir directo a la Aclas sin bloqueos"
                >
                  <ExternalLink size={14} />
                  <span>Abrir e Imprimir Ticket Aclas (80mm)</span>
                </button>
              </div>

              {/* Primary Action: Return to Workspace */}
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  setLastSale(null);
                  setAutoReceiptTrigger(undefined);
                  setSelectedCustomer(null);
                  setSaleType('contado');
                  setPaymentMethod('Efectivo ($ USD)');
                  setPaymentReference('');
                }}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer mb-3"
              >
                <ArrowLeft size={16} />
                <span>Regresar a la Hoja de Trabajo (Nueva Venta)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Ver comprobante completo en pantalla →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
