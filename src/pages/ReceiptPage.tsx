import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Receipt, sendSaleWhatsApp } from '../components/Receipt';
import { printThermalTicketDirectly, openTicketInPrintWindow } from '../lib/thermalPrint';
import { Loader2, ArrowLeft, MessageCircle, Printer, Receipt as ReceiptIcon } from 'lucide-react';

export const ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const searchString = location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
  const searchParams = new URLSearchParams(searchString);
  const initialFormat = (searchParams.get('format') === 'ticket') ? 'ticket' : 'letter';
  const autoTrigger = searchParams.get('print') === 'true' ? (initialFormat as 'letter' | 'ticket') : undefined;

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
        <div className="mb-6 px-4 print:hidden flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2 items-center">
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
            <button
              onClick={() => printThermalTicketDirectly(sale)}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] transition-all shadow-sm cursor-pointer"
            >
              <ReceiptIcon size={14} /> Imprimir Aclas (80mm)
            </button>
            <button
              onClick={() => openTicketInPrintWindow(sale)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl font-black uppercase text-[10px] transition-all shadow-sm cursor-pointer"
            >
              <Printer size={14} /> Ventana Limpia
            </button>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {initialFormat === 'ticket' ? 'Ticket Térmico Aclas (80mm)' : 'Modo Impresión Directa'}
          </p>
        </div>
        <Receipt 
          sale={sale} 
          hideActions={false} 
          initialFormat={initialFormat}
          autoTrigger={autoTrigger}
        />
      </div>
    </div>
  );
};
