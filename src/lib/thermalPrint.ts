import { formatCurrency } from './utils';

export const generateThermalTicketHtml = (sale: any, dateStr?: string): string => {
  if (!sale) return '';

  const dateFormatted = dateStr || ((typeof sale.createdAt?.toDate === 'function')
    ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(sale.createdAt.toDate())
    : (sale.createdAt ? new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(new Date(sale.createdAt)) : 'RECIENTE'));

  const invoiceNum = sale.invoiceNumber
    ? String(sale.invoiceNumber).padStart(6, '0')
    : (sale.id?.slice(-4).toUpperCase() || '6313');

  const itemsRows = (sale.items || []).map((it: any) => `
    <tr>
      <td style="width: 32px; font-weight: 900; vertical-align: top; font-size: 13px;">${it.quantity}x</td>
      <td style="padding: 0 4px; vertical-align: top;">
        <div style="font-weight: 800; text-transform: uppercase; line-height: 1.15;">${it.name || ''}</div>
        <div style="font-size: 10px; color: #333; margin-top: 1px;">P.U: $${formatCurrency(it.price).replace('$', '')}</div>
      </td>
      <td style="width: 65px; text-align: right; font-weight: 900; font-size: 13px; vertical-align: top; white-space: nowrap;">
        $${formatCurrency(it.price * it.quantity).replace('$', '')}
      </td>
    </tr>
  `).join('');

  const hasDiscount = (sale.discount > 0 || sale.isSample);
  const discountHtml = hasDiscount ? `
    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 2px;">
      <span>SUBTOTAL:</span>
      <span>$${formatCurrency(sale.subtotal || sale.total + (sale.discount || 0)).replace('$', '')}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-weight: 800; margin-bottom: 2px;">
      <span>${sale.isSample ? 'BONIFICACIÓN (MUESTRA):' : 'DESCUENTO:'}</span>
      <span>-$${formatCurrency(sale.discount).replace('$', '')}</span>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Aclas - Nota Nº ${invoiceNum}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.25;
      width: 100%;
    }
    .ticket-body {
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      padding: 2mm 1mm 6mm 1mm;
      background: #ffffff;
      color: #000000;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    
    .divider-solid {
      border-top: 2px solid #000000;
      margin: 4px 0;
    }
    .divider-dashed {
      border-top: 1px dashed #000000;
      margin: 4px 0;
    }
    .divider-double {
      border-top: 3px double #000000;
      margin: 5px 0;
    }

    .header-box {
      border-bottom: 2px solid #000000;
      padding-bottom: 4px;
      margin-bottom: 6px;
      text-align: center;
    }
    .title-banner {
      margin: 4px 0;
      padding: 3px 0;
      background: #000000 !important;
      color: #ffffff !important;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: 1px;
      text-align: center;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2px;
      font-size: 11.5px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    .items-table th {
      border-bottom: 1.5px solid #000000;
      font-weight: 900;
      font-size: 11px;
      padding: 2px 0;
      text-transform: uppercase;
      color: #000000;
    }
    .items-table td {
      padding: 3px 0;
      border-bottom: 1px dotted #888888;
      color: #000000;
    }
    .total-box {
      border-top: 2px solid #000000;
      border-bottom: 2px solid #000000;
      padding: 5px 0;
      margin: 6px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 900;
      color: #000000;
    }
    .payment-box {
      border-bottom: 1px dashed #000000;
      padding-bottom: 5px;
      margin-bottom: 6px;
      font-size: 11px;
      color: #000000;
    }
    .footer {
      text-align: center;
      padding-top: 4px;
      font-size: 11px;
      font-weight: 800;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="ticket-body">
    <!-- Header -->
    <div class="header-box">
      <div style="font-weight: 900; font-size: 15px; text-transform: uppercase; letter-spacing: -0.2px;">
        INVERSIONES TRAVIANI C.A.
      </div>
      <div style="font-weight: 800; font-size: 11px; margin-top: 1px;">
        RIF: J-501798788
      </div>
      
      <div class="title-banner">
        NOTA DE ENTREGA
      </div>

      <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 12px; margin-top: 3px;">
        <span>Nº ${invoiceNum}</span>
        <span>${dateFormatted}</span>
      </div>
    </div>

    <!-- Customer Info -->
    <div style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; font-size: 11.5px;">
      <div class="info-row">
        <span class="bold">CLIENTE:</span>
        <span class="bolder uppercase text-right" style="max-width: 52mm;">${sale.customerName || 'CLIENTE GENERAL'}</span>
      </div>
      <div class="info-row">
        <span class="bold">RIF/CI:</span>
        <span class="bold">${sale.customerIdNumber || 'J-501798788'}</span>
      </div>
      <div class="info-row">
        <span class="bold">TELÉFONO:</span>
        <span class="bold">${sale.customerPhone || 'NO REGISTRADO'}</span>
      </div>
      ${sale.customerAddress ? `
      <div style="margin-top: 2px;">
        <span class="bold">DIRECCIÓN:</span>
        <span style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; display: block;">${sale.customerAddress}</span>
      </div>
      ` : ''}
      <div class="info-row" style="margin-top: 2px;">
        <span class="bold">CONDICIÓN:</span>
        <span class="bolder uppercase" style="border: 1px solid #000; padding: 1px 4px; border-radius: 2px;">
          ${sale.saleType === 'credito' ? 'CRÉDITO' : `CONTADO${sale.paymentMethod ? ` (${sale.paymentMethod})` : ''}`}
        </span>
      </div>
      ${sale.saleType === 'contado' && sale.paymentReference ? `
      <div class="info-row" style="font-size: 10.5px; margin-top: 2px;">
        <span class="bold">REF. PAGO:</span>
        <span class="bolder uppercase">${sale.paymentReference}</span>
      </div>
      ` : ''}
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: left;">CANT</th>
          <th style="text-align: left; padding: 0 4px;">DESCRIPCIÓN</th>
          <th style="width: 60px; text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="padding-top: 2px;">
      ${discountHtml}
      <div class="total-box">
        <span>TOTAL A PAGAR:</span>
        <span style="font-size: 18px;">$${formatCurrency(sale.total).replace('$', '')}</span>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="payment-box">
      <div style="font-weight: 900; text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 3px; font-size: 11px;">
        FORMAS DE PAGO
      </div>
      <div><strong>PAGO MÓVIL:</strong> MERCANTIL | 0414-2391131 | V-13493831</div>
      <div><strong>TRANSFERENCIA:</strong> 0105-0750-21-1750063115 | Marco T.</div>
      <div><strong>BINANCE:</strong> tramontemarco27@gmail.com</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div style="letter-spacing: 0.5px; margin-bottom: 2px;">¡GRACIAS POR SU CONFIANZA!</div>
      <div style="font-size: 10px; font-weight: normal;">NO VÁLIDO COMO FACTURA FISCAL</div>
      <div style="font-size: 9px; letter-spacing: 2px; margin-top: 4px; color: #555;">=================================</div>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error(e);
        }
      }, 250);
    });
  </script>
</body>
</html>`;
};

export const printThermalTicketDirectly = (sale: any, dateStr?: string): boolean => {
  try {
    const html = generateThermalTicketHtml(sale, dateStr);
    
    // Remove old frame if exists
    const iframeId = '__aclas_thermal_print_frame__';
    let frame = document.getElementById(iframeId) as HTMLIFrameElement;
    if (frame && frame.parentNode) {
      frame.parentNode.removeChild(frame);
    }

    frame = document.createElement('iframe');
    frame.id = iframeId;
    
    // Set explicit geometry so browser print engines calculate dimensions accurately
    frame.style.position = 'fixed';
    frame.style.left = '0';
    frame.style.bottom = '0';
    frame.style.width = '80mm';
    frame.style.height = '600px';
    frame.style.border = 'none';
    frame.style.opacity = '0.01';
    frame.style.pointerEvents = 'none';
    frame.style.zIndex = '-9999';
    
    let printAttempted = false;
    const executePrint = () => {
      if (printAttempted) return;
      printAttempted = true;
      try {
        const win = frame.contentWindow;
        if (win) {
          win.focus();
          win.print();
        } else {
          openTicketInPrintWindow(html);
        }
      } catch (err) {
        console.warn('Iframe print failed, falling back to popup window', err);
        openTicketInPrintWindow(html);
      } finally {
        setTimeout(() => {
          if (frame && frame.parentNode) {
            frame.parentNode.removeChild(frame);
          }
        }, 12000);
      }
    };

    frame.onload = () => {
      setTimeout(executePrint, 350);
    };

    // Use Blob URL to eliminate cross-origin or document.write sandbox restrictions
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    frame.src = url;
    document.body.appendChild(frame);

    // Fallback timeout in case onload doesn't trigger
    setTimeout(executePrint, 600);

    return true;
  } catch (err) {
    console.error('Error in printThermalTicketDirectly:', err);
    openTicketInPrintWindow(sale, dateStr);
    return false;
  }
};

export const openTicketInPrintWindow = (htmlOrSale: any, dateStr?: string) => {
  const html = typeof htmlOrSale === 'string' 
    ? htmlOrSale 
    : generateThermalTicketHtml(htmlOrSale, dateStr);

  const printWindow = window.open('', '_blank', 'width=380,height=600');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.warn('Popup print call:', e);
      }
    }, 300);
  }
};
