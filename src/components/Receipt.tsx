import React from 'react';
import { Printer, ShoppingCart, Truck, Hammer } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface ReceiptProps {
  sale: any;
  onSecondaryAction?: () => void;
  hideActions?: boolean;
}

export const Receipt: React.FC<ReceiptProps> = ({ sale, onSecondaryAction, hideActions = false }) => {
  const handlePrint = () => {
    // Abrir la página dedicada de impresión en una nueva pestaña
    // Esto garantiza que window.print() funcione sin bloqueos de iframe
    if (sale.id) {
      window.open(`${window.location.origin}/#/receipt/${sale.id}`, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div id="receipt-print" className="bg-white p-10 w-[210mm] mx-auto shadow-2xl border border-slate-100 rounded-[3rem] print:shadow-none print:border-0 print:p-0 print:w-full print:rounded-none">
        {/* Header Ultra Profesional */}
        <div className="flex items-start justify-between border-b-8 border-slate-900 pb-8 mb-10">
          <div className="flex items-center gap-10">
            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] overflow-hidden flex items-center justify-center shrink-0 shadow-2xl border-4 border-slate-50">
              <img 
                src="https://lh3.googleusercontent.com/d/14HE9P_AammpTZ2dQWYRxK_J529N4fKf-" 
                alt="Logo" 
                className="w-full h-full object-contain"
                onLoad={() => console.log('Logo OK')}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'logo-fallback w-full h-full bg-blue-600 text-white flex items-center justify-center font-black text-3xl italic';
                    fallback.innerText = 'TRAV';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-2">Inversiones Traviani</h1>
              <p className="text-base text-slate-400 font-black uppercase tracking-[0.4em]">C.A. | RIF: J-50567702-1</p>
              <div className="flex gap-8 mt-6">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Maracay, Edo. Aragua</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">0414-2391131</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] italic mb-6 inline-block shadow-xl shadow-blue-100 transform -rotate-3">Nota de Entrega</div>
            <p className="text-5xl font-black text-slate-900 tracking-tighter leading-none">#{sale.id?.replace(/\D/g, '').slice(-8) || sale.id?.slice(-8)}</p>
            <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4 italic">
              {sale.createdAt?.toDate ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'full' }).format(sale.createdAt.toDate()) : 'REGISTRO RECIENTE'}
            </p>
          </div>
        </div>

        {/* Info Grid Arquitectónico */}
        <div className="grid grid-cols-12 gap-10 mb-12">
          <div className="col-span-7 bg-slate-50 p-10 rounded-[3rem] border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110"></div>
            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6 block italic">Destinatario de la Mercancía</span>
            <p className="text-3xl font-black text-slate-900 uppercase leading-none mb-2 tracking-tight">{sale.customerName}</p>
            <p className="text-base font-bold text-slate-400 tracking-[0.2em] mb-10">DOCUMENTO: {sale.customerIdNumber || 'V-00000000'}</p>
            
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
               <div>
                 <span className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Contacto Directo</span>
                 <p className="text-lg font-black text-slate-800 italic">{sale.customerPhone || sale.phone || 'N/A'}</p>
               </div>
               <div>
                 <span className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Modalidad de Venta</span>
                 <p className="text-lg font-black text-blue-600 italic uppercase underline decoration-2 underline-offset-4">{sale.saleType || 'CONSIGNACIÓN'}</p>
               </div>
            </div>
          </div>
          
          <div className="col-span-5 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group ring-8 ring-slate-900/5">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 translate-x-1/3 group-hover:scale-125 transition-transform duration-1000"></div>
            <div>
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6 block italic">Logística de Despacho</span>
              <p className="text-base font-medium leading-relaxed italic opacity-80 line-clamp-3">
                {sale.customerAddress || sale.address || 'RETIRO PROGRAMADO EN SEDE PRINCIPAL / ALMACÉN DE DESPACHO'}
              </p>
            </div>
            <div className="mt-10 flex items-center gap-6">
               <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                 <Truck size={32} className="text-blue-400" />
               </div>
               <div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-blue-400">Estado del Envío</p>
                 <p className="text-xs font-bold text-slate-300 uppercase italic">Confirmado p/ Salida</p>
               </div>
            </div>
          </div>
        </div>

        {/* Tabla Estilo Boutique */}
        <div className="mb-12 overflow-hidden rounded-[2.5rem] border-2 border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] border-b border-slate-800">
                <th className="px-10 py-8 text-center w-32 italic">UNI.</th>
                <th className="px-10 py-8 text-left">DESCRIPCIÓN TÉCNICA DEL PRODUCTO</th>
                <th className="px-10 py-8 text-right w-48 italic">P. UNIT (REF)</th>
                <th className="px-10 py-8 text-right w-48 italic">VALOR TOTAL</th>
              </tr>
            </thead>
            <tbody className="text-lg divide-y divide-slate-100">
              {sale.items.map((item: any, i: number) => (
                <tr key={i} className="group hover:bg-slate-50 transition-all">
                  <td className="px-10 py-8 font-black text-slate-900 text-center bg-slate-50/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {item.quantity}
                  </td>
                  <td className="px-10 py-8">
                    <p className="font-black text-slate-900 uppercase tracking-tighter text-xl mb-1">{item.name}</p>
                    {item.isBajoPedido ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-[10px] font-black text-white uppercase tracking-widest border border-amber-400 shadow-sm">
                        <Hammer size={12} className="animate-bounce" /> PEDIDO EN PRODUCCIÓN
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic opacity-60">✓ Entrega de Inventario</span>
                    )}
                  </td>
                  <td className="px-10 py-8 text-right text-slate-400 tabular-nums font-bold italic group-hover:text-slate-600">{formatCurrency(item.price)}</td>
                  <td className="px-10 py-8 text-right font-black text-slate-900 tabular-nums text-2xl group-hover:scale-105 transition-transform">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Final de Impacto */}
        <div className="flex justify-between items-end mb-16 gap-20">
          <div className="flex-1">
             <div className="p-8 bg-blue-50 rounded-[2rem] border-2 border-blue-100/50 italic">
               <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">Nota Interna:</p>
               <p className="text-sm font-bold text-blue-900/60 leading-relaxed">
                 La mercancía viaja por cuenta y riesgo del comprador. Revise el estado de los empaques al momento de la recepción.
               </p>
             </div>
          </div>
          <div className="w-96 space-y-4">
             <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-[0.4em] italic px-8">
                <span>SUB-TOTAL NETO</span>
                <span>{formatCurrency(sale.total)}</span>
             </div>
             <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(30,41,59,0.3)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <span className="text-xs font-black italic tracking-[0.4em] uppercase text-blue-400 block mb-1">TOTAL A PAGAR</span>
                  <span className="text-5xl font-black tabular-nums tracking-tighter block">{formatCurrency(sale.total)}</span>
                </div>
                <ShoppingCart size={48} className="text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
             </div>
          </div>
        </div>

        {/* Canales de Pago Tipo Dashboard */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest italic">Nacional (Móvil)</span>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black">1</div>
            </div>
            <p className="text-lg font-black text-slate-900 uppercase mb-1">Mercantil</p>
            <p className="text-base font-bold text-slate-500 italic tracking-tighter">0414-2391131</p>
            <p className="text-base font-bold text-slate-500 italic">RIF: V-13.493.831</p>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest italic">Nacional (Transf)</span>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black">2</div>
            </div>
            <p className="text-lg font-black text-slate-900 uppercase mb-1">Bancamiga</p>
            <p className="text-xs font-bold text-slate-400 break-all leading-tight italic">0172-0110-73-1107567793</p>
            <p className="text-base font-bold text-slate-500 italic mt-2">MARCO TRAVIANI</p>
          </div>

          <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl transform hover:-translate-y-2 transition-all">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest italic">Internacional</span>
              <div className="w-10 h-10 rounded-full bg-blue-400 text-slate-900 flex items-center justify-center font-black">3</div>
            </div>
            <p className="text-lg font-black text-white italic mb-1 uppercase">Zelle / Binance</p>
            <p className="text-sm font-bold text-blue-400 lowercase italic break-all">tramontemarco27@gmail.com</p>
            <p className="text-[10px] font-black text-slate-500 mt-6 uppercase tracking-widest">* Validar con Soporte</p>
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="text-center py-12 border-t-4 border-slate-900">
          <p className="text-3xl font-black text-slate-900 uppercase tracking-[0.5em] italic mb-4">Inversiones Traviani</p>
          <div className="flex justify-center gap-10 mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Original: Cliente</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Duplicado: Archivo</p>
          </div>
          <p className="text-xs text-slate-300 font-bold uppercase italic tracking-widest max-w-2xl mx-auto leading-relaxed">
            Documento de control interno no fiscal. La empresa se reserva el derecho de revisión de precios en caso de variaciones significativas en el mercado.
          </p>
        </div>

        {/* CSS de Impresión Mejorado */}
        <style>
          {`
          @media print {
            @page { 
              margin: 0;
              size: auto;
            }
            body { 
              margin: 1.5cm; 
              background: white !important;
              -webkit-print-color-adjust: exact;
            }
            body * { visibility: hidden !important; }
            #receipt-print, #receipt-print * { visibility: visible !important; }
            #receipt-print { 
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
            .shadow-2xl { box-shadow: none !important; }
            .print\\:hidden { display: none !important; }
          }
        `}
        </style>
      </div>

      {!hideActions && (
        <div className="mt-16 text-center print:hidden w-[210mm] flex flex-col gap-6">
          <button 
            onClick={handlePrint}
            className="w-full bg-slate-900 hover:bg-black text-white rounded-[3rem] py-8 font-black text-xl uppercase tracking-[0.4em] italic flex items-center justify-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <Printer size={32} className="group-hover:scale-125 transition-transform relative z-10" />
            <span className="relative z-10">Generar Impresión de Lujo</span>
          </button>
          {onSecondaryAction && (
            <button 
              onClick={onSecondaryAction}
              className="text-base font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.5em] transition-all py-6 italic hover:tracking-[0.6em]"
            >
              Regresar al Panel de Gestión
            </button>
          )}
        </div>
      )}
    </div>
  );
};
