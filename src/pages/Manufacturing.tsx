import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  writeBatch,
  doc,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, 
  Loader, 
  Trash2, 
  Utensils,
  Play,
  X,
  Package,
  Layers,
  History,
  ArrowRight,
  RotateCcw,
  CreditCard,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  stock: number;
  unit?: string;
  cost?: number;
  price?: number;
  wholesalePrice?: number;
  isFinishedProduct?: boolean;
  isIngredient?: boolean;
}

interface Recipe {
  id: string;
  productId: string;
  ingredients: { ingredientId: string; quantity: number; unit?: string }[];
  yield?: number;
}

interface ProductionLog {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  ingredients: { ingredientId: string; quantity: number; name: string; unit: string; cost: number }[];
  totalCost: number;
  createdAt: any;
}

interface PendingItem {
  productId: string;
  name: string;
  quantity: number;
  totalSales: number;
}

export default function Manufacturing() {
  const { user, effectiveUid } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [activeTab, setActiveTab] = useState<'formulas' | 'workshop'>('formulas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<{ ingredientId: string; quantity: number; unit?: string }[]>([]);
  const [isProducing, setIsProducing] = useState<string | null>(null);
  const [batchAmounts, setBatchAmounts] = useState<Record<string, number>>({});
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [recipeYield, setRecipeYield] = useState<number>(1);

  const getNormalizedQuantity = (ingredientId: string, quantity: number, targetUnit: string) => {
    const ingredient = products.find(p => p.id === ingredientId);
    if (!ingredient) return quantity;
    
    const baseUnitRaw = ingredient.unit || 'unid';
    const tu = targetUnit?.toLowerCase().trim();
    const bu = baseUnitRaw?.toLowerCase().trim();
    
    let effectiveQuantity = Number(quantity);
    
    // Normalizar a unidad base (kg, lt, unid)
    if ((bu === 'kg' || bu === 'kilogramo' || bu === 'kilo') && (tu === 'gr' || tu === 'gramo' || tu === 'g')) {
      effectiveQuantity = quantity / 1000;
    } else if ((bu === 'gr' || bu === 'gramo' || bu === 'g') && (tu === 'kg' || tu === 'kilogramo' || tu === 'kilo')) {
      effectiveQuantity = quantity * 1000;
    } else if ((bu === 'lt' || bu === 'litro' || bu === 'l') && (tu === 'ml' || tu === 'mililitro')) {
      effectiveQuantity = quantity / 1000;
    } else if ((bu === 'ml' || bu === 'mililitro') && (tu === 'lt' || tu === 'litro' || tu === 'l')) {
      effectiveQuantity = quantity * 1000;
    }
    
    return effectiveQuantity;
  };

  const getDisplayUnitCost = (baseCost: number, baseUnit: string, targetUnit: string) => {
    const bu = baseUnit?.toLowerCase().trim();
    const tu = targetUnit?.toLowerCase().trim();

    if ((bu === 'kg' || bu === 'kilogramo' || bu === 'kilo') && (tu === 'gr' || tu === 'gramo' || tu === 'g')) {
      return baseCost / 1000;
    }
    if ((bu === 'gr' || bu === 'gramo' || bu === 'g') && (tu === 'kg' || tu === 'kilogramo' || tu === 'kilo')) {
      return baseCost * 1000;
    }
    if ((bu === 'lt' || bu === 'litro' || bu === 'l') && (tu === 'ml' || tu === 'mililitro')) {
      return baseCost / 1000;
    }
    if ((bu === 'ml' || bu === 'mililitro') && (tu === 'lt' || tu === 'litro' || tu === 'l')) {
      return baseCost * 1000;
    }
    return baseCost;
  };

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    const pq = query(collection(db, 'products'), where('ownerId', 'in', allowedOwnerIds));
    const rq = query(collection(db, 'recipes'), where('ownerId', 'in', allowedOwnerIds));
    const lq = query(collection(db, 'production_logs'), where('ownerId', 'in', allowedOwnerIds));

    const unsubProducts = onSnapshot(pq, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubRecipes = onSnapshot(rq, (snap) => {
      setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recipes'));

    const unsubLogs = onSnapshot(lq, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductionLog));
      setProductionLogs(data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'production_logs'));

    return () => { unsubProducts(); unsubRecipes(); unsubLogs(); };
  }, [effectiveUid]);

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    // Fetch sales with pending orders
    const q = query(
      collection(db, 'sales'),
      where('ownerId', 'in', allowedOwnerIds),
      where('hasBajoPedido', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const aggregates: Record<string, PendingItem> = {};
      
      snapshot.docs.forEach(doc => {
        const sale = doc.data();
        (sale.items || []).forEach((item: any) => {
          if (item.isBajoPedido) {
            if (!aggregates[item.productId]) {
              aggregates[item.productId] = {
                productId: item.productId,
                name: item.name,
                quantity: 0,
                totalSales: 0
              };
            }
            aggregates[item.productId].quantity += item.quantity;
            aggregates[item.productId].totalSales += 1;
          }
        });
      });

      setPendingItems(Object.values(aggregates));
    });

    return unsubscribe;
  }, [effectiveUid]);

  const addIngredientToRecipe = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: '', quantity: 1 }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!selectedProduct || recipeIngredients.length === 0) return;

    try {
      const recipeRef = doc(db, 'recipes', `recipe_${selectedProduct}`);
      await setDoc(recipeRef, {
        productId: selectedProduct,
        yield: recipeYield || 1,
        ingredients: recipeIngredients.map(ing => ({
          ingredientId: ing.ingredientId,
          unit: ing.unit || products.find(p => p.id === ing.ingredientId)?.unit || 'unid',
          quantity: ing.quantity
        })),
        ownerId: effectiveUid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      // Calculate cost per unit to update product cost
      const totalCostRaw = recipeIngredients.reduce((acc, ing) => {
        const ingProduct = products.find(p => p.id === ing.ingredientId);
        // CRITICAL: Must use normalized quantity for cost calculation
        const normalizedQty = getNormalizedQuantity(ing.ingredientId, ing.quantity, ing.unit || ingProduct?.unit || 'unid');
        return acc + (Number(ingProduct?.cost || 0) * normalizedQty);
      }, 0);
      const costPerUnit = totalCostRaw / (recipeYield || 1);

      await updateDoc(doc(db, 'products', selectedProduct), {
        cost: costPerUnit,
        updatedAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setRecipeIngredients([]);
      setSelectedProduct('');
      setRecipeYield(1);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recipes');
    }
  };

  const produceBatch = async (recipe: Recipe, amount: any = 1) => {
    // If no explicit user, use the effective ID which should be at least the shared ID
    const targetUid = effectiveUid || DEFAULT_OWNER_ID;
    setIsProducing(recipe.id);

    const numAmount = Number(amount);
    const yieldFactor = Number(recipe.yield || 1);
    
    if (!numAmount || numAmount <= 0) {
      alert('Por favor ingrese una cantidad válida a producir.');
      setIsProducing(null);
      return;
    }

    try {
      // 1. Validate Stock first (Client side check for better UX)
      const missingItems: string[] = [];
      recipe.ingredients.forEach(ing => {
        const ingProduct = products.find(p => p.id === ing.ingredientId);
        const normalizedQty = getNormalizedQuantity(ing.ingredientId, ing.quantity, ing.unit || 'unid');
        const required = (normalizedQty / yieldFactor) * numAmount;
        const currentStock = Number(ingProduct?.stock || 0);
        
        if (currentStock < required) {
          const diff = required - currentStock;
          missingItems.push(`${ingProduct?.name || 'Insumo'}: faltan ${diff.toFixed(2)} ${ingProduct?.unit || 'unid'}`);
        }
      });

      if (missingItems.length > 0) {
        alert(`No hay stock suficiente para producir este lote.\n\n${missingItems.join('\n')}`);
        setIsProducing(null);
        return;
      }

      const batch = writeBatch(db);
      const product = products.find(p => p.id === recipe.productId);
      
      const logIngredients: any[] = [];
      let totalCostOfIngredientsUsed = 0;

      // 2. Deduct ingredients
      recipe.ingredients.forEach(ing => {
        const ingProduct = products.find(p => p.id === ing.ingredientId);
        const ingRef = doc(db, 'products', ing.ingredientId);
        const normalizedQty = getNormalizedQuantity(ing.ingredientId, ing.quantity, ing.unit || 'unid');
        const qtyToSubtract = (normalizedQty / yieldFactor) * numAmount;
        
        batch.update(ingRef, {
          stock: increment(-qtyToSubtract),
          updatedAt: serverTimestamp()
        });

        logIngredients.push({
          ingredientId: ing.ingredientId,
          name: ingProduct?.name || 'Insumo',
          unit: ingProduct?.unit || 'unid',
          quantity: qtyToSubtract,
          cost: Number(ingProduct?.cost || 0)
        });

        totalCostOfIngredientsUsed += (Number(ingProduct?.cost || 0)) * qtyToSubtract;
      });

      // 3. Add finished product stock and update cost based on current batch
      const productRef = doc(db, 'products', recipe.productId);
      const costPerUnit = totalCostOfIngredientsUsed / numAmount;
      
      batch.update(productRef, {
        stock: increment(numAmount),
        cost: costPerUnit, // Update cost with actual production cost per unit
        updatedAt: serverTimestamp()
      });

      // 4. Create Production Log
      const logRef = doc(collection(db, 'production_logs'));
      batch.set(logRef, {
        ownerId: targetUid,
        productId: recipe.productId,
        productName: product?.name || 'Producto',
        amount: numAmount,
        ingredients: logIngredients,
        totalCost: totalCostOfIngredientsUsed,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      const newStock = (Number(product?.stock || 0) + numAmount).toFixed(2);
      alert(`¡PRODUCCIÓN EXITOSA!\n\nProducto: ${product?.name}\nCantidad producida: ${numAmount} ${product?.unit || 'unid'}\nNuevo Stock Total: ${newStock} ${product?.unit || 'unid'}\n\nLos insumos han sido descontados.`);
    } catch (error) {
      console.error('Error in batch production:', error);
      handleFirestoreError(error, OperationType.WRITE, 'manufacturing');
    } finally {
      setIsProducing(null);
    }
  };

  const handleDeleteLog = async (log: ProductionLog) => {
    if (!confirm(`¿Estás seguro de ELIMINAR y REVERTIR este lote de "${log.productName}"?\n\n- Se devolverán los insumos al inventario.\n- Se restará el producto generado del stock.`)) return;

    try {
      const batch = writeBatch(db);

      // Revert ingredients (add back)
      log.ingredients.forEach(ing => {
        const ingRef = doc(db, 'products', ing.ingredientId);
        batch.update(ingRef, {
          stock: increment(ing.quantity),
          updatedAt: serverTimestamp()
        });
      });

      // Revert finished product (subtract)
      const productRef = doc(db, 'products', log.productId);
      batch.update(productRef, {
        stock: increment(-log.amount),
        updatedAt: serverTimestamp()
      });

      // Delete the log entry
      batch.delete(doc(db, 'production_logs', log.id));

      await batch.commit();
      alert('¡Lote eliminado e inventario restablecido!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'production_logs');
    }
  };

  const finishedProducts = products.filter(p => (p as any).isFinishedProduct);
  const ingredientChoices = products.filter(p => (p as any).isIngredient);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic serif tracking-tight">Producción</h1>
          <p className="text-slate-500 font-medium italic">Gestiona tus fórmulas y registra nuevos lotes.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
              <button 
                onClick={() => setActiveTab('formulas')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === 'formulas' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Fórmulas
              </button>
              <button 
                onClick={() => setActiveTab('workshop')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
                  activeTab === 'workshop' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Taller
                {pendingItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-100">
                    {pendingItems.length}
                  </span>
                )}
              </button>
           </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-7 py-4 rounded-[2rem] font-black flex items-center gap-2 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm tracking-widest uppercase"
          >
            <Plus size={20} strokeWidth={3} /> Nueva Receta
          </button>
        </div>
      </div>

      {activeTab === 'workshop' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <header>
                <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Cola de Producción Automática</h2>
                <p className="text-slate-500 font-medium italic text-sm">Productos vendidos "Bajo Pedido" que requieren fabricación.</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {pendingItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  const hasRecipe = recipes.some(r => r.productId === item.productId);

                  return (
                    <motion.div 
                      layout
                      key={item.productId}
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                         <Package size={80} />
                      </div>
                      
                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-amber-600 transition-colors">{item.name}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pendiente en {item.totalSales} Ventas</p>
                          </div>
                          <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">
                            {item.quantity} {product?.unit || 'Años'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                          {hasRecipe ? (
                            <button 
                              onClick={() => {
                                const recipe = recipes.find(r => r.productId === item.productId);
                                if (recipe) {
                                  setSelectedRecipeId(recipe.id);
                                  setActiveTab('formulas');
                                  setBatchAmounts({ ...batchAmounts, [recipe.id]: Math.ceil(item.quantity / (recipe.yield || 1)) });
                                }
                              }}
                              className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                            >
                              <Play size={12} fill="currentColor" /> Producir
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-500">
                              <AlertCircle size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Sin Receta Configurada</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {pendingItems.length === 0 && (
                <div className="bg-slate-50/50 rounded-[4rem] border border-slate-100 p-20 text-center">
                   <CheckCircle2 size={64} className="mx-auto text-emerald-300 mb-6" />
                   <h3 className="text-2xl font-black text-slate-300 italic">No hay pedidos pendientes</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">¡Todo el taller está al día!</p>
                </div>
              )}
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6">
                 <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 italic">Resumen del Taller</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <span className="text-sm font-bold opacity-60">Productos Distintos</span>
                       <span className="text-2xl font-black">{pendingItems.length}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <span className="text-sm font-bold opacity-60">Total Años</span>
                       <span className="text-2xl font-black">{pendingItems.reduce((sum, i) => sum + i.quantity, 0)} Años</span>
                    </div>
                 </div>
                 <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                    Este panel agrupa automáticamente todas las ventas donde marcaste productos como <b>Bajo Pedido</b> o que no tenían stock al momento de facturar.
                 </p>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Production Dashboard */}
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[4rem] border border-slate-200 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                    <Utensils size={120} />
                </div>
                
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2 italic">
                            <Layers size={14} className="text-blue-500" />
                            Seleccionar Fórmula
                        </h2>
                        
                        <div className="relative group/select">
                            <select 
                                className="w-full p-6 bg-blue-50 text-blue-800 rounded-3xl font-medium text-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none cursor-pointer tracking-tight pr-16 shadow-sm border border-blue-200"
                                value={selectedRecipeId}
                                onChange={(e) => setSelectedRecipeId(e.target.value)}
                            >
                                <option value="" className="bg-white text-slate-400 italic">¿Qué vamos a producir hoy?</option>
                                {recipes.map(recipe => {
                                    const product = products.find(p => p.id === recipe.productId);
                                    return (
                                        <option key={recipe.id} value={recipe.id} className="bg-white text-slate-900">
                                            {product?.name || 'Receta'} ({product?.unit || 'Años'})
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600 group-hover/select:translate-x-1 transition-transform">
                                <ArrowRight size={28} />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedRecipeId ? (() => {
                            const recipe = recipes.find(r => r.id === selectedRecipeId);
                            if (!recipe) return null;
                            const product = products.find(p => p.id === recipe.productId);
                            
                          const recipeYieldVal = recipe.yield || 1;
                            const totalRecipeCost = (recipe.ingredients.reduce((acc, ing) => {
                                const ingProduct = products.find(p => p.id === ing.ingredientId);
                                const normalizedQty = getNormalizedQuantity(ing.ingredientId, ing.quantity || 0, ing.unit || 'unid');
                                return acc + (Number(ingProduct?.cost || 0) * normalizedQty);
                            }, 0)) / recipeYieldVal;
                            const salesPrice = product?.price || 0;
                            const wholesalePrice = (product as any)?.wholesalePrice || 0;
                            
                            const margin = salesPrice - totalRecipeCost;
                            const marginPercent = salesPrice > 0 ? (margin / salesPrice) * 100 : 0;
                            const isProfitable = margin > 0;

                            const wholesaleMargin = wholesalePrice - totalRecipeCost;
                            const wholesaleMarginPercent = wholesalePrice > 0 ? (wholesaleMargin / wholesalePrice) * 100 : 0;
                            const isWholesaleProfitable = wholesaleMargin > 0;

                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Formula Panel - Now potentially wider or more centered */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex flex-col">
                                                    <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest italic font-sans">Análisis de Insumos</h3>
                                                    {recipe.yield && recipe.yield !== 1 && (
                                                        <span className="text-[10px] font-bold text-blue-500 italic">Rendimiento: {recipe.yield} {product?.unit} por tanda</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[11px] font-black text-slate-400 uppercase italic block">En Inventario</span>
                                                    <span className="text-xl font-bold text-slate-900">
                                                        {product?.stock || 0} <span className="text-xs text-slate-400">{product?.unit || 'Años'}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 px-4">
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">Insumo</span>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic text-center">Total a Usar</span>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic text-right">Inventario</span>
                                                </div>

                                                <div className="space-y-2 bg-slate-50/80 p-6 rounded-[2.5rem] border border-slate-100">
                                                    {recipe.ingredients.map((ing, idx) => {
                                                        const ingProduct = products.find(p => p.id === ing.ingredientId);
                                                        const multiplier = batchAmounts[recipe.id] || 1;
                                                        const normalizedQty = getNormalizedQuantity(ing.ingredientId, ing.quantity || 0, ing.unit || 'unid');
                                                        const totalNeeded = normalizedQty * multiplier;
                                                        const hasEnough = (ingProduct?.stock || 0) >= totalNeeded;
                                                        const lineCost = (ingProduct?.cost || 0) * totalNeeded;

                                                        return (
                                                            <div key={idx} className="grid grid-cols-4 items-center py-2.5 border-b border-slate-200 last:border-0 hover:bg-white rounded-xl px-2 transition-colors">
                                                                <div className="flex flex-col col-span-1">
                                                                    <span className="text-base font-bold text-slate-900 truncate leading-tight">{ingProduct?.name || 'Insumo'}</span>
                                                                    <span className="text-[9px] text-blue-600 uppercase font-black">
                                                                        {formatCurrency(getDisplayUnitCost(ingProduct?.cost || 0, ingProduct?.unit || 'unid', ing.unit || 'unid'), 4)} / {ing.unit || ingProduct?.unit || 'Años'}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex flex-col items-center">
                                                                    <span className={cn("text-lg font-black italic", hasEnough ? "text-slate-900" : "text-red-600")}>
                                                                        {((ing.quantity || 0) * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{ing.unit || ingProduct?.unit || 'und'}</span>
                                                                </div>

                                                                <div className="text-center">
                                                                    <span className="text-sm font-black text-slate-900">{formatCurrency(lineCost, 2)}</span>
                                                                    <p className="text-[8px] text-slate-400 font-bold uppercase italic">Subtotal</p>
                                                                </div>

                                                                <div className="text-right">
                                                                    <span className={cn("font-black text-lg", (ingProduct?.stock || 0) < totalNeeded ? "text-red-600" : "text-slate-900")}>
                                                                        {(ingProduct?.stock || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                    <p className="text-[8px] text-slate-400 font-bold uppercase italic">Stock</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Production Control & Profitability Bar */}
                                    <div className="pt-6 border-t border-slate-200/60 space-y-4">
                                    {/* Horizontal Profitability Bar - High Contrast Light Style */}
                                    <div className="bg-blue-50/50 p-6 rounded-[3rem] border border-blue-100 space-y-4 shadow-sm mt-6">
                                            {/* Row 1: Prices Indicator (Horizontal) */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="px-6 py-5 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">COSTO POR {product?.unit || 'UNID'}</span>
                                                    <p className="text-2xl font-black text-slate-900 italic tracking-tight">{formatCurrency(totalRecipeCost, 3)}</p>
                                                </div>
                                                <div className="px-6 py-5 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 text-center">DETAL / {product?.unit || 'UNID'}</span>
                                                    <p className="text-2xl font-black text-blue-700 italic tracking-tight">{formatCurrency(salesPrice)}</p>
                                                </div>
                                                <div className="px-6 py-5 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 text-center">MAYOR / {product?.unit || 'UNID'}</span>
                                                    <p className="text-2xl font-black text-indigo-700 italic tracking-tight">{formatCurrency(wholesalePrice)}</p>
                                                </div>

                                            </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className={cn(
                                                        "px-6 py-5 rounded-3xl flex items-center justify-between border shadow-sm transition-all",
                                                        isProfitable ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                                                    )}>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">MARGEN DETAL</span>
                                                            <p className={cn("text-2xl font-black italic tracking-tighter", isProfitable ? "text-emerald-700" : "text-red-700")}>
                                                                {formatCurrency(margin, 3)}
                                                            </p>
                                                        </div>
                                                        <div className={cn("px-3 py-1 rounded-xl text-sm font-black shadow-sm", isProfitable ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
                                                            {marginPercent.toFixed(1)}%
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "px-6 py-5 rounded-3xl flex items-center justify-between border shadow-sm transition-all",
                                                        isWholesaleProfitable ? "bg-indigo-50 border-indigo-200" : "bg-orange-50 border-orange-200"
                                                    )}>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">MARGEN MAYOR</span>
                                                            <p className={cn("text-2xl font-black italic tracking-tighter", isWholesaleProfitable ? "text-indigo-700" : "text-orange-700")}>
                                                                {formatCurrency(wholesaleMargin, 3)}
                                                            </p>
                                                        </div>
                                                        <div className={cn("px-3 py-1 rounded-xl text-sm font-black shadow-sm", isWholesaleProfitable ? "bg-indigo-600 text-white" : "bg-orange-600 text-white")}>
                                                            {wholesaleMarginPercent.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Batch Summary Row */}
                                                <div className="bg-white p-5 rounded-[2rem] border border-blue-100/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left transition-all">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-1">Total Lote ({((recipe.yield || 1) * (batchAmounts[recipe.id] || 1)).toLocaleString()} {product?.unit})</span>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Venta (AL MAYOR):</span>
                                                            <span className="text-xl font-black text-blue-600 italic">{formatCurrency(wholesalePrice * (recipe.yield || 1) * (batchAmounts[recipe.id] || 1))}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-px w-full sm:h-10 sm:w-px bg-slate-100" />
                                                    <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic mb-1">Costo Estimado</span>
                                                        <span className="text-lg font-black text-slate-700 italic">{formatCurrency(totalRecipeCost * (recipe.yield || 1) * (batchAmounts[recipe.id] || 1))}</span>
                                                    </div>
                                                </div>
                                            </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-40 shrink-0">
                                                <div className="flex items-center bg-blue-50 rounded-2xl p-1.5 border border-blue-200 shadow-sm">
                                                    <button 
                                                        onClick={() => setBatchAmounts({ ...batchAmounts, [recipe.id]: Math.max(1, (batchAmounts[recipe.id] || 1) - 1) })}
                                                        className="w-10 h-10 flex items-center justify-center text-blue-700 hover:bg-blue-100 rounded-xl transition-all font-black text-xl"
                                                    >
                                                        -
                                                    </button>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        className="flex-1 min-w-0 bg-transparent border-none text-center text-blue-900 font-black text-base outline-none"
                                                        value={batchAmounts[recipe.id] || 1}
                                                        onChange={(e) => setBatchAmounts({ ...batchAmounts, [recipe.id]: parseFloat(e.target.value) || 1 })}
                                                    />
                                                    <button 
                                                        onClick={() => setBatchAmounts({ ...batchAmounts, [recipe.id]: (batchAmounts[recipe.id] || 1) + 1 })}
                                                        className="w-10 h-10 flex items-center justify-center text-blue-700 hover:bg-blue-100 rounded-xl transition-all font-black text-xl"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block text-center italic">Paquetes a Producir</span>
                                            </div>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    produceBatch(recipe, batchAmounts[recipe.id] || 1);
                                                }}
                                                disabled={isProducing === recipe.id}
                                                className={cn(
                                                    "flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg relative overflow-hidden group/prod",
                                                    isProducing === recipe.id 
                                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50"
                                                )}
                                            >
                                                {isProducing === recipe.id ? (
                                                    <div className="w-5 h-5 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Play size={16} fill="white" strokeWidth={0} className="group-hover/prod:scale-110 transition-transform" /> 
                                                        <span className="tracking-[0.2em] uppercase text-xs">Producir</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })() : (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[3rem] flex items-center justify-center mx-auto mb-6">
                                    <Package size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-300 italic">Elige una fórmula para ver el análisis</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-[250px] mx-auto">
                                    Configuraremos costos e insumos automáticamente para tu lote
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* Recent Activity (Production Logs) */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 px-2">
                <History className="text-emerald-500" size={20} />
                <h2 className="text-base font-black text-slate-900 uppercase tracking-[0.2em] italic">Actividad</h2>
            </div>
            <div className="space-y-4">
                {productionLogs.map(log => (
                    <div key={log.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative group hover:border-emerald-200 transition-all hover:shadow-md">
                        <div className="flex items-start justify-between mb-4">
                            <div className="min-w-0">
                                <h4 className="font-black text-slate-900 leading-tight text-lg truncate">{log.productName}</h4>
                                <span className="text-[10px] text-slate-400 font-black flex items-center gap-1 mt-1 uppercase tracking-tighter italic">
                                    <History size={10} />
                                    {(() => {
                                      const date = log.createdAt?.toDate?.() || (log.createdAt ? new Date(log.createdAt) : null);
                                      return date && !isNaN(date.getTime()) ? format(date, 'dd MMM • HH:mm', { locale: es }) : 'Reciente';
                                    })()}
                                </span>
                            </div>
                            <button 
                                onClick={() => handleDeleteLog(log)}
                                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                title="Eliminar y revertir"
                            >
                                <RotateCcw size={20} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                             <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-slate-400 uppercase italic mb-0.5">Ingreso de Stock</span>
                                 <div className="flex items-center gap-2">
                                     <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                     <span className="text-xl font-black text-slate-900 tracking-tighter">+{log.amount} Años.</span>
                                 </div>
                             </div>
                             <div className="text-right flex flex-col">
                                 <span className="text-[10px] font-black text-slate-400 uppercase italic mb-0.5">Costo Total</span>
                                 <span className="text-base font-black text-slate-800">{formatCurrency(log.totalCost, 3)}</span>
                             </div>
                        </div>
                    </div>
                ))}
                {productionLogs.length === 0 && (
                     <div className="py-16 text-center bg-slate-50/50 rounded-[3rem] border border-slate-100">
                        <History size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Sin lotes producidos</p>
                     </div>
                )}
            </div>
        </div>
        </div>
      )}

      {/* Modal Nueva Receta */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
             <motion.div initial={{scale:0.95, y: 30}} animate={{scale:1, y: 0}} exit={{scale:0.95, y: 30}} className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-10 overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 italic serif leading-none">Nueva Fórmula</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Configuración técnica de producto</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={28} />
                    </button>
                </div>
                
                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2 block">Producto Resultante (Output)</label>
                            <select 
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-slate-700 transition-all appearance-none text-lg"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                            >
                                <option value="">Selecciona qué producto sale...</option>
                                {finishedProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit || 'Años'})</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2 block">Rendimiento (Yield)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-slate-700 transition-all text-lg"
                                    value={recipeYield}
                                    onChange={(e) => setRecipeYield(parseFloat(e.target.value) || 1)}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase italic">
                                    {finishedProducts.find(p => p.id === selectedProduct)?.unit || 'Años'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2 block">Insumos Necesarios (Input)</label>
                        {recipeIngredients.map((item, idx) => (
                            <div key={idx} className="flex gap-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 items-center">
                                <select 
                                    className="flex-1 bg-transparent border-none outline-none font-black text-slate-800 appearance-none text-base pl-2"
                                    value={item.ingredientId}
                                    onChange={(e) => {
                                        const newIngs = [...recipeIngredients];
                                        const found = ingredientChoices.find(p => p.id === e.target.value);
                                        newIngs[idx].ingredientId = e.target.value;
                                        newIngs[idx].unit = found?.unit || 'unid';
                                        setRecipeIngredients(newIngs);
                                    }}
                                >
                                    <option value="">Insumo...</option>
                                    {ingredientChoices.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit || 'Años'})</option>)}
                                </select>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="Cant."
                                        className="w-24 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-black text-center focus:ring-4 focus:ring-blue-100 transition-all text-lg"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newIngs = [...recipeIngredients];
                                            newIngs[idx].quantity = parseFloat(e.target.value) || 0;
                                            setRecipeIngredients(newIngs);
                                        }}
                                    />
                                    
                                    {/* Unit Selector matching Inventory.tsx logic */}
                                    {(item.unit === 'kg' || item.unit === 'gr') ? (
                                        <select 
                                            className="text-[10px] font-bold text-blue-600 bg-white border border-blue-100 px-2 py-3 rounded-xl outline-none"
                                            value={item.unit}
                                            onChange={(e) => {
                                                const newIngs = [...recipeIngredients];
                                                newIngs[idx].unit = e.target.value;
                                                setRecipeIngredients(newIngs);
                                            }}
                                        >
                                            <option value="kg">kg</option>
                                            <option value="gr">gr</option>
                                        </select>
                                    ) : (item.unit === 'lt' || item.unit === 'ml') ? (
                                        <select 
                                            className="text-[10px] font-bold text-blue-600 bg-white border border-blue-100 px-2 py-3 rounded-xl outline-none"
                                            value={item.unit}
                                            onChange={(e) => {
                                                const newIngs = [...recipeIngredients];
                                                newIngs[idx].unit = e.target.value;
                                                setRecipeIngredients(newIngs);
                                            }}
                                        >
                                            <option value="lt">lt</option>
                                            <option value="ml">ml</option>
                                        </select>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-400 uppercase w-10 text-center">{item.unit || 'Años'}</span>
                                    )}
                                </div>
                                <button onClick={() => removeIngredient(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={addIngredientToRecipe}
                            className="w-full py-5 border-4 border-dotted border-slate-100 text-slate-400 rounded-3xl text-xs font-black uppercase tracking-[0.2em] hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Agregar Insumo a la Recta
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleSaveRecipe}
                    disabled={!selectedProduct || recipeIngredients.length === 0}
                    className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xl mt-10 shadow-2xl shadow-slate-200 disabled:opacity-30 disabled:shadow-none transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-3"
                >
                    <Layers size={24} /> Guardar Fórmula Maestra
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
