import React, { useState, useEffect, useRef } from 'react';
import { Printer, Receipt as ReceiptIcon, MessageCircle, ArrowLeft, X, ExternalLink, Copy, Check } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { printThermalTicketDirectly, openTicketInPrintWindow } from '../lib/thermalPrint';
import { TRAVIANI_LOGO_DATA_URL } from '../lib/logo';

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

export const formatSaleTicketPlainText = (sale: any, dateStr?: string) => {
  if (!sale) return '';
  const dateFormatted = dateStr || ((typeof sale.createdAt?.toDate === 'function')
    ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'short' }).format(sale.createdAt.toDate())
    : 'HOY');

  const invoiceNum = sale.invoiceNumber
    ? String(sale.invoiceNumber).padStart(6, '0')
    : (sale.id?.slice(-4).toUpperCase() || '6313');

  const line = '------------------------------------------';
  const doubleLine = '==========================================';

  let items = '';
  if (sale.items && sale.items.length > 0) {
    items = sale.items.map((it: any) => {
      const cant = String(it.quantity) + 'x';
      const name = (it.name || '').toUpperCase().slice(0, 24);
      const total = '$' + formatCurrency(it.price * it.quantity).replace('$', '');
      return `${cant.padEnd(5)} ${name.padEnd(24)} ${total.padStart(10)}\n      (P.U: $${formatCurrency(it.price).replace('$', '')})`;
    }).join('\n');
  } else {
    items = '  PRODUCTOS DIVERSOS';
  }

  let discountText = '';
  if (sale.discount > 0 || sale.isSample) {
    discountText = `\nSUBTOTAL:                         $${formatCurrency(sale.subtotal || sale.total + (sale.discount || 0)).replace('$', '')}\n${sale.isSample ? 'BONIFICACION (MUESTRA)' : 'DESCUENTO'}:                        -$${formatCurrency(sale.discount).replace('$', '')}`;
  }

  return `${doubleLine}
        INVERSIONES TRAVIANI C.A.
            RIF: J-501798788
${doubleLine}
             NOTA DE ENTREGA
NO. ${invoiceNum}                   FECHA: ${dateFormatted}
${line}
CLIENTE: ${(sale.customerName || 'CLIENTE GENERAL').toUpperCase()}
RIF/CI:  ${sale.customerIdNumber || 'J-501798788'}
TELEFONO: ${sale.customerPhone || 'NO REGISTRADO'}
CONDICION: ${sale.saleType === 'credito' ? 'CREDITO' : `CONTADO ${sale.paymentMethod ? `(${sale.paymentMethod})` : ''}`}
${sale.paymentReference ? `REF. PAGO: ${sale.paymentReference}\n` : ''}${line}
CANT  DESCRIPCION                     TOTAL
${line}
${items}${discountText}
${doubleLine}
TOTAL A PAGAR:                    $${formatCurrency(sale.total).replace('$', '')}
${doubleLine}
FORMAS DE PAGO:
PAGO MOVIL: MERCANTIL | 0414-2391131
            V-13493831
TRANSFERENCIA: 0105-0750-21-1750063115 | Marco T.
BINANCE:    tramontemarco27@gmail.com
${line}
       ¡GRACIAS POR SU CONFIANZA!
      NO VALIDO COMO FACTURA FISCAL
${doubleLine}`;
};

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
${sale.customerAddress || sale.address ? `📍 *Dirección:* ${sale.customerAddress || sale.address}\n` : ''}🏷 *Condición:* ${sale.saleType === 'credito' ? 'CRÉDITO' : `CONTADO${sale.paymentMethod ? ` (${sale.paymentMethod}${sale.paymentReference ? ` - Ref: ${sale.paymentReference}` : ''})` : ''}`}${sale.saleType === 'contado' ? '\n✅ *Estado:* PAGADO' : `\n⏳ *Saldo Pendiente:* $${formatCurrency(sale.balance !== undefined ? sale.balance : sale.total).replace('$', '')}`}

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
                src={TRAVIANI_LOGO_DATA_URL} 
                alt="Logo Traviani" 
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                "font-extrabold uppercase px-2 py-0.5 rounded text-[10px] border",
                sale.saleType === 'credito' 
                  ? "text-red-700 bg-red-50 border-red-200" 
                  : "text-emerald-800 bg-emerald-50 border-emerald-200"
              )}>
                {sale.saleType === 'credito' 
                  ? 'Crédito' 
                  : `Contado${sale.paymentMethod ? ` • ${sale.paymentMethod}` : ''}`}
              </span>
              {sale.saleType === 'contado' && sale.paymentReference && (
                <span className="text-[9.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Ref: {sale.paymentReference}
                </span>
              )}
            </div>
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
              src={TRAVIANI_LOGO_DATA_URL} 
              alt="Logo Traviani" 
              className="h-10 object-contain mx-auto filter grayscale contrast-200"
              style={{ maxHeight: '40px', maxWidth: '140px', display: 'block' }}
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
            {sale.saleType === 'credito' ? 'CRÉDITO' : `CONTADO${sale.paymentMethod ? ` (${sale.paymentMethod})` : ''}`}
          </span>
        </div>
        {sale.saleType === 'contado' && sale.paymentReference && (
          <div className="flex justify-between text-[10.5px] pt-0.5">
            <span className="font-extrabold">REF. PAGO:</span>
            <span className="font-bold uppercase">{sale.paymentReference}</span>
          </div>
        )}
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
  const [copiedText, setCopiedText] = useState(false);
  const hasAutoTriggeredRef = useRef(false);

  const dateStr = (typeof sale.createdAt?.toDate === 'function')
    ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(sale.createdAt.toDate())
    : (sale.createdAt ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(new Date(sale.createdAt)) : 'RECIENTE');

  const handlePrintLetter = () => {
    try {
      setIsPrintingLetter(true);
      setActivePreview('letter');

      document.body.classList.remove('print-ticket-active');
      document.body.classList.add('print-letter-active');

      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn('Error during letter print:', e);
        } finally {
          setIsPrintingLetter(false);
          setTimeout(() => {
            document.body.classList.remove('print-letter-active');
          }, 1200);
        }
      }, 150);
    } catch (err) {
      console.error('Error in handlePrintLetter:', err);
      setIsPrintingLetter(false);
      document.body.classList.remove('print-letter-active');
    }
  };

  const handlePrintTicket = () => {
    try {
      setIsPrintingTicket(true);
      setActivePreview('ticket');

      document.body.classList.remove('print-letter-active');
      document.body.classList.add('print-ticket-active');

      // 1. First trigger direct isolated thermal print
      const directSuccess = printThermalTicketDirectly(sale, dateStr);

      // 2. If direct print is not supported or as a guaranteed dual-path, ensure page is ready
      setTimeout(() => {
        setIsPrintingTicket(false);
      }, 1000);
    } catch (err) {
      console.error('Error in handlePrintTicket:', err);
      setIsPrintingTicket(false);
      document.body.classList.remove('print-ticket-active');
    }
  };

  const handleOpenTicketNewTab = () => {
    if (!sale) return;
    openTicketInPrintWindow(sale, dateStr);
  };

  const handleCopyTicketText = async () => {
    try {
      const text = formatSaleTicketPlainText(sale, dateStr);
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error('Error copying ticket text:', err);
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
    }, 200);

    return () => clearTimeout(timer);
  }, [autoTrigger]);

  return (
    <div id="receipt-print-wrapper" className="flex flex-col items-center print:block print:p-0 print:m-0 print:bg-white w-full">
      {/* Format Selector and Sticky Back Navigation Bar (Screen Only) */}
      {!hideActions && (
        <div className="w-full max-w-[215.9mm] mb-4 print:hidden flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur px-3 py-2 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30">
          {onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>← Volver a la Hoja de Trabajo</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActivePreview('letter')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                activePreview === 'letter'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Printer size={14} />
              CARTA (2 COPIAS)
            </button>
            <button
              onClick={() => setActivePreview('ticket')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                activePreview === 'ticket'
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <ReceiptIcon size={14} />
              TICKET ACLAS
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW CONTAINER */}
      <div className="w-full flex justify-center overflow-x-auto pb-4">
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
        <div className="mt-8 text-center print:hidden w-full max-w-[215.9mm] flex flex-col items-center gap-3">
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
              {isPrintingTicket ? 'IMPRIMIENDO...' : 'IMPRIMIR ACLAS'}
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

          {/* Secondary Quick Utilities for Aclas Thermal Printer */}
          <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenTicketNewTab}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
              title="Abre el ticket en una pestaña independiente limpia para imprimir directo a la Aclas"
            >
              <ExternalLink size={13} />
              <span>Abrir Ticket en Pestaña Nueva</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTicketText}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border",
                copiedText
                  ? "bg-teal-50 border-teal-400 text-teal-800"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
              )}
              title="Copiar el contenido en formato texto para imprimir o pegar"
            >
              {copiedText ? <Check size={13} className="text-teal-600" /> : <Copy size={13} />}
              <span>{copiedText ? '¡Ticket Copiado!' : 'Copiar Texto del Ticket'}</span>
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

      {/* Dynamic Print Media Rules */}
      <style>
        {`
        @media print {
          aside, nav, header, .print\\:hidden, #mobile-menu, [data-print-hidden="true"] {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          ${activePreview === 'ticket' ? `
          @page { 
            size: 80mm auto !important; 
            margin: 0 !important; 
          }

          #receipt-print-wrapper {
            display: block !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            z-index: 999999 !important;
          }

          #receipt-print {
            display: none !important;
          }

          #receipt-thermal-container {
            display: block !important;
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 auto !important;
            padding: 1.5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
          }

          .receipt-thermal-ticket {
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 auto !important;
            padding: 2mm 1mm !important;
            font-size: 11.5px !important;
            line-height: 1.25 !important;
            color: #000000 !important;
            background-color: #ffffff !important;
          }
          ` : `
          @page { 
            size: letter portrait !important; 
            margin: 0 !important; 
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

          #receipt-thermal-container {
            display: none !important;
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
          `}
        }
      `}
      </style>
    </div>
  );
};
