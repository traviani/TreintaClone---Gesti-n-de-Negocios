/**
 * Utilitarios de Conversión y Cálculo de Costos de Recetas
 * Garantiza consistencia matemática entre Inventario, Manufactura y Hojas de Producción.
 */

export interface NormalizedUnitInfo {
  canonical: string; // 'kg', 'gr', 'lt', 'ml', 'mtr', 'unid'
  label: string;
  category: 'mass' | 'volume' | 'length' | 'count';
}

/**
 * Normaliza cualquier variante de texto a una unidad canónica reconocida.
 */
export function normalizeUnit(unit?: string | null): string {
  if (!unit) return 'unid';
  const u = String(unit).toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

  // Masa (Kg / Gr)
  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'kgs'].includes(u) || u === 'k') return 'kg';
  if (['gr', 'g', 'gramo', 'gramos', 'grs', 'grm'].includes(u)) return 'gr';

  // Volumen (Lt / Ml)
  if (['lt', 'l', 'litro', 'litros', 'lts', 'ltr'].includes(u)) return 'lt';
  if (['ml', 'mls', 'mililitro', 'mililitros', 'cc'].includes(u)) return 'ml';

  // Longitud (Metros)
  if (['m', 'mtr', 'metro', 'metros', 'mts'].includes(u)) return 'mtr';
  if (['cm', 'centimetro', 'centimetros'].includes(u)) return 'cm';

  // Unidades de conteo
  if (['unid', 'und', 'unidad', 'unidades', 'pza', 'pieza', 'piezas', 'paquete', 'pqte', 'caja', 'docena'].includes(u)) return 'unid';

  return u || 'unid';
}

/**
 * Obtiene el factor multiplicador para convertir de una unidad a otra.
 * Ejemplo: getUnitConversionFactor('kg', 'gr') => 1000 (1 kg = 1000 gr)
 * Ejemplo: getUnitConversionFactor('gr', 'kg') => 0.001 (1 gr = 0.001 kg)
 */
export function getUnitConversionFactor(fromUnit?: string, toUnit?: string): number {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return 1;

  // Masa
  if (from === 'kg' && to === 'gr') return 1000;
  if (from === 'gr' && to === 'kg') return 0.001;

  // Volumen
  if (from === 'lt' && to === 'ml') return 1000;
  if (from === 'ml' && to === 'lt') return 0.001;

  // Longitud
  if (from === 'mtr' && to === 'cm') return 100;
  if (from === 'cm' && to === 'mtr') return 0.01;

  // Si son unidades incompatibles o de conteo, factor 1 (directo)
  return 1;
}

/**
 * Convierte una cantidad de una unidad a otra.
 */
export function convertQuantity(quantity: number, fromUnit?: string, toUnit?: string): number {
  const q = Number(quantity) || 0;
  const factor = getUnitConversionFactor(fromUnit, toUnit);
  return q * factor;
}

/**
 * Obtiene el costo por cada unidad de destino, partiendo del costo por unidad base.
 * Ejemplo: Base es 1 kg con costo $2.00. Target es 'gr'.
 * 1 gr cuesta $2.00 / 1000 = $0.002.
 */
export function getDisplayUnitCost(baseCost: number, baseUnit?: string, targetUnit?: string): number {
  const cost = Number(baseCost) || 0;
  const factor = getUnitConversionFactor(baseUnit, targetUnit);
  if (factor === 0) return cost;
  return cost / factor;
}

export interface CalculatedRecipeItem {
  ingredientId: string;
  name: string;
  recipeQuantity: number;
  recipeUnit: string;
  baseUnit: string;
  baseCost: number;
  unitCostInRecipeUnit: number;
  normalizedQuantityInBaseUnit: number;
  lineCost: number;
  currentStock: number;
  stockInRecipeUnit: number;
}

export interface CalculatedRecipeSummary {
  totalBatchCost: number;       // Costo total de insumos para 1 tanda completa
  unitCost: number;             // Costo por cada producto terminado resultante
  yieldAmount: number;          // Rendimiento base de la tanda (unidades producidas)
  items: CalculatedRecipeItem[];
}

/**
 * Calcula con precisión milimétrica el costo de una receta y sus insumos.
 * Maneja conversión de unidades, rendimientos y costo unitario.
 */
export function calculateRecipeCostSummary(
  ingredients: Array<{ ingredientId: string; quantity: number | string; unit?: string }>,
  products: Array<{ id: string; name?: string; cost?: number; unit?: string; stock?: number }>,
  yieldVal: number | string = 1
): CalculatedRecipeSummary {
  const parsedYield = Math.max(0.0001, parseFloat(String(yieldVal)) || 1);

  let totalBatchCost = 0;

  const items: CalculatedRecipeItem[] = (ingredients || []).map((ing) => {
    const ingProduct = products.find((p) => p.id === ing.ingredientId);
    const baseCost = Number(ingProduct?.cost || 0);
    const baseUnit = normalizeUnit(ingProduct?.unit);
    const recipeUnit = normalizeUnit(ing.unit || baseUnit);
    const recipeQuantity = Math.max(0, parseFloat(String(ing.quantity)) || 0);

    // Cantidad equivalente en la unidad base del insumo
    const normalizedQuantityInBaseUnit = convertQuantity(recipeQuantity, recipeUnit, baseUnit);

    // Costo de la línea para esta tanda
    const lineCost = baseCost * normalizedQuantityInBaseUnit;
    totalBatchCost += lineCost;

    // Costo por unidad en la unidad que el usuario seleccionó para la receta
    const unitCostInRecipeUnit = getDisplayUnitCost(baseCost, baseUnit, recipeUnit);

    const currentStock = Number(ingProduct?.stock || 0);
    const stockInRecipeUnit = convertQuantity(currentStock, baseUnit, recipeUnit);

    return {
      ingredientId: ing.ingredientId,
      name: ingProduct?.name || 'Insumo',
      recipeQuantity,
      recipeUnit,
      baseUnit,
      baseCost,
      unitCostInRecipeUnit,
      normalizedQuantityInBaseUnit,
      lineCost,
      currentStock,
      stockInRecipeUnit,
    };
  });

  const unitCost = totalBatchCost / parsedYield;

  return {
    totalBatchCost,
    unitCost,
    yieldAmount: parsedYield,
    items,
  };
}

/**
 * Devuelve las opciones de unidades permitidas para un insumo según su tipo base.
 */
export function getAvailableUnitsForIngredient(baseUnitRaw?: string): Array<{ value: string; label: string }> {
  const bu = normalizeUnit(baseUnitRaw);

  if (bu === 'kg' || bu === 'gr') {
    return [
      { value: 'kg', label: 'Kilogramos (kg)' },
      { value: 'gr', label: 'Gramos (gr)' },
    ];
  }

  if (bu === 'lt' || bu === 'ml') {
    return [
      { value: 'lt', label: 'Litros (lt)' },
      { value: 'ml', label: 'Mililitros (ml)' },
    ];
  }

  if (bu === 'mtr' || bu === 'cm') {
    return [
      { value: 'mtr', label: 'Metros (m)' },
      { value: 'cm', label: 'Centímetros (cm)' },
    ];
  }

  return [
    { value: bu || 'unid', label: (bu || 'unid').toUpperCase() },
  ];
}

/**
 * Obtiene el costo unitario efectivo de un producto.
 * Si el producto posee fórmula/receta con insumos, calcula dinámicamente el costo unitario real.
 * Si no tiene receta o no se puede calcular, utiliza su costo directo registrado.
 */
export function getProductEffectiveCost(
  product: { id?: string; cost?: number | string; recipe?: any[]; recipeYield?: number | string; [key: string]: any },
  allProducts: Array<{ id: string; name?: string; cost?: number | string; unit?: string; stock?: number }> = []
): number {
  if (!product) return 0;

  // Si tiene receta/fórmula con insumos, el costo real proviene de sus insumos y rendimiento
  if (product.recipe && Array.isArray(product.recipe) && product.recipe.length > 0) {
    try {
      const summary = calculateRecipeCostSummary(
        product.recipe,
        allProducts as any,
        product.recipeYield || 1
      );
      if (summary.unitCost > 0) {
        return summary.unitCost;
      }
    } catch {
      // Ignorar fallo de cálculo y continuar con costo directo
    }
  }

  let directCost = typeof product.cost === 'number' 
    ? product.cost 
    : parseFloat(String(product.cost || '0').replace(',', '.'));

  if (isNaN(directCost)) directCost = 0;

  return Math.max(0, directCost);
}
