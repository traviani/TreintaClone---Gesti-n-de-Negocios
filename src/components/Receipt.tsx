import React, { useState, useEffect, useRef } from 'react';
import { Printer, Receipt as ReceiptIcon, MessageCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export interface ReceiptProps {
  sale: any;
  onSecondaryAction?: () => void;
  hideActions?: boolean;
  initialFormat?: 'letter' | 'ticket';
  autoTrigger?: 'letter' | 'ticket' | 'whatsapp';
}

interface SingleInvoiceHalfProps {
  sale: any;
  dateStr: string;
  copyLabel: string;
}

export const formatSaleWhatsAppMessage = (sale: any, dateStr?: string) => {
  if (!sale) return '';

  const formattedDate = dateStr || ((typeof sale.createdAt?.toDate === 'function')
    ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(sale.createdAt.toDate())
    : (sale.createdAt ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(new Date(sale.createdAt)) : 'RECIENTE'));

  const invoiceNum = sale.invoiceNumber
    ? String(sale.invoiceNumber).padStart(6, '0')
    : (sale.id?.replace(/\D/g, '').slice(-4) || '6313');

  const itemsText = sale.items && sale.items.length > 0
    ? sale.items
        .map(
          (item: any) =>
            `• *${item.quantity}x* ${item.name} - $${formatCurrency(item.price * item.quantity).replace('$', '')} ($${formatCurrency(item.price).replace('$', '')} c/u)`
        )
        .join('\n')
    : '• Productos de venta';

  let discountDetails = '';
  if (sale.discount > 0 || sale.isSample) {
    discountDetails = `\n*Subtotal:* $${formatCurrency(sale.subtotal || sale.total + (sale.discount || 0)).replace('$', '')}\n*${sale.isSample ? 'Bonificación (Muestra)' : 'Descuento'}:* -$${formatCurrency(sale.discount).replace('$', '')}`;
  }

  const receiptLink = sale.id 
    ? `\n\n📄 *Ver o descargar nota de entrega:* \n${window.location.origin}/#/receipt/${sale.id}`
    : '';

  return `🏢 *INVERSIONES TRAVIANI C.A.*
RIF: J-501798788

📄 *NOTA DE ENTREGA Nº ${invoiceNum}*
🗓 *Fecha:* ${formattedDate}
👤 *Cliente:* ${sale.customerName || 'Cliente'}
🪪 *RIF/CI:* ${sale.customerIdNumber || 'J-501798788'}
📞 *Teléfono:* ${sale.customerPhone || sale.phone || 'No registrado'}
${sale.customerAddress || sale.address ? `📍 *Dirección:* ${sale.customerAddress || sale.address}\n` : ''}🏷 *Condición:* ${sale.saleType === 'credito' ? 'CRÉDITO' : 'CONTADO'}

📦 *DETALLE DE LA COMPRA:*
${itemsText}${discountDetails}

💰 *TOTAL A PAGAR: $${formatCurrency(sale.total).replace('$', '')}*

💳 *FORMAS DE PAGO:*
📱 *Pago Móvil:* MERCANTIL | 0414-2391131 | V-13493831
🏦 *Transferencia:* 0105-0750-21-1750063115 | Marco T.
💵 *Binance:* tramontemarco27@gmail.com${receiptLink}

✨ _¡Gracias por su compra y preferencia!_`;
};

export const sendSaleWhatsApp = (sale: any, dateStr?: string) => {
  if (!sale) return;

  // Normalizar número telefónico
  let rawPhone = (sale.customerPhone || sale.phone || '').toString().trim();
  let cleanPhone = rawPhone.replace(/\D/g, '');

  if (cleanPhone.startsWith('0')) {
    cleanPhone = '58' + cleanPhone.slice(1);
  } else if (
    cleanPhone.length === 10 &&
    (cleanPhone.startsWith('414') ||
      cleanPhone.startsWith('424') ||
      cleanPhone.startsWith('412') ||
      cleanPhone.startsWith('416') ||
      cleanPhone.startsWith('426'))
  ) {
    cleanPhone = '58' + cleanPhone;
  }

  const message = formatSaleWhatsAppMessage(sale, dateStr);
  const encodedMsg = encodeURIComponent(message);
  const waUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  window.open(waUrl, '_blank');
};

const SingleInvoiceHalf: React.FC<SingleInvoiceHalfProps> = ({ sale, dateStr, copyLabel }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="receipt-single-half w-full bg-white px-5 py-3 flex flex-col justify-between box-border text-slate-900 font-sans" 
      style={{ minHeight: '124mm', maxHeight: '130mm', color: '#0f172a' }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-[125px] h-[36px] flex items-center justify-start overflow-hidden">
            {!imgError ? (
              <img 
                src="https://lh3.googleusercontent.com/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5" 
                alt="Logo Traviani" 
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain object-left"
                style={{
                  maxWidth: "125px",
                  maxHeight: "36px",
                  display: "block"
                }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex items-center gap-1.5 font-black text-slate-900 tracking-tight">
                <span className="bg-teal-700 text-white text-xs px-2 py-0.5 rounded font-black">TRAVIANI</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight uppercase leading-tight text-[13.5px]">
              Inversiones Traviani C.A.
            </h1>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide leading-tight">
              RIF: J-501798788
            </p>
          </div>
        </div>

        <div className="text-right leading-tight">
          <p className="text-[15px] font-black text-slate-950 tracking-tight">
            № {sale.invoiceNumber ? String(sale.invoiceNumber).padStart(6, '0') : `ID-${sale.id?.slice(-4).toUpperCase() || '6313'}`}
          </p>
          <p className="text-[10px] font-bold text-slate-700 uppercase mt-0.5">FECHA: {dateStr}</p>
        </div>
      </div>

      {/* NOTA DE ENTREGA Title Banner */}
      <div className="text-center my-0.5 flex flex-col items-center">
        <div className="w-full border-t-2 border-slate-900"></div>
        <p className="text-[13px] font-black text-slate-950 tracking-[0.15em] py-0.5 leading-none uppercase select-none my-0.5">
          NOTA DE ENTREGA
        </p>
        <div className="w-full border-b-2 border-slate-900"></div>
      </div>

      {/* Customer Information Section */}
      <div className="pt-0.5 mb-1 text-[11px] leading-tight font-medium text-slate-900">
        <div className="flex justify-between items-start mb-1">
          <div className="flex gap-2">
            <span className="font-extrabold uppercase text-slate-950">CLIENTE:</span>
            <span className="font-bold text-slate-900 uppercase">{sale.customerName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <span className="font-extrabold uppercase text-slate-950">RIF/CI:</span>
              <span className="font-bold text-slate-900 whitespace-nowrap">{sale.customerIdNumber || 'J-501798788'}</span>
            </div>
            <span className={cn(
              "font-extrabold uppercase px-2 py-0.5 rounded text-[10px] border",
              sale.saleType === 'credito' 
                ? "text-red-700 bg-red-50 border-red-200" 
                : "text-emerald-800 bg-emerald-50 border-emerald-200"
            )}>
              {sale.saleType === 'credito' ? 'Crédito' : 'Contado'}
            </span>
          </div>
        </div>
        
        <div className="space-y-0.5">
          <div className="flex gap-2">
            <span className="font-extrabold uppercase text-slate-950">TELÉFONO:</span>
            <span className="font-bold text-slate-900">{sale.customerPhone || '584147096535'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-extrabold uppercase text-slate-950 shrink-0">DIRECCIÓN:</span>
            <span className="font-medium text-slate-800 uppercase leading-snug text-[10.5px]">
              {sale.customerAddress || 'AV GONZÁLEZ RINCONES QTA LA NENA LA TRINIDAD CARACAS'}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-1 w-full flex-1">
        <div className="w-full">
          {/* Header row */}
          <div className="w-full">
            <div className="w-full border-t-2 border-slate-900"></div>
            <div className="flex items-center py-1 text-[10px] font-black uppercase select-none text-slate-950 bg-slate-100">
              <div className="w-14 text-center">CANT</div>
              <div className="flex-1 px-2 text-left">DESCRIPCIÓN DEL PRODUCTO</div>
              <div className="w-24 text-right">P. UNITARIO</div>
              <div className="w-24 text-right pr-1">TOTAL</div>
            </div>
            <div className="w-full border-b-2 border-slate-900"></div>
          </div>
          {/* Table Body */}
          <div className="text-[11px]">
            {sale.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center py-1 border-b border-slate-200 font-medium">
                <div className="w-14 text-center font-black text-slate-950">{item.quantity}</div>
                <div className="flex-1 px-2 font-bold text-slate-900 uppercase leading-tight">{item.name}</div>
                <div className="w-24 text-right text-slate-800 font-semibold whitespace-nowrap">
                  $ {formatCurrency(item.price).replace('$', '')}
                </div>
                <div className="w-24 text-right font-black text-slate-950 pr-1 whitespace-nowrap">
                  $ {formatCurrency(item.price * item.quantity).replace('$', '')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total Net Section */}
      <div className="space-y-0.5 mb-1.5 border-t-2 border-slate-900 pt-1">
        {(sale.discount > 0 || sale.isSample) && (
          <>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 uppercase">
              <span>SUBTOTAL:</span>
              <span className="font-extrabold">$ {formatCurrency(sale.subtotal || sale.total + (sale.discount || 0)).replace('$', '')}</span>
            </div>
            <div className="flex justify-between items-center text-[10.5px] font-black text-emerald-800 uppercase leading-none">
              <span>{sale.isSample ? 'BONIFICACIÓN (MUESTRA):' : 'DESCUENTO:'}</span>
              <span>- $ {formatCurrency(sale.discount).replace('$', '')}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center leading-tight py-0.5">
          <h2 className="font-extrabold uppercase tracking-tight text-xs text-slate-950">TOTAL NETO A PAGAR</h2>
          <span className="text-[15px] font-black tabular-nums tracking-tight text-slate-950">
             $ {formatCurrency(sale.total).replace('$', '')}
          </span>
        </div>
      </div>

      {/* Payment Channels (Sin Zelle) */}
      <div className="grid grid-cols-3 gap-1 border-y border-slate-300 py-1 text-[8.5px] mb-1 bg-slate-50 rounded">
        <div className="px-1.5 border-r border-slate-300">
          <span className="font-extrabold text-slate-900 block mb-0.5">PAGO MÓVIL</span>
          <p className="font-bold text-slate-850 uppercase leading-snug">MERCANTIL | 0414-2391131 | V-13493831</p>
        </div>
        <div className="px-1.5 border-r border-slate-300">
          <span className="font-extrabold text-slate-900 block mb-0.5">TRANSFERENCIA</span>
          <p className="font-bold text-slate-850 uppercase leading-snug">0105-0750-21-1750063115 | Marco T.</p>
        </div>
        <div className="px-1.5 text-right">
          <span className="font-extrabold text-teal-800 block mb-0.5">BINANCE</span>
          <p className="font-bold text-slate-850 leading-snug">tramontemarco27@gmail.com</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center leading-none">
        <p className="text-[11px] font-black uppercase tracking-[0.1em] mb-0 text-slate-950">¡GRACIAS POR SU CONFIANZA!</p>
        <p className="text-[8.5px] font-bold text-slate-500 uppercase mt-0.5">{copyLabel}</p>
      </div>
    </div>
  );
};

interface ThermalTicketProps {
  sale: any;
  dateStr: string;
}

const ThermalTicket: React.FC<ThermalTicketProps> = ({ sale, dateStr }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="receipt-thermal-ticket w-[76mm] bg-white text-black p-3 font-sans box-border mx-auto leading-snug"
      style={{ 
        width: '76mm', 
        maxWidth: '76mm', 
        color: '#000000', 
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      }}
    >
      {/* Header */}
      <div className="text-center mb-2 pb-1.5 border-b-2 border-black">
        {!imgError ? (
          <div className="w-full flex justify-center mb-1.5">
            <img 
              src="https://lh3.googleusercontent.com/d/1FSxQ25foIjzbMPgY0spsjElr3oRQhMf5" 
              alt="Logo Traviani" 
              referrerPolicy="no-referrer"
              className="h-10 object-contain mx-auto filter grayscale contrast-200"
              style={{ maxHeight: '40px', maxWidth: '140px' }}
              onError={() => setImgError(true)}
            />
          </div>
        ) : null}

        <p className="font-black text-[14px] tracking-tight uppercase leading-tight mb-0.5">
          INVERSIONES TRAVIANI C.A.
        </p>
        <p className="text-[11px] font-extrabold uppercase tracking-wide">RIF: J-501798788</p>
        
        <div className="my-1.5 py-1 border-y-2 border-black font-black text-[12.5px] uppercase tracking-wider bg-black text-white">
          NOTA DE ENTREGA
        </div>

        <div className="flex justify-between items-center text-[12px] font-extrabold mt-1">
          <span>№ {sale.invoiceNumber ? String(sale.invoiceNumber).padStart(6, '0') : `ID-${sale.id?.slice(-4).toUpperCase() || '6313'}`}</span>
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-2 pb-1.5 border-b border-black border-dashed text-[11.5px] space-y-1 font-medium">
        <div className="flex justify-between items-start gap-1">
          <span className="font-extrabold uppercase shrink-0">CLIENTE:</span>
          <span className="font-black uppercase text-right leading-tight">{sale.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-extrabold">RIF/CI:</span>
          <span className="font-bold">{sale.customerIdNumber || 'J-501798788'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-extrabold">TELÉFONO:</span>
          <span className="font-bold">{sale.customerPhone || '584147096535'}</span>
        </div>
        {sale.customerAddress && (
          <div>
            <span className="font-extrabold block">DIRECCIÓN:</span>
            <span className="text-[10.5px] font-bold uppercase leading-tight block">{sale.customerAddress}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-0.5">
          <span className="font-extrabold">CONDICIÓN:</span>
          <span className="font-black uppercase text-[11.5px] border border-black px-1.5 py-0.2 rounded">
            {sale.saleType === 'credito' ? 'CRÉDITO' : 'CONTADO'}
          </span>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-2 pb-1.5 border-b-2 border-black">
        <div className="flex justify-between font-black text-[11.5px] pb-1 border-b border-black uppercase">
          <span className="w-10">CANT</span>
          <span className="flex-1 px-1">DESCRIPCIÓN</span>
          <span className="w-16 text-right">TOTAL</span>
        </div>
        <div className="space-y-2 pt-1.5 text-[12px]">
          {sale.items.map((item: any, i: number) => (
            <div key={i} className="border-b border-gray-200 pb-1">
              <div className="flex justify-between items-baseline">
                <span className="w-10 font-black text-[13px]">{item.quantity} x</span>
                <span className="flex-1 px-1 font-bold uppercase leading-tight">{item.name}</span>
                <span className="w-16 text-right font-black text-[13px] whitespace-nowrap">
                  ${formatCurrency(item.price * item.quantity).replace('$', '')}
                </span>
              </div>
              <div className="text-[10.5px] text-right font-bold text-gray-900 pr-0.5 mt-0.5">
                (P.U: ${formatCurrency(item.price).replace('$', '')})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mb-2 pb-1.5 border-b border-black border-dashed space-y-1 text-[11.5px]">
        {(sale.discount > 0 || sale.isSample) && (
          <>
            <div className="flex justify-between font-bold">
              <span>SUBTOTAL:</span>
              <span>${formatCurrency(sale.subtotal || sale.total + (sale.discount || 0)).replace('$', '')}</span>
            </div>
            <div className="flex justify-between font-extrabold">
              <span>{sale.isSample ? 'BONIFICACIÓN (MUESTRA):' : 'DESCUENTO:'}</span>
              <span>-${formatCurrency(sale.discount).replace('$', '')}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center text-[15px] font-black pt-1.5 border-t-2 border-black">
          <span>TOTAL A PAGAR:</span>
          <span className="text-[17px]">${formatCurrency(sale.total).replace('$', '')}</span>
        </div>
      </div>

      {/* Payment Accounts (Sin Zelle) */}
      <div className="mb-2 pb-1.5 border-b border-black border-dashed text-[10.5px] space-y-1 font-medium">
        <p className="font-black text-center text-[11px] uppercase border-b border-black pb-0.5">FORMAS DE PAGO</p>
        <div>
          <p className="font-black">PAGO MÓVIL:</p>
          <p className="font-bold">MERCANTIL | 0414-2391131 | V-13493831</p>
        </div>
        <div>
          <p className="font-black">TRANSFERENCIA:</p>
          <p className="font-bold">0105-0750-21-1750063115 | Marco T.</p>
        </div>
        <div>
          <p className="font-black">BINANCE:</p>
          <p className="font-bold">tramontemarco27@gmail.com</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] space-y-1 pt-1 pb-6">
        <p className="font-black uppercase tracking-wider text-[12px]">¡GRACIAS POR SU CONFIANZA!</p>
        <p className="text-[9.5px] font-bold uppercase">NO VÁLIDO COMO FACTURA FISCAL</p>
        <p className="text-[9px] font-bold text-gray-700 tracking-widest pt-2">===============================</p>
      </div>
    </div>
  );
};

export const Receipt: React.FC<ReceiptProps> = ({ 
  sale, 
  onSecondaryAction, 
  hideActions = false, 
  initialFormat = 'letter',
  autoTrigger 
}) => {
  const [isPrintingLetter, setIsPrintingLetter] = useState(false);
  const [isPrintingTicket, setIsPrintingTicket] = useState(false);
  const [activePreview, setActivePreview] = useState<'letter' | 'ticket'>(initialFormat);
  const hasAutoTriggeredRef = useRef(false);

  const dateStr = (typeof sale.createdAt?.toDate === 'function')
    ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(sale.createdAt.toDate())
    : (sale.createdAt ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(new Date(sale.createdAt)) : 'RECIENTE');

  const handlePrintLetter = async () => {
    try {
      setIsPrintingLetter(true);
      const receiptElement = document.getElementById('receipt-print');
      if (!receiptElement) {
        window.print();
        setIsPrintingLetter(false);
        return;
      }

      const existingIframe = document.getElementById('receipt-print-iframe');
      if (existingIframe) {
        existingIframe.remove();
      }

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
        setIsPrintingLetter(false);
        return;
      }

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Factura Hoja Carta (2 Copias) - ${sale.id || 'Inversiones Traviani'}</title>
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
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
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
          setIsPrintingLetter(false);
        }
      }, 350);
    } catch (err) {
      console.error('Error during print preparation:', err);
      window.print();
      setIsPrintingLetter(false);
    }
  };

  const handlePrintTicket = async () => {
    try {
      setIsPrintingTicket(true);
      const ticketElement = document.getElementById('receipt-thermal-container');
      if (!ticketElement) {
        window.print();
        setIsPrintingTicket(false);
        return;
      }

      const existingIframe = document.getElementById('receipt-ticket-print-iframe');
      if (existingIframe) {
        existingIframe.remove();
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'receipt-ticket-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.left = '-9999px';
      printIframe.style.top = '0';
      printIframe.style.width = '80mm';
      printIframe.style.height = 'auto';
      printIframe.style.border = 'none';
      printIframe.style.opacity = '0.01';
      printIframe.style.pointerEvents = 'none';
      printIframe.style.zIndex = '-999';
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!iframeDoc || !printIframe.contentWindow) {
        window.print();
        setIsPrintingTicket(false);
        return;
      }

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ticket Aclas PP7X - ${sale.id || 'Inversiones Traviani'}</title>
            ${styles}
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 80mm !important;
                background-color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                font-smooth: never !important;
                -webkit-font-smoothing: antialiased !important;
              }
              .receipt-thermal-ticket {
                width: 76mm !important;
                max-width: 76mm !important;
                margin: 0 auto !important;
                padding: 3mm 2mm !important;
                box-sizing: border-box !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                font-size: 12px !important;
                line-height: 1.25 !important;
              }
            </style>
          </head>
          <body>
            ${ticketElement.innerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

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
          console.warn('Ticket print failed, fallback to window.print():', e);
          window.print();
        } finally {
          setIsPrintingTicket(false);
        }
      }, 350);
    } catch (err) {
      console.error('Error during ticket print preparation:', err);
      window.print();
      setIsPrintingTicket(false);
    }
  };

  const handleSendWhatsApp = () => {
    sendSaleWhatsApp(sale, dateStr);
  };

  // Auto trigger if specified on first mount
  useEffect(() => {
    if (hasAutoTriggeredRef.current || !autoTrigger) return;
    hasAutoTriggeredRef.current = true;

    const timer = setTimeout(() => {
      if (autoTrigger === 'letter') {
        setActivePreview('letter');
        handlePrintLetter();
      } else if (autoTrigger === 'ticket') {
        setActivePreview('ticket');
        handlePrintTicket();
      } else if (autoTrigger === 'whatsapp') {
        handleSendWhatsApp();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [autoTrigger]);

  return (
    <div id="receipt-print-wrapper" className="flex flex-col items-center print:block print:p-0 print:m-0 print:bg-white w-full">
      {/* Format Selector Tab (Screen Only) */}
      {!hideActions && (
        <div className="mb-4 print:hidden flex items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActivePreview('letter')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer",
              activePreview === 'letter'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Printer size={15} />
            VISTA HOJA CARTA (2 COPIAS)
          </button>
          <button
            onClick={() => setActivePreview('ticket')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer",
              activePreview === 'ticket'
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <ReceiptIcon size={15} />
            VISTA TICKET (ACLAS PP7X 80MM)
          </button>
        </div>
      )}

      {/* PREVIEW CONTAINER */}
      <div className="w-full flex justify-center">
        {/* Letter Sheet View */}
        <div 
          id="receipt-print" 
          className={cn(
            "bg-white border border-slate-200 shadow-lg rounded-xl p-3 w-full max-w-[215.9mm] mx-auto print:p-0 print:w-full print:m-0 print:shadow-none print:border-none flex flex-col justify-between",
            activePreview === 'letter' ? "block" : "hidden print:block"
          )}
          style={{ minHeight: '270mm' }}
        >
          {/* TOP COPY (ORIGINAL) */}
          <SingleInvoiceHalf 
            sale={sale} 
            dateStr={dateStr} 
            copyLabel="ORIGINAL - NO FACTURA FISCAL" 
          />

          {/* CUT / DIVIDER LINE */}
          <div className="w-full flex items-center justify-center my-1 select-none print:my-0.5 opacity-90">
            <div className="flex-1 border-t-2 border-dashed border-slate-400"></div>
            <span className="px-3 text-[10px] font-mono font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
              ✂ CORTAR AQUÍ (ORIGINAL CLIENTE / COPIA ADMINISTRACIÓN) ✂
            </span>
            <div className="flex-1 border-t-2 border-dashed border-slate-400"></div>
          </div>

          {/* BOTTOM COPY (COPIA) */}
          <SingleInvoiceHalf 
            sale={sale} 
            dateStr={dateStr} 
            copyLabel="COPIA - NO FACTURA FISCAL" 
          />
        </div>

        {/* Thermal Ticket View (Aclas PP7X) */}
        <div 
          id="receipt-thermal-container"
          className={cn(
            "bg-white border border-slate-300 shadow-xl rounded-xl p-4 w-fit mx-auto print:border-none print:shadow-none",
            activePreview === 'ticket' ? "block" : "hidden"
          )}
        >
          <ThermalTicket sale={sale} dateStr={dateStr} />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {!hideActions && (
        <div className="mt-8 text-center print:hidden w-full max-w-[215.9mm] flex flex-col items-center gap-4">
          <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
            {/* Button 1: Imprimir Hoja Carta */}
            <button 
              onClick={handlePrintLetter}
              disabled={isPrintingLetter}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-xl py-3.5 px-3 font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-xs cursor-pointer disabled:cursor-not-allowed"
              title="Imprimir hoja carta con 2 facturas en tu impresora estándar"
            >
              {isPrintingLetter ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Printer size={16} />
              )}
              {isPrintingLetter ? 'PREPARANDO...' : 'IMPRIMIR CARTA'}
            </button>

            {/* Button 2: TICKET (Aclas PP7X) */}
            <button 
              onClick={handlePrintTicket}
              disabled={isPrintingTicket}
              className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-teal-600 text-white rounded-xl py-3.5 px-3 font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-xs cursor-pointer disabled:cursor-not-allowed"
              title="Imprimir ticket térmico en impresora Aclas PP7X de 80mm"
            >
              {isPrintingTicket ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ReceiptIcon size={16} />
              )}
              {isPrintingTicket ? 'IMPRIMIENDO...' : 'TICKET (ACLAS)'}
            </button>

            {/* Button 3: Enviar por WhatsApp */}
            <button 
              onClick={handleSendWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl py-3.5 px-3 font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-xs cursor-pointer"
              title="Enviar nota de entrega completa al número de WhatsApp del cliente"
            >
              <MessageCircle size={16} />
              ENVIAR WHATSAPP
            </button>
          </div>

          {onSecondaryAction && (
            <button 
              onClick={onSecondaryAction}
              className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all cursor-pointer mt-1"
            >
              ← Volver al punto de venta
            </button>
          )}
        </div>
      )}

      {/* Global Print Media Rules */}
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
            margin: 0 !important;
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
  );
};
