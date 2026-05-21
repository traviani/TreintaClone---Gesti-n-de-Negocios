import React, { useState } from 'react';
import { ShoppingCart, Truck, Hammer, FileText } from 'lucide-react';
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

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    
    const colorCache = new Map<string, string>();
    const cleanups: (() => void)[] = [];
    
    const colorToRgbFn = (colorStr: string): string => {
      if (colorCache.has(colorStr)) {
        return colorCache.get(colorStr)!;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = colorStr;
          ctx.fillRect(0, 0, 1, 1);
          const data = ctx.getImageData(0, 0, 1, 1).data;
          const rgb = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
          colorCache.set(colorStr, rgb);
          return rgb;
        }
      } catch (e) {
        console.warn("Could not convert colors via canvas:", e);
      }
      return 'rgb(0, 0, 0)';
    };

    const sanitizeColorCSS = (cssText: string): string => {
      let result = '';
      let index = 0;
      
      while (index < cssText.length) {
        const oklchStart = cssText.indexOf('oklch(', index);
        const oklabStart = cssText.indexOf('oklab(', index);
        
        let start = -1;
        let lengthOfFuncName = 6;
        if (oklchStart !== -1 && oklabStart !== -1) {
          if (oklchStart < oklabStart) {
            start = oklchStart;
            lengthOfFuncName = 6;
          } else {
            start = oklabStart;
            lengthOfFuncName = 6;
          }
        } else if (oklchStart !== -1) {
          start = oklchStart;
          lengthOfFuncName = 6;
        } else if (oklabStart !== -1) {
          start = oklabStart;
          lengthOfFuncName = 6;
        }
        
        if (start === -1) {
          result += cssText.substring(index);
          break;
        }
        
        result += cssText.substring(index, start);
        
        let parenCount = 1;
        let scanIndex = start + lengthOfFuncName;
        
        while (scanIndex < cssText.length && parenCount > 0) {
          const char = cssText[scanIndex];
          if (char === '(') {
            parenCount++;
          } else if (char === ')') {
            parenCount--;
          }
          scanIndex++;
        }
        
        const colorExpression = cssText.substring(start, scanIndex);
        const rgbReplacement = colorToRgbFn(colorExpression);
        result += rgbReplacement;
        
        index = scanIndex;
      }
      
      return result;
    };

    const cleanColorString = (val: string): string => {
      if (typeof val !== 'string' || (!val.includes('oklch') && !val.includes('oklab'))) {
        return val;
      }
      return sanitizeColorCSS(val);
    };

    const patchWindow = (win: Window) => {
      const orig = win.getComputedStyle;
      if (!orig) return;
      
      win.getComputedStyle = function(el, pseudo) {
        const style = orig.call(win, el, pseudo);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                return cleanColorString(val);
              };
            }
            const val = (target as any)[prop];
            if (typeof prop === 'string' && typeof val === 'string') {
              return cleanColorString(val);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        });
      };
      
      cleanups.push(() => {
        win.getComputedStyle = orig;
      });
    };

    let iframe: HTMLIFrameElement | null = null;

    try {
      const element = document.getElementById('receipt-print');
      if (!element) {
        alert('No se pudo encontrar el diseño de la nota de entrega para generar el PDF.');
        return;
      }

      // 1. Compile and sanitize ALL readable stylesheets/style tags active in the document beforehand
      let combinedCss = '';
      
      // Look at style tags text content (always readable without CORS/iframe limits)
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach(tag => {
        combinedCss += (tag.textContent || '') + '\n';
      });

      // Look at link tags if same-origin
      const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
      for (let i = 0; i < linkTags.length; i++) {
        const link = linkTags[i] as HTMLLinkElement;
        const href = link.href;
        if (href) {
          try {
            const linkUrl = new URL(href, window.location.origin);
            if (linkUrl.origin === window.location.origin) {
              const res = await fetch(href);
              if (res.ok) {
                const text = await res.text();
                combinedCss += text + '\n';
              }
            }
          } catch (e) {
            // Ignore fetch fails
          }
        }
      }

      // Fallback to active styleSheets if we didn't capture enough styling
      if (combinedCss.trim().length < 50) {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              for (let j = 0; j < rules.length; j++) {
                combinedCss += rules[j].cssText + '\n';
              }
            }
          } catch (e) {
            // Cross-origin CSS fails to read cssRules, which is skipped safely
          }
        }
      }

      const sanitizedCss = sanitizeColorCSS(combinedCss);

      // 2. Create the hidden sandboxed iframe
      iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '210mm';
      iframe.style.height = '140mm';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.visibility = 'hidden';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('No se pudo inicializar el sandbox del iframe.');
      }

      // 3. Write clean HTML including sanitized styles to the iframe
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              ${sanitizedCss}
              body {
                background-color: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 140mm !important;
                overflow: hidden !important;
              }
              #receipt-print-sandbox {
                background-color: #ffffff !important;
                width: 210mm !important;
                height: 140mm !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }
            </style>
          </head>
          <body>
            <div id="receipt-print-sandbox"></div>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait a short slice of time for stylesheets parsing
      await new Promise(resolve => setTimeout(resolve, 80));

      // Wait for fonts to be ready/loaded in both windows
      try {
        await Promise.all([
          document.fonts.ready,
          iframeDoc.fonts.ready,
          iframe.contentWindow ? (iframe.contentWindow as any).document?.fonts?.ready : Promise.resolve()
        ].filter(Boolean));
      } catch (fontErr) {
        console.warn("Error waiting for fonts:", fontErr);
      }

      // Patch computed styles on both main window & iframe window (must run after iframeDoc.close())
      patchWindow(window);
      if (iframe.contentWindow) {
        patchWindow(iframe.contentWindow);
      }

      const sandboxWrapper = iframeDoc.getElementById('receipt-print-sandbox');
      if (!sandboxWrapper) {
        throw new Error('No se pudo encontrar el contenedor del sandbox.');
      }

      // 4. Import the print element clone into our iframe sandbox
      const clonedNode = iframeDoc.importNode(element, true);
      sandboxWrapper.appendChild(clonedNode);

      // 5. Sanitize any inline styles that might contain oklch in the cloned elements
      const allClonedElements = sandboxWrapper.querySelectorAll('*');
      allClonedElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const styleAttr = htmlEl.getAttribute('style');
        if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
          htmlEl.setAttribute('style', sanitizeColorCSS(styleAttr));
        }
      });

      // 6. Wait for all resources/images to be completely loaded inside the iframe
      const iframeImages = Array.from(sandboxWrapper.querySelectorAll('img'));
      await Promise.all(
        iframeImages.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      // Tiny delay for layout compilation
      await new Promise(resolve => setTimeout(resolve, 100));

      // 7. Run html2canvas inside the clean sandboxed iframe document!
      const canvas = await html2canvas(clonedNode as HTMLElement, {
        scale: 3, // High density
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
      pdf.addPage(undefined, 'landscape'); // Make sure we orient a clean, correct format page
      pdf.deletePage(1); // delete default letter/a4 page
      pdf.addImage(imgData, 'PNG', 0, 0, 216, 140, undefined, 'FAST');
      
      const idDisplay = sale.invoiceNumber 
        ? String(sale.invoiceNumber).padStart(6, '0') 
        : (sale.id?.replace(/\D/g, '').slice(-4) || '6313');
      
      pdf.save(`Nota_de_Entrega_No_${idDisplay}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert('Error al generar PDF: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      // Restore dynamic original states
      cleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (e) {
          console.warn("Error running computedStyle cleanup:", e);
        }
      });
      
      // 8. Securely clean up the iframe node
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
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
          <div className="flex items-center gap-6">
            <div className="w-[145px] h-[45px] pl-2 flex items-center justify-start overflow-visible">
              <img 
                src="https://lh3.googleusercontent.com/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5" 
                alt="Logo Traviani" 
                crossOrigin="anonymous"
                className="h-full object-contain object-left"
                style={{
                  maxWidth: "140px",
                  maxHeight: "45px",
                  display: "block"
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/14HE9P_AammpTZ2dQWYRxK_J529N4fKf-";
                }}
              />
            </div>
            <h1 className="font-black text-slate-900 italic tracking-tight uppercase leading-none" style={{ fontSize: '0.9rem', marginLeft: '10px' }}>Inversiones Traviani C.A.</h1>
          </div>
          <div className="text-right leading-none">
            <p className="text-xl font-black text-slate-900 tracking-tight">
              № {sale.invoiceNumber ? String(sale.invoiceNumber).padStart(6, '0') : `ID-${sale.id?.slice(-4).toUpperCase() || '6313'}`}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">FECHA: {dateStr}</p>
          </div>
        </div>

        {/* NOTA DE ENTREGA Header Section with separate borders for perfect canvas compatibility */}
        <div className="text-center mb-3 flex flex-col items-center">
          <div className="w-full border-t border-black"></div>
          <p className="text-xl font-black text-black italic tracking-[0.3em] py-1 leading-none uppercase select-none my-0.5">
            NOTA DE ENTREGA
          </p>
          <div className="w-full border-b border-black"></div>
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

        {/* Items Table with standard flex rows to avoid html2canvas cell border collapses striking through text */}
        <div className="mb-2 w-full">
          <div className="w-full">
            {/* Header row with precise border divs */}
            <div className="w-full">
              <div className="w-full border-t border-black"></div>
              <div className="flex items-center py-1 text-[11px] font-black italic uppercase select-none">
                <div className="w-16 text-center">CANT</div>
                <div className="flex-1 px-4 text-left">DESCRIPCIÓN</div>
                <div className="w-24 text-right">P.UNIT</div>
                <div className="w-32 text-right">TOTAL</div>
              </div>
              <div className="w-full border-b border-black"></div>
            </div>
            {/* Table Body */}
            <div className="text-[13px] divide-y divide-slate-50">
              {sale.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center py-0.5 border-b border-slate-50/50">
                  <div className="w-16 text-center font-black">{item.quantity}</div>
                  <div className="flex-1 px-4 font-bold text-slate-800 uppercase leading-none">{item.name}</div>
                  <div className="w-24 text-right text-slate-600 italic whitespace-nowrap">
                    $ {formatCurrency(item.price).replace('$', '')}
                  </div>
                  <div className="w-32 text-right font-black text-slate-900 whitespace-nowrap">
                    $ {formatCurrency(item.price * item.quantity).replace('$', '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          <div className="w-full max-w-sm animate-fade-in">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl py-4 font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText size={18} />
              )}
              {isGeneratingPdf ? 'GENERANDO...' : 'DESCARGAR PDF'}
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
