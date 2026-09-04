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
  CheckCircle2,
  Printer,
  RefreshCw,
  Edit3,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RecipeSheet, RecipeIngredientDetail } from '../components/RecipeSheet';
import { 
  normalizeUnit, 
  convertQuantity, 
  getDisplayUnitCost, 
  calculateRecipeCostSummary, 
  getAvailableUnitsForIngredient 
} from '../lib/recipeUtils';

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
  unit?: string;
  batches?: number;
  yieldPerBatch?: number;
  costPerUnit?: number;
  ingredients: { ingredientId: string; quantity: number; name: string; unit: string; cost: number; subtotal?: number }[];
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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSyncingAllCosts, setIsSyncingAllCosts] = useState(false);

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

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setSelectedProduct(recipe.productId);
    setRecipeYield(recipe.yield || 1);
    setRecipeIngredients(recipe.ingredients.map(ing => ({
      ingredientId: ing.ingredientId,
      quantity: ing.quantity,
      unit: ing.unit || products.find(p => p.id === ing.ingredientId)?.unit || 'unid'
    })));
    setIsModalOpen(true);
  };

  const handleSyncAllRecipeCosts = async () => {
    if (!confirm('¿Deseas recalcular y sincronizar automáticamente los costos de todas las fórmulas maestras con los costos actuales de sus materias primas en inventario?')) return;

    setIsSyncingAllCosts(true);
    try {
      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const recipe of recipes) {
        if (!recipe.productId || !recipe.ingredients || recipe.ingredients.length === 0) continue;
        const summary = calculateRecipeCostSummary(recipe.ingredients, products, recipe.yield || 1);

        const productRef = doc(db, 'products', recipe.productId);
        batch.update(productRef, {
          cost: summary.unitCost,
          recipeYield: summary.yieldAmount,
          recipe: recipe.ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            name: products.find(p => p.id === ing.ingredientId)?.name || 'Insumo',
            unit: ing.unit || products.find(p => p.id === ing.ingredientId)?.unit || 'unid',
            quantity: ing.quantity,
            cost: products.find(p => p.id === ing.ingredientId)?.cost || 0
          })),
          isFinishedProduct: true,
          updatedAt: serverTimestamp()
        });

        const recipeRef = doc(db, 'recipes', recipe.id);
        batch.update(recipeRef, {
          yield: summary.yieldAmount,
          updatedAt: serverTimestamp()
        });

        updatedCount++;
      }

      if (updatedCount > 0) {
        await batch.commit();
        alert(`¡Costos sincronizados exitosamente!\n\nSe actualizaron y recalcularon ${updatedCount} producto(s) terminado(s) y fórmula(s).`);
      } else {
        alert('No se encontraron fórmulas con ingredientes para sincronizar.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recipes');
    } finally {
      setIsSyncingAllCosts(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!selectedProduct || recipeIngredients.length === 0) return;

    try {
      const yieldVal = Math.max(0.0001, parseFloat(String(recipeYield)) || 1);
      const summary = calculateRecipeCostSummary(recipeIngredients, products, yieldVal);
      const targetProduct = products.find(p => p.id === selectedProduct);

      const recipeRef = doc(db, 'recipes', `recipe_${selectedProduct}`);
      await setDoc(recipeRef, {
        productId: selectedProduct,
        yield: summary.yieldAmount,
        ingredients: recipeIngredients.map(ing => ({
          ingredientId: ing.ingredientId,
          unit: ing.unit || products.find(p => p.id === ing.ingredientId)?.unit || 'unid',
          quantity: parseFloat(String(ing.quantity)) || 0
        })),
        ownerId: effectiveUid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      // Update finished product cost and recipe specification
      await updateDoc(doc(db, 'products', selectedProduct), {
        cost: summary.unitCost,
        recipeYield: summary.yieldAmount,
        recipe: recipeIngredients.map(ing => ({
          ingredientId: ing.ingredientId,
          name: products.find(p => p.id === ing.ingredientId)?.name || 'Insumo',
          unit: ing.unit || products.find(p => p.id === ing.ingredientId)?.unit || 'unid',
          quantity: parseFloat(String(ing.quantity)) || 0,
          cost: products.find(p => p.id === ing.ingredientId)?.cost || 0
        })),
        isFinishedProduct: true,
        updatedAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setRecipeIngredients([]);
      setSelectedProduct('');
      setRecipeYield(1);
      alert(`¡Fórmula guardada con éxito!\n\nProducto: ${targetProduct?.name || ''}\nRendimiento: ${summary.yieldAmount} ${targetProduct?.unit || 'unid'}\nCosto Insumos (1 tanda): ${formatCurrency(summary.totalBatchCost, 2)}\nCosto Unitario Resultante: ${formatCurrency(summary.unitCost, 4)}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recipes');
    }
  };

  const produceBatch = async (recipe: Recipe, batchesAmount: any = 1) => {
    const targetUid = effectiveUid || DEFAULT_OWNER_ID;
    setIsProducing(recipe.id);

    const batches = Math.max(0.01, parseFloat(String(batchesAmount)) || 1);
    const yieldPerBatch = Math.max(0.0001, parseFloat(String(recipe.yield)) || 1);
    const totalUnitsToProduce = batches * yieldPerBatch;

    try {
      const summary = calculateRecipeCostSummary(recipe.ingredients, products, yieldPerBatch);
      const product = products.find(p => p.id === recipe.productId);
      const productUnit = product?.unit || 'unid';

      // 1. Validate Stock of all ingredients for total batches
      const missingStockItems: string[] = [];

      summary.items.forEach(item => {
        const ingProduct = products.find(p => p.id === item.ingredientId);
        const requiredInBaseUnit = item.normalizedQuantityInBaseUnit * batches;
        const availableInBaseUnit = Number(ingProduct?.stock || 0);

        if (availableInBaseUnit < requiredInBaseUnit) {
          const reqDisplay = convertQuantity(requiredInBaseUnit, item.baseUnit, item.recipeUnit);
          const availDisplay = convertQuantity(availableInBaseUnit, item.baseUnit, item.recipeUnit);
          missingStockItems.push(
            `• ${item.name}: Faltan ${(reqDisplay - availDisplay).toFixed(2)} ${item.recipeUnit} (Requieres ${reqDisplay.toFixed(2)} ${item.recipeUnit}, hay ${availDisplay.toFixed(2)} ${item.recipeUnit})`
          );
        }
      });

      if (missingStockItems.length > 0) {
        alert(`No hay stock suficiente para fabricar ${batches} tanda(s) (${totalUnitsToProduce.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${productUnit}):\n\n${missingStockItems.join('\n')}`);
        setIsProducing(null);
        return;
      }

      const batch = writeBatch(db);
      const logIngredients: any[] = [];
      const totalCostOfBatch = summary.totalBatchCost * batches;
      const unitCost = summary.unitCost;

      // 2. Deduct ingredients
      summary.items.forEach(item => {
        const requiredInBaseUnit = item.normalizedQuantityInBaseUnit * batches;
        const lineTotalCost = item.lineCost * batches;

        const ingRef = doc(db, 'products', item.ingredientId);
        batch.update(ingRef, {
          stock: increment(-requiredInBaseUnit),
          updatedAt: serverTimestamp()
        });

        logIngredients.push({
          ingredientId: item.ingredientId,
          name: item.name,
          unit: item.baseUnit,
          quantity: requiredInBaseUnit,
          cost: item.baseCost,
          subtotal: lineTotalCost
        });
      });

      // 3. Add finished product stock and update unit cost
      const productRef = doc(db, 'products', recipe.productId);
      batch.update(productRef, {
        stock: increment(totalUnitsToProduce),
        cost: unitCost,
        updatedAt: serverTimestamp()
      });

      // 4. Create Production Log
      const logRef = doc(collection(db, 'production_logs'));
      batch.set(logRef, {
        ownerId: targetUid,
        productId: recipe.productId,
        productName: product?.name || 'Producto',
        batches,
        amount: totalUnitsToProduce,
        unit: productUnit,
        yieldPerBatch,
        ingredients: logIngredients,
        totalCost: totalCostOfBatch,
        costPerUnit: unitCost,
        createdAt: serverTimestamp()
      });

      await batch.commit();
      const newStock = (Number(product?.stock || 0) + totalUnitsToProduce).toFixed(2);
      alert(`¡PRODUCCIÓN EXITOSA!\n\nProducto: ${product?.name}\nTandas fabricadas: ${batches}\nUnidades producidas: +${totalUnitsToProduce.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${productUnit}\nCosto Unitario: ${formatCurrency(unitCost, 4)}\nCosto Total Insumos: ${formatCurrency(totalCostOfBatch, 2)}\nNuevo Stock Total: ${newStock} ${productUnit}\n\nLos insumos correspondientes fueron descontados de inventario.`);
    } catch (error) {
      console.error('Error in batch production:', error);
      handleFirestoreError(error, OperationType.WRITE, 'manufacturing');
    } finally {
      setIsProducing(null);
    }
  };

  const handleDeleteLog = async (log: ProductionLog) => {
    if (!confirm(`¿Estás seguro de ELIMINAR y REVERTIR este lote de "${log.productName}"?\n\n- Se devolverán los insumos al inventario.\n- Se restará el producto generado (-${log.amount} ${log.unit || 'unid'}) del stock.`)) return;

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
      alert('¡Lote eliminado e inventario restablecido correctamente!');
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
            onClick={handleSyncAllRecipeCosts}
            disabled={isSyncingAllCosts || recipes.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-4 rounded-[2rem] font-black flex items-center gap-2 transition-all active:scale-[0.98] text-xs tracking-wider uppercase cursor-pointer disabled:opacity-50"
            title="Sincronizar y recalcular costos de todas las recetas con el stock actual de insumos"
          >
            <RefreshCw size={16} className={cn("text-blue-600", isSyncingAllCosts && "animate-spin")} />
            <span className="hidden sm:inline">Sincronizar Costos</span>
          </button>
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
                            {item.quantity} {product?.unit || 'unid'}
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
                       <span className="text-sm font-bold opacity-60">Total Unidades</span>
                       <span className="text-2xl font-black">{pendingItems.reduce((sum, i) => sum + i.quantity, 0)}</span>
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
                                            {product?.name || 'Receta'} ({product?.unit || 'unid'})
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
                            
                            const multiplier = Math.max(0.01, batchAmounts[recipe.id] || 1);
                            const summary = calculateRecipeCostSummary(recipe.ingredients, products, recipe.yield || 1);
                            const salesPrice = product?.price || 0;
                            const wholesalePrice = (product as any)?.wholesalePrice || 0;
                            
                            const margin = salesPrice - summary.unitCost;
                            const marginPercent = salesPrice > 0 ? (margin / salesPrice) * 100 : 0;
                            const isProfitable = margin > 0;

                            const wholesaleMargin = wholesalePrice - summary.unitCost;
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
                                        {/* Formula Panel */}
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                                            Receta Maestra
                                                        </span>
                                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                                            {product?.name || 'Receta'}
                                                        </h3>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500 italic mt-1">
                                                        Rendimiento base: {summary.yieldAmount} {product?.unit || 'unid'} por tanda
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditRecipe(recipe)}
                                                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                                                        title="Editar Fórmula"
                                                    >
                                                        <Layers size={14} className="text-blue-600" />
                                                        <span>Editar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setIsPrintModalOpen(true)}
                                                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                                                        title="Imprimir Hoja de Producción y Receta"
                                                    >
                                                        <Printer size={15} />
                                                        <span>Imprimir</span>
                                                    </button>
                                                    <div className="text-right pl-3 border-l border-slate-200">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase italic block">En Inventario</span>
                                                        <span className="text-lg font-bold text-slate-900">
                                                            {product?.stock || 0} <span className="text-xs text-slate-400">{product?.unit || 'unid'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-4 px-4">
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic col-span-1">Insumo</span>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic text-center">Total a Usar</span>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic text-center">Costo Lote</span>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic text-right">Inventario</span>
                                                </div>

                                                <div className="space-y-2 bg-slate-50/80 p-6 rounded-[2.5rem] border border-slate-100">
                                                    {summary.items.map((item, idx) => {
                                                        const totalNeededInRecipeUnit = item.recipeQuantity * multiplier;
                                                        const requiredInBaseUnit = item.normalizedQuantityInBaseUnit * multiplier;
                                                        const hasEnough = item.currentStock >= requiredInBaseUnit;
                                                        const lineCost = item.lineCost * multiplier;

                                                        return (
                                                            <div key={idx} className="grid grid-cols-4 items-center py-2.5 border-b border-slate-200 last:border-0 hover:bg-white rounded-xl px-2 transition-colors">
                                                                <div className="flex flex-col col-span-1">
                                                                    <span className="text-base font-bold text-slate-900 truncate leading-tight">{item.name}</span>
                                                                    <span className="text-[9px] text-blue-600 uppercase font-black">
                                                                        {formatCurrency(item.unitCostInRecipeUnit, 4)} / {item.recipeUnit}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex flex-col items-center">
                                                                    <span className={cn("text-lg font-black italic", hasEnough ? "text-slate-900" : "text-red-600")}>
                                                                        {totalNeededInRecipeUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{item.recipeUnit}</span>
                                                                </div>

                                                                <div className="text-center">
                                                                    <span className="text-sm font-black text-slate-900">{formatCurrency(lineCost, 2)}</span>
                                                                    <p className="text-[8px] text-slate-400 font-bold uppercase italic">Subtotal</p>
                                                                </div>

                                                                <div className="text-right">
                                                                    <span className={cn("font-black text-lg", !hasEnough ? "text-red-600" : "text-slate-900")}>
                                                                        {item.stockInRecipeUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                    <p className="text-[8px] text-slate-400 font-bold uppercase italic">Stock ({item.recipeUnit})</p>
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
                                    {/* Horizontal Profitability Bar */}
                                    <div className="bg-blue-50/50 p-6 rounded-[3rem] border border-blue-100 space-y-4 shadow-sm mt-6">
                                            {/* Row 1: Prices Indicator (Horizontal) */}
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                <div className="px-5 py-4 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-300" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">COSTO / TANDA</span>
                                                    <p className="text-xl font-black text-slate-800 italic tracking-tight">{formatCurrency(summary.totalBatchCost, 2)}</p>
                                                    <span className="text-[9px] text-slate-400 font-bold">1 tanda = {summary.yieldAmount} {product?.unit || 'unid'}</span>
                                                </div>
                                                <div className="px-5 py-4 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">COSTO UNITARIO</span>
                                                    <p className="text-xl font-black text-slate-900 italic tracking-tight">{formatCurrency(summary.unitCost, 4)}</p>
                                                    <span className="text-[9px] text-slate-400 font-bold">por {product?.unit || 'unid'}</span>
                                                </div>
                                                <div className="px-5 py-4 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 text-center">DETAL / {product?.unit || 'UNID'}</span>
                                                    <p className="text-xl font-black text-blue-700 italic tracking-tight">{formatCurrency(salesPrice)}</p>
                                                    <span className="text-[9px] text-blue-500 font-bold">Margen: {marginPercent.toFixed(1)}%</span>
                                                </div>
                                                <div className="px-5 py-4 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 text-center">MAYOR / {product?.unit || 'UNID'}</span>
                                                    <p className="text-xl font-black text-indigo-700 italic tracking-tight">{formatCurrency(wholesalePrice)}</p>
                                                    <span className="text-[9px] text-indigo-500 font-bold">Margen: {wholesaleMarginPercent.toFixed(1)}%</span>
                                                </div>

                                            </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className={cn(
                                                        "px-6 py-5 rounded-3xl flex items-center justify-between border shadow-sm transition-all",
                                                        isProfitable ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                                                    )}>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">MARGEN GANANCIA DETAL</span>
                                                            <p className={cn("text-2xl font-black italic tracking-tighter", isProfitable ? "text-emerald-700" : "text-red-700")}>
                                                                {formatCurrency(margin, 2)}
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
                                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">MARGEN GANANCIA MAYOR</span>
                                                            <p className={cn("text-2xl font-black italic tracking-tighter", isWholesaleProfitable ? "text-indigo-700" : "text-orange-700")}>
                                                                {formatCurrency(wholesaleMargin, 2)}
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
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-1">
                                                            Total Fabricación: {multiplier} tanda{multiplier > 1 ? 's' : ''} ({(summary.yieldAmount * multiplier).toLocaleString()} {product?.unit || 'unid'})
                                                        </span>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Venta al Mayor:</span>
                                                            <span className="text-xl font-black text-blue-600 italic">{formatCurrency(wholesalePrice * summary.yieldAmount * multiplier)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-px w-full sm:h-10 sm:w-px bg-slate-100" />
                                                    <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic mb-1">Costo Total Insumos Lote</span>
                                                        <span className="text-lg font-black text-slate-700 italic">{formatCurrency(summary.totalBatchCost * multiplier)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                            <div className="w-full sm:w-44 shrink-0">
                                                <div className="flex items-center bg-blue-50 rounded-2xl p-1.5 border border-blue-200 shadow-sm">
                                                    <button 
                                                        onClick={() => setBatchAmounts({ ...batchAmounts, [recipe.id]: Math.max(1, (batchAmounts[recipe.id] || 1) - 1) })}
                                                        className="w-10 h-10 flex items-center justify-center text-blue-700 hover:bg-blue-100 rounded-xl transition-all font-black text-xl cursor-pointer"
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
                                                        className="w-10 h-10 flex items-center justify-center text-blue-700 hover:bg-blue-100 rounded-xl transition-all font-black text-xl cursor-pointer"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 block text-center italic">Tandas a Fabricar</span>
                                            </div>

                                            <button 
                                                onClick={() => setIsPrintModalOpen(true)}
                                                className="py-4 px-6 rounded-2xl font-black bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md cursor-pointer"
                                                title="Imprimir Hoja de Producción y Receta"
                                            >
                                                <Printer size={18} className="text-blue-300" />
                                                <span className="tracking-widest uppercase text-xs">Imprimir Receta</span>
                                            </button>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    produceBatch(recipe, batchAmounts[recipe.id] || 1);
                                                }}
                                                disabled={isProducing === recipe.id}
                                                className={cn(
                                                    "flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg relative overflow-hidden group/prod cursor-pointer",
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
                                                        <span className="tracking-[0.15em] uppercase text-xs">
                                                            Fabricar {multiplier} Tanda{multiplier > 1 ? 's' : ''} (+{(summary.yieldAmount * multiplier).toLocaleString(undefined, { maximumFractionDigits: 2 })} {product?.unit || 'unid'})
                                                        </span>
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
                                onChange={(e) => {
                                    const prodId = e.target.value;
                                    setSelectedProduct(prodId);
                                    const existingRecipe = recipes.find(r => r.productId === prodId);
                                    if (existingRecipe) {
                                        setRecipeYield(existingRecipe.yield || 1);
                                        setRecipeIngredients(existingRecipe.ingredients.map(ing => ({
                                            ingredientId: ing.ingredientId,
                                            quantity: ing.quantity,
                                            unit: ing.unit || products.find(p => p.id === ing.ingredientId)?.unit || 'unid'
                                        })));
                                    }
                                }}
                            >
                                <option value="">Selecciona qué producto sale...</option>
                                {finishedProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit || 'unid'})</option>)}
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
                                    {finishedProducts.find(p => p.id === selectedProduct)?.unit || 'unid'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2 block">Insumos Necesarios (Input)</label>
                        {recipeIngredients.map((item, idx) => {
                            const found = ingredientChoices.find(p => p.id === item.ingredientId);
                            const baseUnit = found?.unit || 'unid';
                            const availableUnits = getAvailableUnitsForIngredient(baseUnit);

                            return (
                            <div key={idx} className="flex gap-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 items-center">
                                <select 
                                    className="flex-1 bg-transparent border-none outline-none font-black text-slate-800 appearance-none text-base pl-2"
                                    value={item.ingredientId}
                                    onChange={(e) => {
                                        const newIngs = [...recipeIngredients];
                                        const ingFound = ingredientChoices.find(p => p.id === e.target.value);
                                        newIngs[idx].ingredientId = e.target.value;
                                        newIngs[idx].unit = ingFound?.unit || 'unid';
                                        setRecipeIngredients(newIngs);
                                    }}
                                >
                                    <option value="">Insumo...</option>
                                    {ingredientChoices.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit || 'unid'})</option>)}
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
                                    
                                    {availableUnits.length > 1 ? (
                                        <select 
                                            className="text-[11px] font-bold text-blue-600 bg-white border border-blue-100 px-2.5 py-3 rounded-xl outline-none cursor-pointer"
                                            value={item.unit || baseUnit}
                                            onChange={(e) => {
                                                const newIngs = [...recipeIngredients];
                                                newIngs[idx].unit = e.target.value;
                                                setRecipeIngredients(newIngs);
                                            }}
                                        >
                                            {availableUnits.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-400 uppercase w-10 text-center">{baseUnit}</span>
                                    )}
                                </div>
                                <button onClick={() => removeIngredient(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                    <Trash2 size={24} />
                                </button>
                            </div>
                            );
                        })}
                        <button 
                            onClick={addIngredientToRecipe}
                            className="w-full py-5 border-4 border-dotted border-slate-100 text-slate-400 rounded-3xl text-xs font-black uppercase tracking-[0.2em] hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Agregar Insumo a la Receta
                        </button>
                    </div>

                    {/* Live Recipe Cost Preview */}
                    {(() => {
                        if (!selectedProduct || recipeIngredients.length === 0) return null;
                        const summary = calculateRecipeCostSummary(recipeIngredients, products, recipeYield || 1);
                        const targetProduct = products.find(p => p.id === selectedProduct);
                        const prodUnit = targetProduct?.unit || 'unid';
                        const pvp = targetProduct?.price || 0;
                        const margin = pvp - summary.unitCost;
                        const marginPct = pvp > 0 ? (margin / pvp) * 100 : 0;

                        return (
                            <div className="bg-blue-50/70 p-5 rounded-3xl border border-blue-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Cálculo en Tiempo Real</span>
                                    <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                        {summary.items.length} Insumo(s)
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-blue-100">
                                    <div className="bg-white p-3 rounded-2xl border border-blue-100/60">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Costo 1 Tanda</span>
                                        <span className="text-sm font-black text-slate-900">{formatCurrency(summary.totalBatchCost, 2)}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl border border-blue-100/60">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Rendimiento</span>
                                        <span className="text-sm font-black text-blue-700">{summary.yieldAmount} {prodUnit}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl border border-blue-100/60">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Costo Unitario</span>
                                        <span className="text-sm font-black text-emerald-600">{formatCurrency(summary.unitCost, 4)}</span>
                                    </div>
                                </div>
                                {pvp > 0 && (
                                    <div className="flex items-center justify-between text-xs px-2 pt-1">
                                        <span className="text-slate-600">PVP Actual: <b>{formatCurrency(pvp)}</b></span>
                                        <span className={cn("font-black", margin > 0 ? "text-emerald-700" : "text-red-600")}>
                                            Margen: {formatCurrency(margin, 2)} ({marginPct.toFixed(1)}%)
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
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

      {/* Printable Recipe Sheet Modal */}
      {(() => {
        const currentRecipeObj = recipes.find(r => r.id === selectedRecipeId);
        const currentProductObj = products.find(p => p.id === currentRecipeObj?.productId);
        
        if (!currentRecipeObj || !currentProductObj) return null;

        const multiplier = Math.max(0.01, batchAmounts[currentRecipeObj.id] || 1);
        const summary = calculateRecipeCostSummary(currentRecipeObj.ingredients, products, currentRecipeObj.yield || 1);

        const ingDetails: RecipeIngredientDetail[] = summary.items.map(item => {
          const totalNeededInRecipeUnit = item.recipeQuantity * multiplier;
          const requiredInBaseUnit = item.normalizedQuantityInBaseUnit * multiplier;
          const hasEnough = item.currentStock >= requiredInBaseUnit;
          const lineCost = item.lineCost * multiplier;

          return {
            ingredientId: item.ingredientId,
            name: item.name,
            unit: item.recipeUnit,
            baseUnit: item.baseUnit,
            baseQuantity: item.recipeQuantity,
            totalQuantity: totalNeededInRecipeUnit,
            currentStock: item.stockInRecipeUnit,
            unitCost: item.unitCostInRecipeUnit,
            totalCost: lineCost,
            hasEnoughStock: hasEnough
          };
        });

        return (
          <RecipeSheet
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            recipe={currentRecipeObj}
            product={currentProductObj}
            ingredients={ingDetails}
            batchMultiplier={multiplier}
            totalRecipeCostPerUnit={summary.unitCost}
            totalBatchCost={summary.totalBatchCost * multiplier}
          />
        );
      })()}
    </div>
  );
}
