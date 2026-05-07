import React, { useState } from 'react';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  query,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_OWNER_ID } from '../constants';
import { RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { motion } from 'motion/react';

export const MigrationTool: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const collectionsToSync = [
    'products',
    'sales',
    'customers',
    'expenses',
    'recipes',
    'purchases',
    'production_logs'
  ];

  const handleSync = async () => {
    if (!confirm('Esta acción sincronizará todos los datos existentes para que sean visibles en todas tus implementaciones (como Vercel). ¿Deseas continuar?')) return;

    setLoading(true);
    setResult(null);
    let totalUpdated = 0;

    try {
      for (const colName of collectionsToSync) {
        const snap = await getDocs(collection(db, colName));
        
        // Process in batches of 500
        const docs = snap.docs.filter(doc => doc.data().ownerId !== DEFAULT_OWNER_ID);
        
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          
          chunk.forEach(document => {
            batch.update(doc(db, colName, document.id), {
              ownerId: DEFAULT_OWNER_ID
            });
            totalUpdated++;
          });
          
          await batch.commit();
        }
      }

      if (totalUpdated > 0) {
        setResult({ 
          success: true, 
          message: `¡Sincronización exitosa! Se actualizaron ${totalUpdated} registros para ser públicos.` 
        });
      } else {
        setResult({ 
          success: true, 
          message: 'No se encontraron datos que necesitaran sincronización.' 
        });
      }
    } catch (error) {
      console.error('Error in migration:', error);
      setResult({ 
        success: false, 
        message: 'Error al sincronizar los datos. Es posible que existan muchos registros. Intenta de nuevo.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {result && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${result.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
        >
          {result.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          <span>{result.message}</span>
          <button onClick={() => setResult(null)} className="ml-1 hover:opacity-70">×</button>
        </motion.div>
      )}

      <button
        onClick={handleSync}
        disabled={loading}
        title="Sincronizar todos los datos para que sean públicos"
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          loading 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-white text-slate-400 hover:text-primary border border-slate-200 hover:border-primary border-opacity-30 shadow-sm active:scale-95'
        }`}
      >
        <Database size={14} className={loading ? "animate-bounce" : ""} />
        {loading ? 'Sincronizando...' : 'Sincronizar Datos'}
      </button>
    </div>
  );
};
