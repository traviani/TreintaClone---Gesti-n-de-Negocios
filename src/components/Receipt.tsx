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
  const [imgError, setImgError] = useState(false);

  return (
    <div className="receipt-single-half w-full bg-white px-4 py-2 flex flex-col justify-between box-border" style={{ minHeight: '124mm', maxHeight: '130mm' }}>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-1 pb-0.5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-[125px] h-[34px] flex items-center justify-start overflow-hidden">
            {!imgError ? (
              <img 
                src="https://lh3.googleusercontent.com/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5" 
                alt="Logo Traviani" 
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain object-left"
                style={{
                  maxWidth: "125px",
                  maxHeight: "34px",
                  display: "block"
                }}
                onError={() => {
                  setImgError(true);
                }}
              />
            ) : (
              <div className="flex items-center gap-1.5 font-black text-slate-900 tracking-tighter">
                <span className="bg-teal-700 text-white text-xs px-2 py-0.5 rounded font-black tracking-tight">TRAVIANI</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="font-black text-slate-900 italic tracking-tight uppercase leading-none text-[13px]">
              Inversiones Traviani C.A.
            </h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-none">
              RIF: J-501798788
            </p>
          </div>
        </div>

        <div className="text-right leading-tight">
          <p className="text-base font-black text-slate-900 tracking-tight">
            № {sale.invoiceNumber ? String(sale.invoiceNumber).padStart(6, '0') : `ID-${sale.id?.slice(-4).toUpperCase() || '6313'}`}
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">FECHA: {dateStr}</p>
        </div>
      </div>

      {/* NOTA DE ENTREGA Title Banner */}
      <div className="text-center my-0.5 flex flex-col items-center">
        <div className="w-full border-t border-black"></div>
        <p className="text-[13px] font-black text-black italic tracking-[0.2em] py-0.5 leading-none uppercase select-none my-0.5">
          NOTA DE ENTREGA
        </p>
        <div className="w-full border-b border-black"></div>
      </div>

      {/* Customer Information Section */}
      <div className="pt-0.5 mb-1 text-[10px]">
        <div className="flex justify-between items-start mb-0.5">
          <div className="flex gap-2">
            <span className="font-black italic uppercase text-slate-900">CLIENTE:</span>
            <span className="font-bold text-slate-800 uppercase">{sale.customerName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <span className="font-black italic uppercase text-slate-900">RIF/CI:</span>
              <span className="font-bold text-slate-800 whitespace-nowrap">{sale.customerIdNumber || 'J-501798788'}</span>
            </div>
            <span className={cn(
              "font-black italic uppercase px-1.5 py-0.2 rounded text-[9px]",
              sale.saleType === 'credito' ? "text-red-600 bg-red-50" : "text-emerald-700 bg-emerald-50"
            )}>
              {sale.saleType === 'credito' ? 'Crédito' : 'Contado'}
            </span>
          </div>
        </div>
        
        <div className="space-y-0.5">
          <div className="flex gap-2">
            <span className="font-black italic uppercase text-slate-900">TEL:</span>
            <span className="font-bold text-slate-800">{sale.customerPhone || '584147096535'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-black italic uppercase text-slate-900 shrink-0">DIRECCIÓN:</span>
            <span className="font-bold text-slate-700 uppercase leading-tight text-[9.5px]">{sale.customerAddress || 'av gonzález rincones qta la nena la trinidad caracas'}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-1 w-full flex-1">
        <div className="w-full">
          {/* Header row */}
          <div className="w-full">
            <div className="w-full border-t border-black"></div>
            <div className="flex items-center py-0.5 text-[9px] font-black italic uppercase select-none">
              <div className="w-12 text-center">CANT</div>
              <div className="flex-1 px-2 text-left">DESCRIPCIÓN</div>
              <div className="w-20 text-right">P.UNIT</div>
              <div className="w-24 text-right">TOTAL</div>
            </div>
            <div className="w-full border-b border-black"></div>
          </div>
          {/* Table Body */}
          <div className="text-[10px]">
            {sale.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center py-0.5 border-b border-slate-100">
                <div className="w-12 text-center font-black">{item.quantity}</div>
                <div className="flex-1 px-2 font-bold text-slate-800 uppercase leading-tight">{item.name}</div>
                <div className="w-20 text-right text-slate-600 italic whitespace-nowrap">
                  $ {formatCurrency(item.price).replace('$', '')}
                </div>
                <div className="w-24 text-right font-black text-slate-900 whitespace-nowrap">
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
            <div className="flex justify-between items-center text-[9px] font-black text-emerald-700 uppercase italic leading-none">
              <span>{sale.isSample ? 'BONIFICACIÓN (MUESTRA):' : 'DESCUENTO:'}</span>
              <span>- $ {formatCurrency(sale.discount).replace('$', '')}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center leading-tight">
          <h2 className="font-black italic uppercase tracking-tight text-xs text-slate-900">TOTAL NETO A PAGAR</h2>
          <span className="text-sm font-black tabular-nums tracking-tight text-slate-900">
             $ {formatCurrency(sale.total).replace('$', '')}
          </span>
        </div>
      </div>

      {/* Payment Channels */}
      <div className="grid grid-cols-3 gap-1 border-y border-slate-200 py-1 text-[7.5px] mb-1">
        <div className="pr-1.5 border-r border-slate-200">
          <span className="font-black text-slate-500 block mb-0.5">PAGO MÓVIL</span>
          <p className="font-bold text-slate-800 uppercase leading-tight">MERCANTIL | 0414-2391131 | V-13493831</p>
        </div>
        <div className="px-1.5 border-r border-slate-200">
          <span className="font-black text-slate-500 block mb-0.5">TRANSFERENCIA</span>
          <p className="font-bold text-slate-800 uppercase leading-tight">0105-0750-21-1750063115 | Marco T.</p>
        </div>
        <div className="pl-1.5 text-right">
          <span className="font-black text-teal-700 block mb-0.5">ZELLE / BINANCE</span>
          <p className="font-bold text-slate-800 leading-tight">tramontemarco27@gmail.com</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center leading-none">
        <p className="text-[11px] font-black italic uppercase tracking-[0.15em] mb-0 text-slate-900">¡GRACIAS POR SU CONFIANZA!</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{copyLabel}</p>
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

      // Create an offscreen, fully visible print iframe for Letter format
      const printIframe = document.createElement('iframe');
      printIframe.id = 'receipt-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.left = '-9999px';
      printIframe.style.top = '0';
      printIframe.style.width = '215.9mm';
      printIframe.style.height = '279.4mm';
      printIframe.style.border = 'none';
      printIframe.style.opacity = '0.01';
      printIframe.style.pointerEvents = 'none';
      printIframe.style.zIndex = '-999';
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
                font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
              }
              #receipt-print {
                width: 215.9mm !important;
                height: 279.4mm !important;
                max-width: 215.9mm !important;
                max-height: 279.4mm !important;
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
          console.warn('Iframe print failed, fallback to window.print():', e);
          window.print();
        } finally {
          setIsPrinting(false);
        }
      }, 350);
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
            // Cross-origin CSS fails safely
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

      // Patch computed styles on both main window & iframe window
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
      cleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (e) {
          console.warn("Error running computedStyle cleanup:", e);
        }
      });
      
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
        className="bg-white border border-slate-200 shadow-lg rounded-xl p-3 w-full max-w-[215.9mm] mx-auto print:p-0 print:w-full print:m-0 print:shadow-none print:border-none flex flex-col justify-between"
        style={{ minHeight: '270mm' }}
      >
        {/* TOP COPY (ORIGINAL) */}
        <SingleInvoiceHalf 
          sale={sale} 
          dateStr={dateStr} 
          copyLabel="ORIGINAL - NO FACTURA FISCAL" 
        />

        {/* CUT / DIVIDER LINE */}
        <div className="w-full flex items-center justify-center my-1 select-none print:my-0.5 opacity-80">
          <div className="flex-1 border-t border-dashed border-slate-400"></div>
          <span className="px-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
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
              margin: 0 !important; 
              size: letter portrait !important; 
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide everything outside the receipt wrapper during print */
            aside, nav, header, .print\\:hidden, #mobile-menu {
              display: none !important;
            }

            #receipt-print-wrapper {
              display: block !important;
              width: 215.9mm !important;
              height: 279.4mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              z-index: 999999 !important;
            }

            #receipt-print {
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              width: 215.9mm !important;
              height: 279.4mm !important;
              max-width: 215.9mm !important;
              max-height: 279.4mm !important;
              margin: 0 auto !important;
              padding: 4mm 6mm !important;
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
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
              title="Imprimir hoja carta con 2 facturas"
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
