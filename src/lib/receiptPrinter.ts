import { Order, StoreSettings, Product } from '../types';
import { formatRupiah } from './imageHelper';

export function printThermalReceipt(order: Order, settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=420,height=650');
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk mencetak struk thermal!');
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <div class="item-block">
        <div class="item-name">${item.productName}</div>
        <div class="row item-calc">
          <span class="col-left">${item.quantity} x ${formatRupiah(item.sellPrice)}</span>
          <span class="col-right">${formatRupiah(item.subtotal)}</span>
        </div>
      </div>
    `
    )
    .join('');

  const paymentText =
    order.paymentMethod === 'cash'
      ? 'TUNAI (CASH)'
      : order.paymentMethod === 'debt_partial'
      ? 'HUTANG SEBAGIAN (DP)'
      : order.paymentMethod === 'debt_full'
      ? 'HUTANG TOTAL'
      : order.paymentMethod === 'dana'
      ? 'DANA / E-WALLET'
      : 'BAYAR DI TEMPAT (COD)';

  const formattedDate = new Date(order.createdAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Struk #${order.orderNumber}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          @page {
            size: 58mm auto;
            margin: 0mm;
          }
          @media print {
            html, body {
              width: 48mm !important;
              max-width: 48mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
          }
          body {
            font-family: Arial, "Helvetica Neue", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            width: 48mm;
            max-width: 48mm;
            margin: 0 auto;
            padding: 2mm 1mm;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.25;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .divider {
            border-top: 1.5px dashed #000;
            margin: 4px 0;
            width: 100%;
          }
          .bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .title {
            font-size: 15px;
            font-weight: 900;
            line-height: 1.2;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: -0.2px;
          }
          .subtitle {
            font-size: 11px;
            font-weight: 600;
            line-height: 1.2;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            margin-bottom: 2px;
          }
          .col-left {
            flex: 1 1 auto;
            min-width: 0;
            word-break: break-word;
          }
          .col-right {
            flex: 0 0 auto;
            text-align: right;
            white-space: nowrap;
            padding-left: 4px;
            font-weight: 700;
          }
          .item-block {
            margin-bottom: 4px;
          }
          .item-name {
            font-size: 12px;
            font-weight: 700;
            line-height: 1.25;
            word-break: break-word;
          }
          .item-calc {
            font-size: 11.5px;
            font-weight: 600;
          }
          .meta-row {
            font-size: 11px;
            font-weight: 600;
          }
          .total-box {
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            padding: 3px 0;
            margin: 3px 0;
            font-size: 14px;
            font-weight: 900;
          }
          .debt-box {
            border: 1px dashed #000;
            padding: 3px;
            margin: 3px 0;
            font-size: 12.5px;
            font-weight: 800;
          }
          .footer-text {
            font-size: 10.5px;
            font-weight: 600;
            margin-top: 4px;
            line-height: 1.25;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">${settings.storeName.toUpperCase()}</div>
          ${settings.storeAddress ? `<div class="subtitle">${settings.storeAddress}</div>` : ''}
          ${settings.storePhone ? `<div class="subtitle">Telp/WA: ${settings.storePhone}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="row meta-row">
          <span class="col-left">No: #${order.orderNumber}</span>
          <span class="col-right">${order.type === 'pos' ? 'KASIR' : 'ONLINE'}</span>
        </div>
        <div class="row meta-row">
          <span class="col-left">Tgl: ${formattedDate}</span>
          <span class="col-right">${order.customerName.slice(0, 10)}</span>
        </div>

        <div class="divider"></div>

        <div style="margin: 3px 0;">
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <div class="row" style="font-size: 11.5px;">
          <span class="col-left">Subtotal:</span>
          <span class="col-right">${formatRupiah(order.subtotal)}</span>
        </div>
        ${
          order.totalDiscount > 0
            ? `<div class="row" style="font-size: 11.5px;"><span class="col-left">Diskon:</span><span class="col-right">-${formatRupiah(order.totalDiscount)}</span></div>`
            : ''
        }

        <div class="row total-box">
          <span class="col-left">TOTAL:</span>
          <span class="col-right">${formatRupiah(order.totalAmount)}</span>
        </div>

        <div class="row" style="font-size: 11.5px;">
          <span class="col-left">Metode:</span>
          <span class="col-right">${paymentText}</span>
        </div>
        <div class="row" style="font-size: 11.5px;">
          <span class="col-left">Bayar:</span>
          <span class="col-right">${formatRupiah(order.amountPaid)}</span>
        </div>
        ${
          order.paymentMethod === 'cash' && order.amountPaid >= order.totalAmount
            ? `<div class="row" style="font-size: 11.5px;"><span class="col-left">Kembalian:</span><span class="col-right">${formatRupiah(order.amountPaid - order.totalAmount)}</span></div>`
            : ''
        }
        ${
          order.remainingDebt > 0
            ? `<div class="row debt-box"><span class="col-left">SISA HUTANG:</span><span class="col-right">${formatRupiah(order.remainingDebt)}</span></div>`
            : ''
        }

        <div class="divider"></div>

        <div class="text-center footer-text">
          <div>${settings.receiptFooter}</div>
          <div style="margin-top: 3px; font-weight: 800; letter-spacing: 1px;">-- TERIMA KASIH --</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print Restock Purchase List (Bon Belanja) for store procurement
 */
export function printRestockReceipt(products: Product[], settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=420,height=650');
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk mencetak bon belanja!');
    return;
  }

  // Group by category
  const categories = Array.from(new Set(products.map((p) => p.category)));
  let totalEstimatedCost = 0;

  const contentHtml = categories
    .map((cat) => {
      const catProducts = products.filter((p) => p.category === cat);
      const rows = catProducts
        .map((p) => {
          const needed = Math.max(1, p.minStock * 2 - p.stock);
          const estCost = needed * p.buyPrice;
          totalEstimatedCost += estCost;
          return `
          <div style="margin-bottom: 4px;">
            <div style="font-weight: bold; display:flex; justify-content:space-between;">
              <span>[ ] ${p.name}</span>
            </div>
            <div style="font-size: 10px; display: flex; justify-content: space-between; padding-left: 14px;">
              <span>Sisa: <b>${p.stock}</b> | Beli: <b>${needed} ${p.unit}</b></span>
              <span>Est: ${formatRupiah(estCost)}</span>
            </div>
          </div>
        `;
        })
        .join('');

      return `
        <div style="margin-top: 8px;">
          <div style="font-weight: bold; text-decoration: underline; font-size: 11px; margin-bottom: 3px;">
            KATEGORI: ${cat.toUpperCase()}
          </div>
          ${rows}
        </div>
      `;
    })
    .join('');

  const formattedDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bon Belanja Restock</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          @page {
            size: 58mm auto;
            margin: 0mm;
          }
          @media print {
            html, body {
              width: 48mm !important;
              max-width: 48mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
          }
          body {
            font-family: Arial, "Helvetica Neue", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            width: 48mm;
            max-width: 48mm;
            margin: 0 auto;
            padding: 2mm 1mm;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.25;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .divider {
            border-top: 1.5px dashed #000;
            margin: 4px 0;
            width: 100%;
          }
          .bold { font-weight: 700; }
          .title {
            font-size: 15px;
            font-weight: 900;
            line-height: 1.2;
            margin-bottom: 2px;
            letter-spacing: -0.2px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            margin-bottom: 2px;
          }
          .col-left {
            flex: 1 1 auto;
            min-width: 0;
            word-break: break-word;
          }
          .col-right {
            flex: 0 0 auto;
            text-align: right;
            white-space: nowrap;
            padding-left: 4px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">BON BELANJA / RESTOCK</div>
          <div style="font-size: 12px; font-weight: 800;">${settings.storeName.toUpperCase()}</div>
          <div style="font-size: 10.5px; font-weight: 600;">Dicetak: ${formattedDate}</div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 11px; font-weight: 700; margin-bottom: 4px;">
          Total Item: ${products.length} Macam
        </div>

        ${contentHtml}

        <div class="divider"></div>

        <div class="row bold" style="font-size: 13px; margin: 3px 0; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 3px 0;">
          <span class="col-left">ESTIMASI MODAL:</span>
          <span class="col-right">${formatRupiah(totalEstimatedCost)}</span>
        </div>

        <div class="divider"></div>
        <div class="text-center" style="font-size: 10.5px; font-weight: 600; margin-top: 3px;">
          Catatan Belanja Pasar / Distributor
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Format Order details into a clean, professional WhatsApp text message
 */
export function formatOrderWhatsAppText(order: Order, settings: StoreSettings): string {
  const formattedDate = new Date(order.createdAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentText =
    order.paymentMethod === 'cash'
      ? 'TUNAI (CASH)'
      : order.paymentMethod === 'debt_partial'
      ? 'HUTANG SEBAGIAN (DP)'
      : order.paymentMethod === 'debt_full'
      ? 'HUTANG TOTAL'
      : order.paymentMethod === 'dana'
      ? 'TRANSFER DANA / QRIS'
      : 'BAYAR DI TEMPAT (COD)';

  const itemsList = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.productName}*\n   ${item.quantity} x ${formatRupiah(item.sellPrice)} = *${formatRupiah(item.subtotal)}*`
    )
    .join('\n');

  let text = `🧾 *STRUK BUKTI TRANSAKSI*\n`;
  text += `*${settings.storeName.toUpperCase()}*\n`;
  if (settings.storeAddress) text += `📍 ${settings.storeAddress}\n`;
  if (settings.storePhone) text += `📞 Telp/WA: ${settings.storePhone}\n`;
  text += `----------------------------------------\n`;
  text += `No. Pesanan : *#${order.orderNumber}*\n`;
  text += `Tipe        : ${order.type === 'pos' ? 'KASIR POS' : 'ONLINE'}\n`;
  text += `Waktu       : ${formattedDate}\n`;
  text += `Pelanggan   : *${order.customerName}*\n`;
  if (order.customerPhone) text += `No. Kontak  : ${order.customerPhone}\n`;
  if (order.customerAddress) text += `Alamat      : ${order.customerAddress}\n`;
  text += `----------------------------------------\n`;
  text += `*RINCIAN BARANG:*\n${itemsList}\n`;
  text += `----------------------------------------\n`;
  text += `Subtotal    : ${formatRupiah(order.subtotal)}\n`;
  if (order.totalDiscount > 0) {
    text += `Diskon      : -${formatRupiah(order.totalDiscount)}\n`;
  }
  text += `*TOTAL BAYAR: ${formatRupiah(order.totalAmount)}*\n`;
  text += `Metode      : ${paymentText}\n`;
  text += `Jumlah Bayar: ${formatRupiah(order.amountPaid)}\n`;

  if (order.paymentMethod === 'cash' && order.amountPaid >= order.totalAmount) {
    text += `Kembalian   : ${formatRupiah(order.amountPaid - order.totalAmount)}\n`;
  }
  if (order.remainingDebt > 0) {
    text += `*SISA HUTANG: ${formatRupiah(order.remainingDebt)}*\n`;
  }
  if (order.notes) {
    text += `Catatan     : ${order.notes}\n`;
  }
  text += `----------------------------------------\n`;
  text += `_${settings.receiptFooter || 'Terima kasih telah berbelanja di toko kami!'}_`;

  return text;
}

/**
 * Copy formatted order WhatsApp text to clipboard
 */
export async function copyOrderToWhatsApp(order: Order, settings: StoreSettings): Promise<boolean> {
  const text = formatOrderWhatsAppText(order, settings);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy receipt to WhatsApp format:', err);
    return false;
  }
}

