import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Receipt, sendSaleWhatsApp } from '../components/Receipt';
import { Loader2, ArrowLeft, MessageCircle } from 'lucide-react';

export const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'sales', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSale({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching sale:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const handleWhatsApp = () => {
    if (sale) {
      sendSaleWhatsApp(sale);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-500 font-bold uppercase tracking-widest mb-4">Venta no encontrada</p>
        <button 
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-blue-600 font-black uppercase text-xs"
        >
          <ArrowLeft size={16} /> Volver a Ventas
        </button>
      </div>
    );
  }

  return (
    <div id="receipt-page-container" className="min-h-screen bg-app-background py-10 print:bg-white print:py-0 print:m-0">
      <div className="max-w-4xl mx-auto print:max-w-none print:m-0 print:p-0">
        <div className="mb-6 px-4 print:hidden flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/sales')}
              className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-xl text-slate-600 font-black uppercase text-[10px] shadow-sm hover:bg-white transition-all cursor-pointer"
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] transition-all shadow-sm cursor-pointer"
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modo Impresión Directa</p>
        </div>
        <Receipt sale={sale} hideActions={false} />
      </div>
    </div>
  );
};
