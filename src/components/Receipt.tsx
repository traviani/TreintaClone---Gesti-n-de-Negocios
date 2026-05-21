import React, { useState } from 'react';
import { Printer, ShoppingCart, Truck, Hammer, MessageCircle, FileText } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReceiptProps {
  sale: any;
  onSecondaryAction?: () => void;
  hideActions?: boolean;
}

export const Receipt: React.FC<ReceiptProps> = ({ sale, onSecondaryAction, hideActions = false }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    if (sale.id) {
      window.open(`${window.location.origin}/#/receipt/${sale.id}`, '_blank');
    } else {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    const idDisplay = sale.invoiceNumber ? String(sale.invoiceNumber).padStart(6, '0') : (sale.id?.replace(/\D/g, '').slice(-4) || '6313');
    const message = `*INVERSIONES TRAVIANI C.A.*\n\nHola *${sale.customerName}*, adjunto su nota de entrega *№ ${idDisplay}*.\n\n*Total a pagar:* $ ${formatCurrency(sale.total).replace('$', '')}\n\nUsted puede ver y descargar su recibo aquí:\n${window.location.origin}/#/receipt/${sale.id || ''}`;
    
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = sale.customerPhone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    
    // Backup and style sanitization utility
    const styleBackups: any[] = [];
    let tempDivCache: HTMLDivElement | null = null;
    
    const oklchToRgb = (oklchStr: string): string => {
      try {
        if (!tempDivCache) {
          tempDivCache = document.createElement('div');
          tempDivCache.style.display = 'none';
          document.body.appendChild(tempDivCache);
        }
        // Safely strip css variables or replace them with 1 within opacity to ensure parsing succeeds
        let sanitized = oklchStr;
        if (sanitized.includes('var(')) {
          sanitized = sanitized.replace(/\/ var\([^)]+\)/g, '');
        }
        tempDivCache.style.color = sanitized;
        const computed = window.getComputedStyle(tempDivCache).color;
        // If not parsed successfully, fall back to black or neutral dark/light gray
        if (!computed || computed === 'initial' || computed === 'inherit' || computed === '') {
          return 'rgba(0, 0, 0, 1)';
        }
        return computed;
      } catch (e) {
        return 'rgba(0, 0, 0, 1)';
      }
    };

    try {
      const element = document.getElementById('receipt-print');
      if (!element) {
        alert('No se pudo encontrar el diseño de la nota de entrega para generar el PDF.');
        return;
      }

      // 1. Process style tags to strip oklch
      const styleTags = Array.from(document.querySelectorAll('style'));
      for (const style of styleTags) {
        styleBackups.push({ element: style, originalText: style.innerHTML, type: 'style' });
        // Replace oklch(...) matches
        style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, (match) => oklchToRgb(match));
      }

      // 2. Process link tag stylesheets to convert oklch
      const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      for (const link of linkTags) {
        try {
          const href = (link as HTMLLinkElement).href;
          const response = await fetch(href);
          if (response.ok) {
            const cssText = await response.text();
            const cleanCss = cssText.replace(/oklch\([^)]+\)/g, (match) => oklchToRgb(match));
            
            const tempStyle = document.createElement('style');
            tempStyle.innerHTML = cleanCss;
            tempStyle.setAttribute('data-temp-clean-css', 'true');
            document.head.appendChild(tempStyle);
            
            styleBackups.push({ element: tempStyle, type: 'temp-style' });
            
            // Disable original link tag
            (link as any).disabled = true;
            styleBackups.push({ element: link, type: 'link-disable' });
          }
        } catch (err) {
          console.warn("Could not fetch and sanitize external stylesheet:", err);
        }
      }

      // Convert layout element to a high-density canvas block
      const canvas = await html2canvas(element, {
        scale: 3, // Excellent detail preservation (equivalent to ~300 DPI layout)
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Venezuelan half-letter (media carta): 215.9mm width x 139.7mm height (landscape matches layout beautifully)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [216, 140]
      });

      // Fit the image perfectly within the media carta dimensions
      pdf.addImage(imgData, 'PNG', 0, 0, 216, 140, undefined, 'FAST');
      
      const idDisplay = sale.invoiceNumber 
        ? String(sale.invoiceNumber).padStart(6, '0') 
        : (sale.id?.replace(/\D/g, '').slice(-4) || '6313');
      
      pdf.save(`Nota_de_Entrega_No_${idDisplay}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      // Restore styles
      try {
        for (const backup of styleBackups) {
          if (backup.type === 'style') {
            backup.element.innerHTML = backup.originalText;
          } else if (backup.type === 'temp-style') {
            backup.element.remove();
          } else if (backup.type === 'link-disable') {
            backup.element.disabled = false;
          }
        }
        if (tempDivCache) {
          tempDivCache.remove();
        }
      } catch (restoreError) {
        console.error("Error restoring stylesheet backups:", restoreError);
      }
      setIsGeneratingPdf(false);
    }
  };

  const dateStr = (typeof sale.createdAt?.toDate === 'function')
    ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(sale.createdAt.toDate())
    : 'RECIENTE';

  return (
    <div id="receipt-print-wrapper" className="flex flex-col items-center print:block print:p-0 print:m-0 print:bg-white">
      <div id="receipt-print" className="bg-white px-2 pt-[1cm] w-[210mm] mx-auto print:p-0 print:pt-0 print:w-full print:m-0 print:shadow-none">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <div className="w-[100px] h-[32px] overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5" 
                alt="Logo Traviani" 
                crossOrigin="anonymous"
                className="w-full h-full object-contain object-left"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/14HE9P_AammpTZ2dQWYRxK_J529N4fKf-";
                }}
              />
            </div>
            <h1 className="text-lg font-black text-slate-900 italic tracking-tight uppercase leading-none">Inversiones Traviani C.A.</h1>
          </div>
          <div className="text-right leading-none">
            <p className="text-xl font-black text-slate-900 tracking-tight">
              № {sale.invoiceNumber ? String(sale.invoiceNumber).padStart(6, '0') : `ID-${sale.id?.slice(-4).toUpperCase() || '6313'}`}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">FECHA: {dateStr}</p>
          </div>
        </div>

        <div className="text-center mb-3">
          <p className="text-xl font-black text-black italic tracking-[0.3em] border-y border-black py-0.5 leading-none">NOTA DE ENTREGA</p>
        </div>

        {/* Customer Information Section - Compact & Accurate */}
        <div className="pt-0.5 mb-1 text-[11px] border-t border-slate-200">
          <div className="flex justify-between items-start mb-0.5">
            <div className="flex gap-2">
              <span className="font-black italic uppercase">CLIENTE:</span>
              <span className="font-bold text-slate-800 uppercase">{sale.customerName}</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex gap-2">
                <span className="font-black italic uppercase">RIF/CI:</span>
                <span className="font-bold text-slate-800 whitespace-nowrap">{sale.customerIdNumber || 'J-501798788'}</span>
              </div>
              <span className={cn(
                "font-black italic uppercase",
                sale.saleType === 'credito' ? "text-red-600" : "text-primary"
              )}>
                {sale.saleType === 'credito' ? 'Crédito' : 'Contado'}
              </span>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <div className="flex gap-2">
              <span className="font-black italic uppercase">TEL:</span>
              <span className="font-bold text-slate-800">{sale.customerPhone || '584147096535'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black italic uppercase shrink-0">DIRECCIÓN:</span>
              <span className="font-bold text-slate-700 uppercase leading-tight">{sale.customerAddress || 'av gonzález rincones qta la nena la trinidad caracas'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-2">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-black">
                <th className="py-1 text-[11px] font-black italic uppercase w-16">CANT</th>
                <th className="py-1 text-[11px] font-black italic uppercase px-4">DESCRIPCIÓN</th>
                <th className="py-1 text-[11px] font-black italic uppercase text-right w-24">P.UNIT</th>
                <th className="py-1 text-[11px] font-black italic uppercase text-right w-32">TOTAL</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {sale.items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-0.5 font-black text-center">{item.quantity}</td>
                  <td className="py-0.5 px-4 font-bold text-slate-800 uppercase leading-none">{item.name}</td>
                  <td className="py-0.5 text-right text-slate-600 italic whitespace-nowrap">
                    $ {formatCurrency(item.price).replace('$', '')}
                  </td>
                  <td className="py-0.5 text-right font-black text-slate-900 whitespace-nowrap">
                    $ {formatCurrency(item.price * item.quantity).replace('$', '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Net Section */}
        <div className="space-y-0 mb-1 border-t border-black pt-0.5">
          {(sale.discount > 0 || sale.isSample) && (
            <>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase italic">
                <span>SUBTOTAL:</span>
                <span>$ {formatCurrency(sale.subtotal || sale.total + (sale.discount || 0)).replace('$', '')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-primary uppercase italic leading-none">
                <span>{sale.isSample ? 'BONIFICACIÓN (MUESTRA):' : 'DESCUENTO:'}</span>
                <span>- $ {formatCurrency(sale.discount).replace('$', '')}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center leading-tight">
            <h2 className="font-black italic uppercase tracking-tighter text-base">TOTAL NETO A PAGAR</h2>
            <span className="text-xl font-black tabular-nums tracking-tighter">
               $ {formatCurrency(sale.total).replace('$', '')}
            </span>
          </div>
        </div>

        {/* Payment Channels */}
        <div className="grid grid-cols-3 gap-0 border-y border-slate-100 py-0.5 text-[8.5px] mb-1">
          <div className="pr-4 border-r border-slate-100">
            <span className="font-black text-slate-400 block mb-0.5">PAGO MÓVIL</span>
            <p className="font-bold text-slate-800 uppercase">MERCANTIL | 0414-2391131 | V-13493831</p>
          </div>
          <div className="px-4 border-r border-slate-100">
            <span className="font-black text-slate-400 block mb-0.5">TRANSFERENCIA</span>
            <p className="font-bold text-slate-800 uppercase">0105-0750-21-1750063115 | Marco T.</p>
          </div>
          <div className="pl-4 text-right">
            <span className="font-black text-primary block mb-0.5">ZELLE / BINANCE</span>
            <p className="font-bold text-slate-800">tramontemarco27@gmail.com</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-lg font-black italic uppercase tracking-[0.2em] mb-0">¡GRACIAS POR SU CONFIANZA!</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">ORIGINAL - NO FACTURA FISCAL</p>
        </div>

        <style>
          {`
          @media print {
            @page { 
              margin: 0.5cm; 
              size: 216mm 140mm; 
            }
            
            /* Hide body and let inheritance handle the rest of DOM hiding naturally, avoiding parent pruning bugs */
            body {
              visibility: hidden !important;
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
            }

            /* Make only the receipt print wrapper and its children visible */
            #receipt-print-wrapper,
            #receipt-print-wrapper * {
              visibility: visible !important;
            }

            /* Natural document flow, positioned at the top-left margin coordinate naturally */
            #receipt-print-wrapper {
              display: block !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              position: relative !important;
            }

            #receipt-print {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }

            .print\\:hidden { 
              display: none !important; 
            }

            /* Force perfect color and image rendering across all print engines */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
        </style>
      </div>

      {!hideActions && (
        <div className="mt-8 text-center print:hidden w-full max-w-[210mm] flex flex-col items-center gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full animate-fade-in">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl py-3 font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText size={18} />
              )}
              {isGeneratingPdf ? 'GENERANDO...' : 'DESCARGAR PDF'}
            </button>

            <button 
              onClick={handlePrint}
              className="bg-primary hover:opacity-90 text-white rounded-xl py-3 font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
            >
              <Printer size={18} />
              IMPRIMIR
            </button>
            
            <button 
              onClick={handleWhatsApp}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl py-3 font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
            >
              <MessageCircle size={18} />
              WHATSAPP
            </button>
          </div>

          {onSecondaryAction && (
            <button 
              onClick={onSecondaryAction}
              className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all cursor-pointer"
            >
              ← Volver al punto de venta
            </button>
          )}
        </div>
      )}
    </div>
  );
};
