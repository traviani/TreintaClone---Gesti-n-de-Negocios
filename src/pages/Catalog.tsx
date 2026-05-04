import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency, cn, getGoogleDriveDirectLink } from '../lib/utils';
import { 
  ShoppingCart, 
  Phone, 
  Share2, 
  Check,
  ChevronRight,
  Package,
  Search,
  Copy,
  ExternalLink,
  X,
  Plus,
  Minus,
  MessageCircle,
  Truck,
  Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  isProduction?: boolean;
}

export default function Catalog() {
  const { ownerId: paramOwnerId } = useParams();
  const { user, effectiveUid, loading: authLoading } = useAuth();
  const ownerId = paramOwnerId || effectiveUid;
  
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedType, setCopiedType] = useState<'detal' | 'mayor' | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Get price type from URL: ?type=mayor or ?type=detal (default)
  const priceType = searchParams.get('type') === 'mayor' ? 'mayor' : 'detal';

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalog() {
      // Wait for auth to initialize before checking ownerId
      if (authLoading) return;

      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Filter by ownerId to show only current user's products
        const q = query(
          collection(db, 'products'),
          where('ownerId', '==', ownerId),
          limit(100)
        );
        const snap = await getDocs(q);
        const allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter in memory: show anything that is NOT an ingredient
        const listableProducts = allDocs.filter((p: any) => {
          const isIngredient = p.isIngredient;
          return isIngredient !== true && isIngredient !== 'true';
        });
        
        setProducts(listableProducts);
      } catch (err) {
        console.error("Error fetching catalog", err);
        setError("No pudimos cargar el catálogo. Por favor verifica el enlace.");
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [ownerId, authLoading, paramOwnerId]);

  const addToCart = (product: any) => {
    const price = priceType === 'detal' ? product.price : (product.wholesalePrice || product.price);
    const existing = cart.find(item => item.id === product.id);
    
    // Check if we can add more stock
    if (product.stock <= 0 && !product.isBajoPedido) return;

    if (existing) {
      // Respect stock if not bajo pedido
      if (existing.quantity >= product.stock && !product.isBajoPedido) return;

      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price, 
        quantity: 1, 
        stock: product.stock || 0,
        isProduction: (product.stock || 0) <= 0 || product.isBajoPedido
      }]);
    }
  };

  const removeFromCart = (id: string) => {
    const existing = cart.find(item => item.id === id);
    if (existing?.quantity === 1) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getShareLink = (type: 'detal' | 'mayor') => {
    return `${window.location.origin}/#/catalog/${ownerId}?type=${type}`;
  };

  const copyToClipboard = (type: 'detal' | 'mayor') => {
    const link = getShareLink(type);
    navigator.clipboard.writeText(link);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const filtered = products.filter(p => {
    const search = searchTerm.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!search) return true;
    
    const name = (p.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const category = (p.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return name.includes(search) || category.includes(search);
  });

  const sendWhatsAppOrder = () => {
    const stockItems = cart.filter(item => item.isProduction === false);
    const productionItems = cart.filter(item => item.isProduction === true);

    let message = `🚀 *NUEVO PEDIDO - CATÁLOGO*%0A%0A`;
    message += `Hola! Me gustaría realizar el siguiente pedido:%0A%0A`;

    if (stockItems.length > 0) {
      message += `📦 *PRODUCTOS DISPONIBLES (STOCK):*%0A`;
      stockItems.forEach(item => {
        message += `• ${item.quantity}x ${item.name} (${formatCurrency(item.price)})%0A`;
      });
      message += `%0A`;
    }

    if (productionItems.length > 0) {
      message += `🛠️ *PRODUCTOS PARA FABRICAR (BAJO PEDIDO):*%0A`;
      productionItems.forEach(item => {
        message += `• ${item.quantity}x ${item.name} (${formatCurrency(item.price)})%0A`;
      });
      message += `_(Entiendo que estos productos requieren tiempo de fabricación)_%0A%0A`;
    }

    message += `💰 *TOTAL A PAGAR:* ${formatCurrency(cartTotal)}%0A`;
    message += `🏷️ *TIPO DE PRECIO:* ${priceType === 'detal' ? 'Al Detal' : 'Al Mayor'}%0A%0A`;
    message += `Quedo atento a tus indicaciones para el pago y envío! 🙏`;

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>;

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-italy-gradient">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <X size={40} />
      </div>
      <h1 className="text-2xl font-black italic serif text-slate-900 mb-2">No pudimos cargar el catálogo</h1>
      <p className="text-slate-500 mb-8 max-w-sm">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-italy-gradient font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white text-slate-900 p-2 md:p-2.5 rounded-2xl md:rounded-[1.5rem] sticky top-1 md:top-2 z-50 shadow-md mx-3 md:mx-4 border border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-row items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 md:h-10 bg-slate-50 rounded-lg md:rounded-xl shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden p-1 border border-slate-100">
                <img 
                  src={getGoogleDriveDirectLink('https://drive.google.com/file/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5/view?usp=sharing')} 
                  alt="Logo" 
                  className="h-full w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-sm md:text-lg font-black italic serif tracking-tight text-slate-900">Catálogo Digital</h1>
            </div>
            <div className="flex items-center gap-2">
              {priceType === 'mayor' && (
                <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-widest">
                  Mayorista
                </span>
              )}
              <button 
                  onClick={() => setShowShareOptions(true)}
                  className="bg-white text-slate-900 hover:bg-slate-50 p-1.5 md:p-2 rounded-lg transition-all flex items-center gap-1.5 group border border-slate-200 shadow-sm"
              >
                <Share2 size={12} className="group-hover:scale-110 transition-transform" />
                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Compartir</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar productos..."
              className="w-full pl-9 pr-3 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-300 transition-all font-medium text-slate-900 text-xs placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Product List */}
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {filtered.map(product => (
            <motion.div 
              layout
              key={product.id}
              className="bg-white rounded-3xl border border-slate-100 card-depth hover:shadow-2xl transition-all overflow-hidden group flex flex-col h-full"
            >
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                {product.imageUrl ? (
                    <img 
                      src={getGoogleDriveDirectLink(product.imageUrl)} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <Package size={48} />
                    </div>
                )}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <span className={cn(
                       "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md border flex items-center gap-1.5",
                       product.stock > 0 
                         ? "bg-emerald-500/90 text-white border-emerald-400" 
                         : product.isBajoPedido 
                         ? "bg-amber-500/90 text-white border-amber-400"
                         : "bg-red-500/90 text-white border-red-400"
                   )}>
                       {product.stock > 0 ? <Truck size={10} /> : <Hammer size={10} />}
                       {product.stock > 0 ? 'En Stock' : product.isBajoPedido ? 'Bajo Pedido' : 'Agotado'}
                   </span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-600 transition-colors leading-tight">{product.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic serif bg-slate-50 px-2 py-0.5 rounded mt-2 inline-block">
                    {product.category}
                  </span>
                  <p className="text-xs text-slate-500 mt-4 line-clamp-2 italic leading-relaxed">
                    {product.description || 'Consulta disponibilidad y detalles adicionales con nosotros.'}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">
                          {formatCurrency(priceType === 'detal' ? product.price : (product.wholesalePrice || product.price))}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Precio al {priceType === 'detal' ? 'Detal' : 'Mayor'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {cart.find(item => item.id === product.id) ? (
                        <div className="flex items-center bg-slate-900 text-white rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => removeFromCart(product.id)}
                            className="p-3 hover:bg-white/10 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-black px-2">{cart.find(item => item.id === product.id)?.quantity}</span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="p-3 hover:bg-white/10 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0 && !product.isBajoPedido}
                            className={cn(
                              "flex items-center gap-2 px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-xl font-black text-[10px] uppercase tracking-widest",
                              product.stock <= 0 && !product.isBajoPedido
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
                            )}
                        >
                            <ShoppingCart size={14} />
                            {product.stock <= 0 && !product.isBajoPedido ? 'AGOTADO' : 'AÑADIR'}
                        </button>
                      )}
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
            <div className="py-20 text-center">
                <Package size={64} className="text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-bold italic serif text-xl">No hay productos disponibles por ahora.</p>
            </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-center z-50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Potenciado por TreintaClone</p>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && !showCart && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-24 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-[0_15px_30px_rgba(15,23,42,0.4)] flex items-center gap-2.5 z-[100] group overflow-hidden border border-slate-700"
          >
            <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative flex items-center gap-2.5">
              <div className="relative">
                <ShoppingCart size={18} />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col items-start leading-none">
                <p className="font-black text-[9px] uppercase tracking-wider italic opacity-80">Finalizar pedido</p>
                <p className="font-black text-sm">{formatCurrency(cartTotal)}</p>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black italic serif text-slate-900">Mi Pedido</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {cartCount} {cartCount === 1 ? 'Artículo' : 'Artículos'} añadidos
                  </p>
                </div>
                <button 
                  onClick={() => setShowCart(false)}
                  className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <Package size={24} className="text-slate-200" />
                      {item.isProduction && (
                        <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                          <Hammer size={12} className="text-amber-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mt-1">
                        {formatCurrency(item.price)}
                        {item.isProduction && (
                          <span className="text-amber-500 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded">
                            <Hammer size={8} /> Fabricar
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-black text-xs px-2 w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart({ id: item.id, name: item.name, stock: item.stock, price: item.price })}
                        className="p-2 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="py-20 text-center">
                    <ShoppingCart size={48} className="text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold italic serif">El carrito está vacío</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Total estimado</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(cartTotal)}</span>
                </div>

                <button 
                  disabled={cart.length === 0}
                  onClick={sendWhatsAppOrder}
                  className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <MessageCircle size={20} />
                  Enviar Pedido por WhatsApp
                </button>
                <p className="text-[10px] text-slate-400 text-center font-medium italic">
                  Te redirigiremos a WhatsApp para finalizar los detalles del pago y envío.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareOptions && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareOptions(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-8 card-depth overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]"
            >
              <button 
                onClick={() => setShowShareOptions(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors"
                title="Cerrar"
              >
                <X size={20} className="text-slate-400" />
              </button>

              <h2 className="text-2xl font-black italic serif text-slate-900 mb-2">Compartir Catálogo</h2>
              <p className="text-slate-500 text-sm mb-8">Elige qué tipo de precios quieres enviar hoy:</p>

              <div className="space-y-4">
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                        <ShoppingCart size={20} />
                      </div>
                      <p className="font-bold text-slate-900">Precios al Detal</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-white px-2 py-0.5 rounded-lg shadow-sm">Público</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard('detal')}
                      className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                      {copiedType === 'detal' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copiedType === 'detal' ? '¡Copiado!' : 'Copiar Link'}
                    </button>
                    <a 
                      href={getShareLink('detal')}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                      title="Abrir vista previa"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-amber-200 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Package size={20} />
                      </div>
                      <p className="font-bold text-slate-900">Precios al Mayor</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-white px-2 py-0.5 rounded-lg shadow-sm">Mayoreo</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard('mayor')}
                      className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                      {copiedType === 'mayor' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copiedType === 'mayor' ? '¡Copiado!' : 'Copiar Link'}
                    </button>
                    <a 
                      href={getShareLink('mayor')}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-amber-600 hover:border-amber-200 transition-all"
                      title="Abrir vista previa"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
