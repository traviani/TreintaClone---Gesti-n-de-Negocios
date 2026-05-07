import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Receipt } from '../components/Receipt';
import { Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

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

  useEffect(() => {
    if (sale) {
      // Pequeño delay para asegurar que el logo y estilos carguen
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sale]);

  const handleWhatsApp = () => {
    if (!sale) return;
    const idDisplay = sale.id?.replace(/\D/g, '').slice(-4) || '6313';
    const message = `*INVERSIONES TRAVIANI C.A.*\n\nHola *${sale.customerName}*, adjunto su nota de entrega *№ ${idDisplay}*.\n\n*Total a pagar:* $ ${formatCurrency(sale.total).replace('$', '')}\n\nUsted puede ver y descargar su recibo aquí:\n${window.location.origin}/#/receipt/${sale.id || ''}`;
    
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = sale.customerPhone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
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
    <div id="receipt-print-root" className="min-h-screen bg-app-background py-10 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto print:max-w-none">
        <div className="mb-6 px-4 print:hidden flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/sales')}
              className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-xl text-slate-600 font-black uppercase text-[10px] shadow-sm hover:bg-white transition-all"
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 px-4 py-2 rounded-xl text-[#25D366] font-black uppercase text-[10px] transition-all"
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modo Impresión Directa</p>
        </div>
        <Receipt sale={sale} hideActions={true} />
      </div>
    </div>
  );
};
