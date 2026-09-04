import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  doc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, cn, getGoogleDriveDirectLink } from '../lib/utils';
import { 
  normalizeUnit, 
  convertQuantity, 
  getDisplayUnitCost, 
  calculateRecipeCostSummary,
  getAvailableUnitsForIngredient,
  getProductEffectiveCost
} from '../lib/recipeUtils';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Package, 
  Trash2, 
  Edit2,
  X,
  Upload,
  AlertCircle,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';

interface RecipeItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number; // Base cost per original unit
}

interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  cost: number;
  stock: number;
  category: string;
  unit: string;
  imageUrl?: string;
  ownerId: string;
  isIngredient: boolean;
  isFinishedProduct: boolean;
  isBajoPedido?: boolean;
  recipe?: RecipeItem[];
  lowStockThreshold?: number;
}

export default function Inventory() {
  const { user, effectiveUid } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    wholesalePrice: '',
    cost: '',
    stock: '',
    unit: 'unid',
    imageUrl: '',
    category: '',
    isIngredient: false,
    isFinishedProduct: true,
    isBajoPedido: false,
    recipeYield: '1',
    recipe: [] as RecipeItem[]
  });

  const [sortBy, setSortBy] = useState<'name' | 'category' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const ingredientsOnly = products.filter(p => (p as any).isIngredient);

  const addIngredientToRecipe = (ingredientId: string) => {
    const ingredient = ingredientsOnly.find(p => p.id === ingredientId);
    if (!ingredient) return;

    if (recipeItems.find(item => item.ingredientId === ingredientId)) {
      alert('Este ingrediente ya está en la receta');
      return;
    }

    const newItem: RecipeItem = {
      ingredientId: ingredient.id,
      name: ingredient.name,
      quantity: 1,
      cost: ingredient.cost,
      unit: ingredient.unit || 'unid'
    };

    const updatedItems = [...recipeItems, newItem];
    setRecipeItems(updatedItems);
    const summary = calculateRecipeCostSummary(updatedItems, products, formData.recipeYield);
    setFormData(prev => ({
      ...prev,
      cost: summary.unitCost.toFixed(4)
    }));
  };

  const updateIngredientQuantity = (id: string, qty: string, unit?: string) => {
    const parsedQty = parseFloat(qty);
    const updatedItems = recipeItems.map(item => {
      if (item.ingredientId === id) {
        return { 
          ...item, 
          quantity: isNaN(parsedQty) ? 0 : parsedQty,
          unit: unit ?? item.unit
        };
      }
      return item;
    });
    setRecipeItems(updatedItems);
    const summary = calculateRecipeCostSummary(updatedItems, products, formData.recipeYield);
    setFormData(prev => ({
      ...prev,
      cost: summary.unitCost.toFixed(4)
    }));
  };

  const removeIngredientFromRecipe = (id: string) => {
    const updatedItems = recipeItems.filter(item => item.ingredientId !== id);
    setRecipeItems(updatedItems);
    const summary = calculateRecipeCostSummary(updatedItems, products, formData.recipeYield);
    setFormData(prev => ({
      ...prev,
      cost: updatedItems.length > 0 ? summary.unitCost.toFixed(4) : prev.cost
    }));
  };

  const handleOpenEditProduct = async (product: Product) => {
    setEditingProduct(product);
    let items = product.recipe || [];
    let yieldVal = (product as any).recipeYield?.toString() || '1';

    // If product has no local recipe items and isn't an ingredient, check recipes collection
    if (items.length === 0 && !product.isIngredient) {
      try {
        const recipeDoc = await getDoc(doc(db, 'recipes', `recipe_${product.id}`));
        if (recipeDoc.exists()) {
          const recData = recipeDoc.data();
          yieldVal = recData.yield?.toString() || '1';
          items = (recData.ingredients || []).map((ing: any) => {
            const ingProd = products.find(p => p.id === ing.ingredientId);
            return {
              ingredientId: ing.ingredientId,
              name: ingProd?.name || 'Insumo',
              quantity: ing.quantity,
              cost: ingProd?.cost || 0,
              unit: ing.unit || ingProd?.unit || 'unid'
            };
          });
        }
      } catch (err) {
        console.warn('Error fetching recipe for product', err);
      }
    }

    setRecipeItems(items);

    const isIngredient = Boolean(product.isIngredient);
    const isFinished = product.isFinishedProduct !== undefined ? Boolean(product.isFinishedProduct) : !isIngredient;
    
    // Ensure cost matches exact current raw ingredients if recipe exists
    let calculatedCost = product.cost.toString();
    if (items.length > 0) {
      const summary = calculateRecipeCostSummary(items, products, yieldVal);
      calculatedCost = summary.unitCost.toFixed(4);
    }

    setFormData({
      name: product.name,
      price: product.price.toString(),
      wholesalePrice: product.wholesalePrice?.toString() || '',
      cost: calculatedCost,
      stock: product.stock.toString(),
      unit: product.unit || 'unid',
      imageUrl: product.imageUrl || '',
      category: product.category,
      isIngredient,
      isFinishedProduct: isFinished,
      isBajoPedido: product.isBajoPedido || false,
      recipeYield: yieldVal,
      recipe: items
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    const allowedOwnerIds = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) {
      allowedOwnerIds.push(DEFAULT_OWNER_ID);
    }

    const q = query(
      collection(db, 'products'),
      where('ownerId', 'in', allowedOwnerIds)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    return unsubscribe;
  }, [effectiveUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isFinished = Boolean(formData.isFinishedProduct);
    const hasRecipe = isFinished && recipeItems.length > 0;
    const summary = hasRecipe ? calculateRecipeCostSummary(recipeItems, products, formData.recipeYield) : null;
    const finalCost = hasRecipe && summary ? summary.unitCost : parseFloat(formData.cost || '0');

    const data = {
      ...formData,
      price: parseFloat(formData.price || '0'),
      wholesalePrice: parseFloat(formData.wholesalePrice || '0'),
      cost: finalCost,
      stock: parseFloat(formData.stock || '0'),
      recipe: isFinished ? recipeItems.map(item => ({
        ingredientId: item.ingredientId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        cost: products.find(p => p.id === item.ingredientId)?.cost || item.cost
      })) : [],
      recipeYield: parseFloat(formData.recipeYield || '1'),
      ownerId: effectiveUid,
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      let targetProductId = editingProduct?.id;
      
      if (editingProduct) {
        batch.update(doc(db, 'products', editingProduct.id), data);
      } else {
        const productRef = doc(collection(db, 'products'));
        targetProductId = productRef.id;
        batch.set(productRef, {
          ...data,
          createdAt: serverTimestamp()
        });
      }

      // Automatically sync recipe to 'recipes' collection if it's a finished product with ingredients
      if (isFinished && recipeItems.length > 0 && targetProductId) {
        const recipeRef = doc(db, 'recipes', `recipe_${targetProductId}`);
        batch.set(recipeRef, {
          productId: targetProductId,
          ownerId: effectiveUid,
          yield: parseFloat(formData.recipeYield || '1'),
          ingredients: recipeItems.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit || products.find(p => p.id === item.ingredientId)?.unit || 'unid'
          })),
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        }, { merge: true });
      }

      await batch.commit();
      setIsModalOpen(false);
      setEditingProduct(null);
      setRecipeItems([]);
      setFormData({ name: '', price: '', wholesalePrice: '', cost: '', stock: '', unit: 'unid', imageUrl: '', category: '', isIngredient: false, isFinishedProduct: true, isBajoPedido: false, recipeYield: '1', recipe: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setImportData(results.data);
        setIsImportModalOpen(true);
      }
    });
  };

  const processImport = async () => {
    if (!confirm(`¿Deseas importar ${importData.length} productos?`)) return;
    
    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      importData.forEach((row) => {
        const productRef = doc(collection(db, 'products'));
        batch.set(productRef, {
          name: row.Nombre || row.name || 'Sin nombre',
          price: parseFloat(row.Precio || row.price || '0'),
          wholesalePrice: parseFloat(row.PrecioMayor || row.wholesalePrice || '0'),
          cost: parseFloat(row.Costo || row.cost || '0'),
          stock: parseFloat(row.Stock || row.stock || '0'),
          category: row.Categoria || row.category || 'General',
          unit: row.Unidad || row.unit || 'unid',
          imageUrl: row.Imagen || row.imageUrl || '',
          isIngredient: false,
          isFinishedProduct: true,
          isBajoPedido: false,
          ownerId: effectiveUid,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      setIsImportModalOpen(false);
      setImportData([]);
      alert('¡Importación completada con éxito!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'products', id));
      batch.delete(doc(db, 'recipes', `recipe_${id}`));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  const filteredProducts = products
    .filter(p => {
      const search = searchTerm.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const matchesSearch = !search || 
        (p.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) ||
        (p.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search);
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'category') comparison = (a.category || '').localeCompare(b.category || '');
      if (sortBy === 'stock') comparison = (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'price') comparison = (a.price || 0) - (b.price || 0);
      if (sortBy === 'cost') comparison = getProductEffectiveCost(a, products) - getProductEffectiveCost(b, products);
      if (sortBy === 'inventoryValue') {
        const valA = Math.max(0, Number(a.stock || 0)) * getProductEffectiveCost(a, products);
        const valB = Math.max(0, Number(b.stock || 0)) * getProductEffectiveCost(b, products);
        comparison = valA - valB;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();

  // Métricas exactas de inversión en inventario coincidentes con el Tablero
  const totalInventoryCost = products.reduce((acc, p) => {
    const stock = Math.max(0, Number(p.stock || 0));
    return acc + (stock * getProductEffectiveCost(p, products));
  }, 0);

  const ingredientsCost = products
    .filter(p => p.isIngredient === true || p.isIngredient === 'true')
    .reduce((acc, p) => {
      const stock = Math.max(0, Number(p.stock || 0));
      return acc + (stock * getProductEffectiveCost(p, products));
    }, 0);

  const finishedCost = products
    .filter(p => (p.isFinishedProduct === true || p.isFinishedProduct === 'true') && (p.isIngredient !== true && p.isIngredient !== 'true'))
    .reduce((acc, p) => {
      const stock = Math.max(0, Number(p.stock || 0));
      return acc + (stock * getProductEffectiveCost(p, products));
    }, 0);

  const totalRetailValue = products
    .filter(p => p.isIngredient !== true && p.isIngredient !== 'true')
    .reduce((acc, p) => {
      const stock = Math.max(0, Number(p.stock || 0));
      const wholesalePrice = Number(p.wholesalePrice || p.price || 0);
      return acc + (stock * wholesalePrice);
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500 mt-1">Gestiona tus productos y existencias.</p>
        </div>
        <div className="flex gap-2">
            <label className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                <Upload size={18} />
                Importar CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
            <button 
              onClick={() => {
            setEditingProduct(null);
            setFormData({ 
              name: '', 
              price: '', 
              wholesalePrice: '', 
              cost: '', 
              stock: '', 
              unit: 'unid', 
              imageUrl: '', 
              category: '', 
              isIngredient: false, 
              isFinishedProduct: true,
              recipeYield: '1'
            });
            setRecipeItems([]);
            setIsModalOpen(true);
          }}
          className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-100 transition-all active:scale-95"
        >
          <Plus size={20} alt="Add" />
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>

      {/* Resumen Financiero de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Inversión Total (Costo)</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalInventoryCost)}</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Existencias valoradas al costo</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Inversión en Insumos</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(ingredientsCost)}</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Materia prima disponible</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Inversión en Terminados</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(finishedCost)}</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Productos listos para la venta</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mb-1">Valor de Venta Est.</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalRetailValue)}</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Proyección al precio mayor/detal</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {/* Category Filter */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm whitespace-nowrap min-w-[200px]">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer w-full"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm whitespace-nowrap">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="category">Ordenar por Categoría</option>
              <option value="stock">Ordenar por Stock</option>
              <option value="price">Ordenar por Precio</option>
              <option value="cost">Ordenar por Costo Unitario</option>
              <option value="inventoryValue">Ordenar por Valor Inventario</option>
            </select>
            <button 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className={cn(
                "ml-1 p-1.5 rounded-lg transition-colors font-black text-xs",
                sortOrder === 'asc' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
              )}
              title={sortOrder === 'asc' ? "Ascendente" : "Descendente"}
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Producto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Categoría</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Precio Venta</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Costo Unit.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Valor Inventario</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const effectiveCost = getProductEffectiveCost(product, products);
                const stockQty = Math.max(0, Number(product.stock || 0));
                const itemInventoryCost = stockQty * effectiveCost;
                const retailPrice = Number(product.wholesalePrice || product.price || 0);
                const itemInventoryRetail = stockQty * retailPrice;
                const hasRecipe = Boolean(product.recipe && product.recipe.length > 0);

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors overflow-hidden",
                          product.stock <= (product.lowStockThreshold || 5) 
                            ? "bg-red-50 text-red-500 shadow-sm shadow-red-100" 
                            : "bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white"
                        )}>
                          {product.imageUrl ? (
                            <img src={getGoogleDriveDirectLink(product.imageUrl)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{product.name}</span>
                          {product.stock <= (product.lowStockThreshold || 5) && (
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter animate-pulse">Stock Crítico</span>
                          )}
                        </div>
                        <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded italic uppercase">{product.unit || 'unid'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-black italic serif",
                            product.stock <= (product.lowStockThreshold || 5) ? "text-red-600" : "text-slate-900"
                          )}>
                            {product.stock} <span className="text-[10px] font-medium text-slate-400 uppercase">{product.unit || 'und'}</span>
                          </span>
                          {product.stock <= (product.lowStockThreshold || 5) && <AlertCircle size={14} className="text-red-500" />}
                        </div>
                        <div className="flex items-center gap-1 group/threshold">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Avisar en:</span>
                          <input 
                            type="number"
                            className="w-10 bg-transparent border-b border-slate-100 focus:border-blue-300 outline-none text-[10px] font-bold text-slate-500 text-center"
                            defaultValue={product.lowStockThreshold || 5}
                            onBlur={async (e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                await updateDoc(doc(db, 'products', product.id), {
                                  lowStockThreshold: val,
                                  updatedAt: serverTimestamp()
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-800">{formatCurrency(effectiveCost, 3)}</span>
                        {hasRecipe && (
                          <span className="block text-[8px] font-bold text-teal-600 uppercase tracking-tight">Cálculo Receta</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{formatCurrency(itemInventoryCost)}</span>
                        {product.price > 0 && stockQty > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Venta: {formatCurrency(itemInventoryRetail)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditProduct(product)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={48} className="text-slate-200" />
                      <p className="text-slate-400 font-medium">No se encontraron productos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingProduct ? 'Editar Producto' : 'Crear Producto'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">Nombre</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                {!formData.isIngredient && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">PVP (Detal)</label>
                      <input 
                        required={!formData.isIngredient}
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">Mayorista</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData({...formData, wholesalePrice: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                {(() => {
                  const modalSummary = calculateRecipeCostSummary(recipeItems, products, formData.recipeYield);
                  return (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">Costo Unitario</label>
                        <input 
                          required
                          disabled={formData.isFinishedProduct && recipeItems.length > 0}
                          type="number" 
                          step="0.0001"
                          placeholder="0.00"
                          className={cn(
                            "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-colors",
                            formData.isFinishedProduct && recipeItems.length > 0 ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-900"
                          )}
                          value={formData.cost}
                          onChange={(e) => setFormData({...formData, cost: e.target.value})}
                        />
                        {formData.isFinishedProduct && recipeItems.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1 p-2 bg-blue-50/60 rounded-lg border border-blue-100">
                            <div className="flex justify-between items-center text-[11px] font-bold text-blue-800">
                              <span>Costo Total Insumos (1 tanda):</span>
                              <span>{formatCurrency(modalSummary.totalBatchCost, 2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>Produce: {modalSummary.yieldAmount} {formData.unit}</span>
                              <span className="font-semibold text-blue-600">Costo: {formatCurrency(modalSummary.unitCost, 4)} / {formData.unit}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {formData.isFinishedProduct && (
                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-blue-900 italic uppercase">Receta / Ingredientes</h3>
                            <div className="flex items-center gap-3">
                               <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase">Produce (Rendimiento)</span>
                                  <div className="flex items-center gap-1">
                                     <input 
                                       type="number"
                                       step="0.01"
                                       className="w-16 bg-white border border-blue-200 rounded px-1.5 py-0.5 text-xs font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-300 transition-all text-center"
                                       value={formData.recipeYield}
                                       onChange={(e) => {
                                         const newYield = e.target.value;
                                         const val = parseFloat(newYield) || 1;
                                         const s = calculateRecipeCostSummary(recipeItems, products, val);
                                         setFormData(prev => ({ 
                                           ...prev, 
                                           recipeYield: newYield,
                                           cost: recipeItems.length > 0 ? s.unitCost.toFixed(4) : prev.cost
                                         }));
                                       }}
                                     />
                                     <span className="text-[10px] font-bold text-blue-400">{formData.unit}</span>
                                  </div>
                               </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                             <select 
                               onChange={(e) => {
                                 if (e.target.value) addIngredientToRecipe(e.target.value);
                                 e.target.value = "";
                               }}
                               className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-blue-600 outline-none"
                             >
                               <option value="">+ Añadir ingrediente a receta...</option>
                               {ingredientsOnly.map(ing => (
                                 <option key={ing.id} value={ing.id}>{ing.name} ({formatCurrency(ing.cost, 3)} / {ing.unit})</option>
                               ))}
                             </select>

                             <div className="space-y-2 mt-4">
                                {recipeItems.map(item => {
                                  const ingredient = products.find(p => p.id === item.ingredientId);
                                  const itemSummary = modalSummary.items.find(i => i.ingredientId === item.ingredientId);
                                  const availableUnits = getAvailableUnitsForIngredient(ingredient?.unit);

                                  return (
                                    <div key={item.ingredientId} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                                        <div className="flex flex-col gap-0.5">
                                          <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                            Costo Base: <span className="text-slate-600 font-bold">{formatCurrency(itemSummary?.baseCost || ingredient?.cost || 0, 4)}</span> por <span className="text-blue-500 font-black uppercase tracking-tighter">{itemSummary?.baseUnit || ingredient?.unit || 'unid'}</span>
                                          </p>
                                          <p className="text-[10px] text-blue-500 font-bold italic">
                                            Equivale a: {formatCurrency(itemSummary?.unitCostInRecipeUnit || 0, 4)} por {item.unit} 
                                            <span className="ml-2 text-slate-900 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap font-bold">
                                              Subtotal: {formatCurrency(itemSummary?.lineCost || 0)}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                     <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        step="0.001"
                                       className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center"
                                       value={item.quantity}
                                       onChange={(e) => updateIngredientQuantity(item.ingredientId, e.target.value)}
                                     />
                                     
                                     {availableUnits.length > 1 ? (
                                       <select 
                                         className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-1 rounded border border-blue-100 outline-none"
                                         value={item.unit}
                                         onChange={(e) => updateIngredientQuantity(item.ingredientId, item.quantity.toString(), e.target.value)}
                                       >
                                         {availableUnits.map(opt => (
                                           <option key={opt.value} value={opt.value}>{opt.label}</option>
                                         ))}
                                       </select>
                                     ) : (
                                       <span className="text-[10px] font-bold text-slate-400 w-8">{item.unit}</span>
                                     )}

                                     <button 
                                       type="button"
                                       onClick={() => removeIngredientFromRecipe(item.ingredientId)}
                                       className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                   </div>
                                 </div>
                                );
                              })}
                               {recipeItems.length === 0 && (
                                 <p className="text-center py-4 text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">No hay ingredientes aún</p>
                               )}
                             </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isIngredient} 
                      onChange={(e) => setFormData({
                        ...formData, 
                        isIngredient: e.target.checked,
                        isFinishedProduct: e.target.checked ? false : formData.isFinishedProduct
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-600">Es Insumo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isBajoPedido} 
                      onChange={(e) => setFormData({...formData, isBajoPedido: e.target.checked})}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-600 italic">Venta Bajo Pedido (Permitir sin stock)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isFinishedProduct} 
                      onChange={(e) => setFormData({
                        ...formData, 
                        isFinishedProduct: e.target.checked,
                        isIngredient: e.target.checked ? false : formData.isIngredient
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-600">Es Producto Final</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">Stock Inicial</label>
                    <input 
                      required
                      type="number" 
                      step="0.1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">Unidad</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      <option value="unid">Unid.</option>
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="gr">Gramos (gr)</option>
                      <option value="lt">Litros (lt)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="mtr">Metros (m)</option>
                    </select>
                  </div>
                </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">Categoría</label>
                    <input 
                      required
                      type="text" 
                      list="category-list"
                      placeholder="Ej: Bebidas, Panadería..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    />
                    <datalist id="category-list">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 italic serif">URL de Imagen (Opcional)</label>
                    <input 
                      type="url" 
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    />
                  </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
                  >
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Vista Previa Importación</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Se encontraron {importData.length} registros en tu archivo
                  </p>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 italic">
                    <tr>
                      <th className="pb-4">Producto</th>
                      <th className="pb-4">Precio</th>
                      <th className="pb-4">Stock</th>
                      <th className="pb-4">Categoría</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 font-medium">
                    {importData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-3 font-bold">{row.Nombre || row.name || Object.values(row)[0]}</td>
                        <td className="py-3">{formatCurrency(parseFloat(row.Precio || row.price || Object.values(row)[1] as string || '0'))}</td>
                        <td className="py-3">{row.Stock || row.stock || Object.values(row)[2]}</td>
                        <td className="py-3 italic">{row.Categoria || row.category || 'General'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 5 && (
                  <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase italic">... y {importData.length - 5} productos más</p>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={processImport}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  CONFIRMAR IMPORTACIÓN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
