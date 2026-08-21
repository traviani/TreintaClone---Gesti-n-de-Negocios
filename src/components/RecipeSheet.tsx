import React, { useState } from 'react';
import { Printer, X, Utensils, CheckSquare, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export interface RecipeIngredientDetail {
  ingredientId: string;
  name: string;
  unit: string;
  baseUnit: string;
  baseQuantity: number;
  totalQuantity: number;
  currentStock: number;
  unitCost: number;
  totalCost: number;
  hasEnoughStock: boolean;
}

export interface RecipeSheetProps {
  recipe: any;
  product: any;
  ingredients: RecipeIngredientDetail[];
  batchMultiplier: number;
  totalRecipeCostPerUnit: number;
  totalBatchCost: number;
  isOpen: boolean;
  onClose: () => void;
}

export const printRecipeDocument = (recipeElementId: string, recipeTitle: string) => {
  const printElement = document.getElementById(recipeElementId);
  if (!printElement) {
    window.print();
    return;
  }

  const existingIframe = document.getElementById('recipe-sheet-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const printIframe = document.createElement('iframe');
  printIframe.id = 'recipe-sheet-print-iframe';
  printIframe.style.position = 'fixed';
  printIframe.style.left = '-9999px';
  printIframe.style.top = '0';
  printIframe.style.width = '215.9mm';
  printIframe.style.height = '279.4mm';
  printIframe.style.border = 'none';
  printIframe.style.opacity = '0.01';
  printIframe.style.pointerEvents = 'none';
  printIframe.style.zIndex = '-999';
  document.body.appendChild(printIframe);

  const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (!iframeDoc || !printIframe.contentWindow) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receta - ${recipeTitle} - Inversiones Traviani</title>
        ${styles}
        <style>
          @page {
            size: letter portrait;
            margin: 8mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            color: #0f172a !important;
          }
          .recipe-sheet-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
          }
        </style>
      </head>
      <body>
        <div class="recipe-sheet-container">
          ${printElement.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  const images = Array.from(iframeDoc.images);
  Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  ).then(() => {
    setTimeout(() => {
      try {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print failed, fallback to window.print():', e);
        window.print();
      }
    }, 350);
  });
};

export const RecipeSheet: React.FC<RecipeSheetProps> = ({
  recipe,
  product,
  ingredients,
  batchMultiplier,
  totalRecipeCostPerUnit,
  totalBatchCost,
  isOpen,
  onClose
}) => {
  const [imgError, setImgError] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !product || !recipe) return null;

  const recipeName = product?.name || 'Receta Sin Nombre';
  const yieldAmount = recipe?.yield || 1;
  const totalBatchYield = yieldAmount * (batchMultiplier || 1);
  const productUnit = product?.unit || 'unid';
  const dateStr = new Intl.DateTimeFormat('es-VE', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(new Date());

  const handlePrint = () => {
    setIsPrinting(true);
    printRecipeDocument('recipe-sheet-printable-content', recipeName);
    setTimeout(() => setIsPrinting(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Top Bar (Screen Only) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-tight">
                Hoja de Producción & Receta
              </h3>
              <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                Ficha Técnica: {recipeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isPrinting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              {isPrinting ? 'Preparando...' : 'Imprimir Receta'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 custom-scrollbar">
          {/* Printable Document Container */}
          <div 
            id="recipe-sheet-printable-content"
            className="bg-white border border-slate-300 shadow-lg rounded-2xl p-6 sm:p-8 mx-auto w-full max-w-[210mm] text-slate-900 box-border font-sans"
            style={{ minHeight: '260mm', backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            {/* Header Section */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900 mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-[125px] h-[40px] flex items-center justify-start overflow-hidden">
                  {!imgError ? (
                    <img 
                      src="https://lh3.googleusercontent.com/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5" 
                      alt="Logo Traviani" 
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain object-left"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="bg-teal-800 text-white text-xs px-2.5 py-1 rounded font-black">TRAVIANI</span>
                  )}
                </div>
                <div>
                  <h1 className="font-black text-slate-950 uppercase tracking-tight text-sm leading-tight">
                    Inversiones Traviani C.A.
                  </h1>
                  <p className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wide">
                    RIF: J-501798788 • Planta de Producción
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-wider mb-1">
                  HOJA DE PRODUCCIÓN
                </div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">
                  FECHA: {dateStr}
                </p>
              </div>
            </div>

            {/* Main Recipe Banner with Product Name Prominently Displayed */}
            <div className="bg-blue-50/80 border-2 border-blue-900/40 rounded-xl p-4 mb-5">
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-900 block mb-1">
                  NOMBRE DE LA RECETA / PRODUCTO A ELABORAR
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 leading-tight">
                  {recipeName}
                </h2>
              </div>

              {/* Recipe Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-blue-200 text-center">
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Rendimiento Base</span>
                  <span className="text-sm font-black text-slate-950">
                    {yieldAmount} {productUnit}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Tandas Programadas</span>
                  <span className="text-sm font-black text-blue-700">
                    {batchMultiplier || 1} {batchMultiplier === 1 ? 'tanda' : 'tandas'}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Total a Producir</span>
                  <span className="text-sm font-black text-emerald-800">
                    {totalBatchYield.toLocaleString()} {productUnit}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Stock Actual</span>
                  <span className="text-sm font-black text-slate-850">
                    {product?.stock || 0} {productUnit}
                  </span>
                </div>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                  <Utensils size={14} className="text-blue-600" />
                  DETALLE DE INSUMOS Y MATERIAS PRIMAS
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {ingredients.length} {ingredients.length === 1 ? 'Insumo' : 'Insumos requeridos'}
                </span>
              </div>

              <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-700">#</th>
                      <th className="py-2 px-3 border-r border-slate-700">INSUMO / MATERIA PRIMA</th>
                      <th className="py-2 px-2 text-center w-24 border-r border-slate-700">FÓRMULA BASE (1 TANDA)</th>
                      <th className="py-2 px-2 text-center w-28 border-r border-slate-700 bg-blue-950">
                        TOTAL REQUERIDO ({batchMultiplier}X)
                      </th>
                      <th className="py-2 px-2 text-right w-24 border-r border-slate-700">COSTO UNIT.</th>
                      <th className="py-2 px-2 text-right w-24 border-r border-slate-700">SUBTOTAL ($)</th>
                      <th className="py-2 px-2 text-center w-16">PESADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing, idx) => (
                      <tr key={idx} className="border-b border-slate-300 odd:bg-white even:bg-slate-50 font-medium">
                        <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-300">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-950 uppercase border-r border-slate-300">
                          {ing.name}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-700 font-semibold border-r border-slate-300">
                          {ing.baseQuantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {ing.unit}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-blue-900 bg-blue-50/60 border-r border-slate-300">
                          {ing.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {ing.unit}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-700 font-mono border-r border-slate-300">
                          ${formatCurrency(ing.unitCost, 4).replace('$', '')}
                        </td>
                        <td className="py-2 px-2 text-right font-black text-slate-950 font-mono border-r border-slate-300">
                          ${formatCurrency(ing.totalCost, 2).replace('$', '')}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="w-4 h-4 border-2 border-slate-900 rounded mx-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Analysis & Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Production Cost Breakdown */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-2 border-b border-slate-200 pb-1">
                  RESUMEN DE COSTOS DE FABRICACIÓN
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Costo por {productUnit} (Unitario):</span>
                    <span className="font-extrabold text-slate-950 font-mono">
                      ${formatCurrency(totalRecipeCostPerUnit, 4).replace('$', '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Costo por Tanda ({yieldAmount} {productUnit}):</span>
                    <span className="font-extrabold text-slate-950 font-mono">
                      ${formatCurrency(totalRecipeCostPerUnit * yieldAmount, 2).replace('$', '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-300 text-slate-950 font-black">
                    <span>COSTO TOTAL DEL LOTE ({batchMultiplier} tandas):</span>
                    <span className="text-sm font-mono text-blue-900">
                      ${formatCurrency(totalBatchCost, 2).replace('$', '')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercial Valuation & Margins */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-2 border-b border-slate-200 pb-1">
                  VALORIZACIÓN COMERCIAL Y PRECIOS
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Precio Venta Detal / {productUnit}:</span>
                    <span className="font-extrabold text-slate-950 font-mono">
                      ${formatCurrency(product?.price || 0, 2).replace('$', '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Precio Venta Mayor / {productUnit}:</span>
                    <span className="font-extrabold text-slate-950 font-mono">
                      ${formatCurrency((product as any)?.wholesalePrice || 0, 2).replace('$', '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-300 text-slate-950 font-black">
                    <span>VALOR COMERCIAL TOTAL (Mayor):</span>
                    <span className="text-sm font-mono text-emerald-800">
                      ${formatCurrency(((product as any)?.wholesalePrice || 0) * totalBatchYield, 2).replace('$', '')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality & Production Sign-off Section */}
            <div className="border-t-2 border-slate-900 pt-3 mt-4">
              <div className="grid grid-cols-3 gap-4 text-[10px] text-center pt-2">
                <div className="space-y-6">
                  <p className="font-extrabold uppercase text-slate-700">OPERADOR DE PLANTA / TALLER</p>
                  <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Firma y Cédula</p>
                </div>
                <div className="space-y-6">
                  <p className="font-extrabold uppercase text-slate-700">SUPERVISIÓN / CONTROL CALIDAD</p>
                  <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Aprobación de Lote</p>
                </div>
                <div className="space-y-6">
                  <p className="font-extrabold uppercase text-slate-700">FECHA Y LOTE DE PRODUCCIÓN</p>
                  <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Lote Nº ________________</p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200 text-center">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Inversiones Traviani C.A. • Sistema de Control de Producción y Recetas Maestras
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-500 font-medium italic">
            Formato configurado para impresión estándar en Hoja Carta o A4.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              Imprimir Receta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
