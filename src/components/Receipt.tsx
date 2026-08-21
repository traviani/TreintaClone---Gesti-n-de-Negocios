import React, { useState } from 'react';
import { ShoppingCart, Truck, Hammer, FileText, Printer } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReceiptProps {
  sale: any;
  onSecondaryAction?: () => void;
  hideActions?: boolean;
}

interface SingleInvoiceHalfProps {
  sale: any;
  dateStr: string;
  copyLabel: string;
}

const SingleInvoiceHalf: React.FC<SingleInvoiceHalfProps> = ({ sale, dateStr, copyLabel }) => {
  return (
    <div className="receipt-single-half w-full bg-white px-3 py-1 flex flex-col justify-between" style={{ minHeight: '126mm' }}>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-3">
          <div className="w-[125px] h-[36px] pl-1 flex items-center justify-start overflow-visible">
            <img 
              src="https://lh3.googleusercontent.com/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5" 
              alt="Logo Traviani" 
              crossOrigin="anonymous"
              className="h-full object-contain object-left"
              style={{
                maxWidth: "125px",
                maxHeight: "36px",
                display: "block"
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/14HE9P_AammpTZ2dQWYRxK_J529N4fKf-";
              }}
            />
          </div>
          <h1 className="font-black text-slate-900 italic tracking-tight uppercase leading-none" style={{ fontSize: '0.85rem' }}>
            Inversiones Traviani C.A.
          </h1>
        </div>
        <div className="text-right leading-none">
          <p className="text-lg font-black text-slate-900 tracking-tight">
            № {sale.invoiceNumber ? String(sale.invoiceNumber).padStart(6, '0') : `ID-${sale.id?.slice(-4).toUpperCase() || '6313'}`}
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">FECHA: {dateStr}</p>
        </div>
      </div>

      {/* NOTA DE ENTREGA Header Section */}
      <div className="text-center mb-1.5 flex flex-col items-center">
        <div className="w-full border-t border-black"></div>
        <p className="text-base font-black text-black italic tracking-[0.25em] py-0.5 leading-none uppercase select-none my-0.5">
          NOTA DE ENTREGA
        </p>
        <div className="w-full border-b border-black"></div>
      </div>

      {/* Customer Information Section */}
      <div className="pt-0.5 mb-1 text-[10px] border-t border-slate-200">
        <div className="flex justify-between items-start mb-0.5">
          <div className="flex gap-2">
            <span className="font-black italic uppercase">CLIENTE:</span>
            <span className="font-bold text-slate-800 uppercase">{sale.customerName}</span>
          </div>
          <div className="flex items-center gap-5">
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
      <div className="mb-1 w-full flex-1">
        <div className="w-full">
          {/* Header row */}
          <div className="w-full">
            <div className="w-full border-t border-black"></div>
            <div className="flex items-center py-0.5 text-[9.5px] font-black italic uppercase select-none">
              <div className="w-14 text-center">CANT</div>
              <div className="flex-1 px-3 text-left">DESCRIPCIÓN</div>
              <div className="w-20 text-right">P.UNIT</div>
              <div className="w-28 text-right">TOTAL</div>
            </div>
            <div className="w-full border-b border-black"></div>
          </div>
          {/* Table Body */}
          <div className="text-[10.5px] divide-y divide-slate-50">
            {sale.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center py-0.5 border-b border-slate-50/50">
                <div className="w-14 text-center font-black">{item.quantity}</div>
                <div className="flex-1 px-3 font-bold text-slate-800 uppercase leading-none">{item.name}</div>
                <div className="w-20 text-right text-slate-600 italic whitespace-nowrap">
                  $ {formatCurrency(item.price).replace('$', '')}
                </div>
                <div className="w-28 text-right font-black text-slate-900 whitespace-nowrap">
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
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase italic">
              <span>SUBTOTAL:</span>
              <span>$ {formatCurrency(sale.subtotal || sale.total + (sale.discount || 0)).replace('$', '')}</span>
            </div>
            <div className="flex justify-between items-center text-[9px] font-black text-primary uppercase italic leading-none">
              <span>{sale.isSample ? 'BONIFICACIÓN (MUESTRA):' : 'DESCUENTO:'}</span>
              <span>- $ {formatCurrency(sale.discount).replace('$', '')}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center leading-tight">
          <h2 className="font-black italic uppercase tracking-tighter text-sm">TOTAL NETO A PAGAR</h2>
          <span className="text-base font-black tabular-nums tracking-tighter">
             $ {formatCurrency(sale.total).replace('$', '')}
          </span>
        </div>
      </div>

      {/* Payment Channels */}
      <div className="grid grid-cols-3 gap-0 border-y border-slate-100 py-0.5 text-[7.5px] mb-1">
        <div className="pr-2 border-r border-slate-100">
          <span className="font-black text-slate-400 block mb-0.5">PAGO MÓVIL</span>
          <p className="font-bold text-slate-800 uppercase">MERCANTIL | 0414-2391131 | V-13493831</p>
        </div>
        <div className="px-2 border-r border-slate-100">
          <span className="font-black text-slate-400 block mb-0.5">TRANSFERENCIA</span>
          <p className="font-bold text-slate-800 uppercase">0105-0750-21-1750063115 | Marco T.</p>
        </div>
        <div className="pl-2 text-right">
          <span className="font-black text-primary block mb-0.5">ZELLE / BINANCE</span>
          <p className="font-bold text-slate-800">tramontemarco27@gmail.com</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs font-black italic uppercase tracking-[0.2em] mb-0">¡GRACIAS POR SU CONFIANZA!</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase">{copyLabel}</p>
      </div>
    </div>
  );
};

export const Receipt: React.FC<ReceiptProps> = ({ sale, onSecondaryAction, hideActions = false }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const dateStr = (typeof sale.createdAt?.toDate === 'function')
    ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(sale.createdAt.toDate())
    : 'RECIENTE';

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const receiptElement = document.getElementById('receipt-print');
      if (!receiptElement) {
        window.print();
        setIsPrinting(false);
        return;
      }

      // Remove existing print iframe if any
      const existingIframe = document.getElementById('receipt-print-iframe');
      if (existingIframe) {
        existingIframe.remove();
      }

      // Create a hidden print iframe configured for Letter portrait
      const printIframe = document.createElement('iframe');
      printIframe.id = 'receipt-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = 'none';
      printIframe.style.visibility = 'hidden';
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!iframeDoc || !printIframe.contentWindow) {
        window.print();
        setIsPrinting(false);
        return;
      }

      // Gather current page styles
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Facturas Carta (2 Copias) - ${sale.id || 'Inversiones Traviani'}</title>
            ${styles}
            <style>
              @page {
                size: letter portrait;
                margin: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 215.9mm !important;
                height: 279.4mm !important;
                background-color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #receipt-print {
                width: 215.9mm !important;
                height: 279.4mm !important;
                max-width: 215.9mm !important;
                margin: 0 auto !important;
                padding: 4mm 6mm !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                box-shadow: none !important;
                border: none !important;
                background-color: #ffffff !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            ${receiptElement.outerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Ensure images inside print frame are loaded
      const images = Array.from(iframeDoc.images);
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print failed, falling back to window.print():', e);
          window.print();
        } finally {
          setIsPrinting(false);
        }
      }, 300);
    } catch (err) {
      console.error('Error during print preparation:', err);
      window.print();
      setIsPrinting(false);
    }
  };

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
        console.warn("Error converting color string:", colorStr, e);
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
          if (char === '(') parenCount++;
          if (char === ')') parenCount--;
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
      const origGetComputedStyle = win.getComputedStyle;
      win.getComputedStyle = function(el: Element, pseudo?: string | null) {
        const style = origGetComputedStyle.call(win, el, pseudo);
        return new Proxy(style, {
          get(target, prop: string | symbol) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                return cleanColorString(val);
              };
            }
            const val = (target as any)[prop];
            if (typeof val === 'string') {
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
        win.getComputedStyle = origGetComputedStyle;
      });
    };

    let iframe: HTMLIFrameElement | null = null;

    try {
      const element = document.getElementById('receipt-print');
      if (!element) {
        throw new Error('Elemento de factura no encontrado.');
      }

      // 1. Gather all stylesheets and inline styles from the host document
      let combinedCss = '';
      const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
      
      for (let i = 0; i < styleElements.length; i++) {
        const node = styleElements[i];
        if (node.tagName.toLowerCase() === 'style') {
          combinedCss += '\n' + node.textContent;
        } else if (node.tagName.toLowerCase() === 'link') {
          try {
            const sheet = (node as HTMLLinkElement).sheet;
            if (sheet && sheet.cssRules) {
              for (let j = 0; j < sheet.cssRules.length; j++) {
                combinedCss += '\n' + sheet.cssRules[j].cssText;
              }
            }
          } catch (e) {
            // Cross-origin CSS fails to read cssRules, which is skipped safely
          }
        }
      }

      const sanitizedCss = sanitizeColorCSS(combinedCss);

      // 2. Create the hidden sandboxed iframe for Letter portrait (215.9mm x 279.4mm)
      iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '215.9mm';
      iframe.style.height = '279.4mm';
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
                width: 215.9mm !important;
                height: 279.4mm !important;
                overflow: hidden !important;
              }
              #receipt-print-sandbox {
                background-color: #ffffff !important;
                width: 215.9mm !important;
                height: 279.4mm !important;
                margin: 0 !important;
                padding: 4mm 6mm !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
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
      
      // Standard Letter (Carta): 215.9mm x 279.4mm portrait containing 2 copies
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      // Fit the image perfectly within the Letter dimensions
      pdf.addPage(undefined, 'portrait');
      pdf.deletePage(1); // delete default page
      pdf.addImage(imgData, 'PNG', 0, 0, 215.9, 279.4, undefined, 'FAST');
      
      const idDisplay = sale.invoiceNumber 
        ? String(sale.invoiceNumber).padStart(6, '0') 
        : (sale.id?.replace(/\D/g, '').slice(-4) || '6313');
      
      pdf.save(`Nota_de_Entrega_Carta_Doble_No_${idDisplay}.pdf`);
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

  return (
    <div id="receipt-print-wrapper" className="flex flex-col items-center print:block print:p-0 print:m-0 print:bg-white">
      {/* Letter Sheet with 2 identical copies */}
      <div 
        id="receipt-print" 
        className="bg-white border border-slate-200 shadow-lg rounded-xl p-4 w-full max-w-[215.9mm] mx-auto print:p-0 print:w-full print:m-0 print:shadow-none print:border-none flex flex-col justify-between"
        style={{ minHeight: '270mm' }}
      >
        {/* TOP COPY (ORIGINAL) */}
        <SingleInvoiceHalf 
          sale={sale} 
          dateStr={dateStr} 
          copyLabel="ORIGINAL - NO FACTURA FISCAL" 
        />

        {/* CUT / DIVIDER LINE */}
        <div className="w-full flex items-center justify-center my-2 select-none print:my-1 opacity-70">
          <div className="flex-1 border-t border-dashed border-slate-400"></div>
          <span className="px-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            ✂ CORTAR AQUÍ (ORIGINAL CLIENTE / COPIA ADMINISTRACIÓN) ✂
          </span>
          <div className="flex-1 border-t border-dashed border-slate-400"></div>
        </div>

        {/* BOTTOM COPY (COPIA) */}
        <SingleInvoiceHalf 
          sale={sale} 
          dateStr={dateStr} 
          copyLabel="COPIA - NO FACTURA FISCAL" 
        />

        <style>
          {`
          @media print {
            @page { 
              margin: 0; 
              size: letter portrait; 
            }
            
            body {
              visibility: hidden !important;
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
            }

            #receipt-print-wrapper,
            #receipt-print-wrapper * {
              visibility: visible !important;
            }

            #receipt-print-wrapper {
              display: block !important;
              width: 215.9mm !important;
              height: 279.4mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: white !important;
              position: relative !important;
            }

            #receipt-print {
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              width: 215.9mm !important;
              height: 279.4mm !important;
              max-width: 215.9mm !important;
              margin: 0 !important;
              padding: 4mm 6mm !important;
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }

            .print\\:hidden { 
              display: none !important; 
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
        </style>
      </div>

      {!hideActions && (
        <div className="mt-8 text-center print:hidden w-full max-w-[215.9mm] flex flex-col items-center gap-4">
          <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            <button 
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-xl py-4 font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-sm cursor-pointer disabled:cursor-not-allowed"
              title="Imprimir hoja carta con 2 facturas en tu impresora Samsung ML-2165"
            >
              {isPrinting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Printer size={18} />
              )}
              {isPrinting ? 'PREPARANDO...' : 'IMPRIMIR HOJA CARTA'}
            </button>

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
