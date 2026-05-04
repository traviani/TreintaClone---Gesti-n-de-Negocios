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
      const batch = writeBatch(db);
      
      for (const colName of collectionsToSync) {
        // Obtenemos todos los documentos de la colección (limitado a 500 por seguridad por lote)
        const snap = await getDocs(query(collection(db, colName), limit(500)));
        
        snap.docs.forEach(document => {
          const data = document.data();
          // Solo actualizamos si el ownerId no es ya el DEFAULT_OWNER_ID
          if (data.ownerId !== DEFAULT_OWNER_ID) {
            batch.update(doc(db, colName, document.id), {
              ownerId: DEFAULT_OWNER_ID
            });
            totalUpdated++;
          }
        });
      }

      if (totalUpdated > 0) {
        await batch.commit();
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
        message: 'Error al sincronizar los datos. Revisa la consola para más detalles.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sincronización de Datos</h2>
          <p className="text-sm text-slate-500">Asegúrate de que todos tus datos sean visibles en Vercel.</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          Si cargaste datos anteriormente y no los ves en tu implementación de Vercel, es posible que estén asociados a una sesión diferente. 
          Este botón hará que todos los registros existentes en el catálogo, ventas, compras y gastos sean <strong>públicos</strong> bajo el ID <code>{DEFAULT_OWNER_ID}</code>.
        </p>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-start gap-3 ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
          >
            {result.success ? <CheckCircle2 className="shrink-0" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
            <p className="text-sm font-medium">{result.message}</p>
          </motion.div>
        )}

        <button
          onClick={handleSync}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-black active:scale-[0.98] shadow-lg shadow-slate-100'
          }`}
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={20} />
          ) : (
            <RefreshCw size={20} />
          )}
          {loading ? 'Sincronizando...' : 'Sincronizar Todo a Público'}
        </button>
      </div>
    </div>
  );
};
