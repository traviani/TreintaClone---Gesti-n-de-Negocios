import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  TrendingUp, 
  Sparkles, 
  Package, 
  ShoppingCart, 
  AlertCircle,
  BrainCircuit,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';

interface ProductData {
  name: string;
  stock: number;
  price: number;
  category: string;
}

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}

interface AnalysisResult {
  topProducts: string[];
  recommendations: string[];
  demandLevel: 'high' | 'medium' | 'low';
  insight: string;
}

export default function DemandAnalysis() {
  const { user, effectiveUid } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Data for Context
      const allowedOwnerIds = [effectiveUid];
      if (effectiveUid !== DEFAULT_OWNER_ID) {
        allowedOwnerIds.push(DEFAULT_OWNER_ID);
      }

      const productsSnap = await getDocs(query(
        collection(db, 'products'),
        where('ownerId', 'in', allowedOwnerIds)
      ));
      const salesSnap = await getDocs(query(
        collection(db, 'sales'), 
        where('ownerId', 'in', allowedOwnerIds),
        orderBy('createdAt', 'desc'),
        limit(50)
      ));

      const products: ProductData[] = productsSnap.docs.map(doc => {
        const d = doc.data();
        return { name: d.name, stock: d.stock, price: d.price, category: d.category };
      });

      const salesSummary: Record<string, number> = {};
      salesSnap.docs.forEach(doc => {
        const items = doc.data().items || [];
        items.forEach((item: any) => {
          salesSummary[item.name] = (salesSummary[item.name] || 0) + item.quantity;
        });
      });

      const topSold = Object.entries(salesSummary)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, qty]) => `${name} (${qty} vendidos)`);

      // 2. Call Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Soy un sistema de gestión de negocios. Analiza la siguiente información de mi inventario y ventas recientes para darme consejos de fabricación y stock.
      
      PRODUCTOS ACTUALES (STOCK):
      ${products.map(p => `- ${p.name}: ${p.stock} unidades (CAT: ${p.category})`).join('\n')}
      
      VENTAS RECIENTES (TOP 10):
      ${topSold.join('\n')}
      
      Céntrate en recomendar qué fabricar para los productos que se venden mucho pero tienen poco stock o son "Bajo Pedido".`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topProducts: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Nombres de los 3 productos más críticos a fabricar" 
              },
              recommendations: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Lista de 3 a 5 consejos accionables" 
              },
              demandLevel: { 
                type: Type.STRING, 
                enum: ["high", "medium", "low"],
                description: "Nivel general de demanda analizado" 
              },
              insight: { 
                type: Type.STRING, 
                description: "Un párrafo analítico sobre la tendencia detectada" 
              }
            },
            required: ["topProducts", "recommendations", "demandLevel", "insight"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError("No pudimos realizar el análisis en este momento. Asegúrate de tener datos de ventas recientes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 text-blue-600 mb-2">
              <BrainCircuit size={28} strokeWidth={2.5} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Módulo de Inteligencia</span>
           </div>
           <h1 className="text-5xl font-black text-slate-900 italic serif tracking-tighter">Análisis de Demanda</h1>
           <p className="text-slate-500 font-medium italic mt-2">IA entrenada para optimizar tu producción y stock.</p>
        </div>
        
        <button 
          onClick={performAnalysis}
          disabled={loading}
          className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black flex items-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={20} />
              GENERAR ANÁLISIS IA
            </>
          )}
        </button>
      </header>

      <AnimatePresence mode="wait">
        {!analysis && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-20 rounded-[4rem] border-2 border-dashed border-slate-200 text-center space-y-6"
          >
             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp size={40} className="text-blue-200" />
             </div>
             <div className="max-w-sm mx-auto">
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">Tu asistente está listo</h3>
                <p className="text-slate-400 font-medium italic mt-2">Analizaremos tus últimas 50 ventas y todo tu inventario para darte una estrategia de producción ganadora.</p>
             </div>
             <button 
              onClick={performAnalysis}
              className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
             >
                Comenzar proceso de análisis
             </button>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600"
          >
             <AlertCircle size={24} />
             <p className="text-sm font-bold uppercase italic tracking-wide">{error}</p>
          </motion.div>
        )}

        {analysis && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Top Insight */}
            <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <BarChart3 size={200} />
               </div>
               <div className="relative z-10 max-w-2xl space-y-6">
                 <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      analysis.demandLevel === 'high' ? "bg-red-500 text-white" : analysis.demandLevel === 'medium' ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                      Demanda {analysis.demandLevel === 'high' ? 'Alta' : analysis.demandLevel === 'medium' ? 'Media' : 'Baja'}
                    </span>
                 </div>
                 <h2 className="text-4xl font-black italic tracking-tighter leading-tight">Insight Estratégico</h2>
                 <p className="text-lg font-medium italic text-slate-300 leading-relaxed">
                    "{analysis.insight}"
                 </p>
               </div>
            </div>

            {/* Critical Products */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                     <Package size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Prioridad de Fabricación</h3>
               </div>
               <div className="space-y-4">
                  {analysis.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                       <span className="text-4xl font-black text-slate-100 group-hover:text-amber-100 transition-colors italic tabular-nums">0{i+1}</span>
                       <p className="text-lg font-black text-slate-700 uppercase tracking-tight">{p}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white space-y-8 shadow-2xl shadow-blue-200">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                     <Lightbulb size={20} />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tight uppercase">Consejos Directos</h3>
               </div>
               <div className="space-y-6">
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 bg-white rounded-full" />
                       <p className="text-sm font-bold italic leading-relaxed opacity-90">{r}</p>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
