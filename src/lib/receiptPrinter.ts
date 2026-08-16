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
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 4px;">
        <span>${item.productName}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
        <span>${item.quantity} x ${formatRupiah(item.sellPrice)}</span>
        <span>${formatRupiah(item.subtotal)}</span>
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
        <title>Struk #${order.orderNumber}</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 58mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 8px 6px;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .bold { font-weight: bold; }
          .title { font-size: 15px; font-weight: bold; }
          .row { display: flex; justify-content: space-between; }
          @media print {
            body { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">${settings.storeName.toUpperCase()}</div>
          <div style="font-size: 10px;">${settings.storeAddress}</div>
          <div style="font-size: 10px;">Telp/WA: ${settings.storePhone}</div>
        </div>

        <div class="divider"></div>

        <div class="row" style="font-size: 10px;">
          <span>No: ${order.orderNumber}</span>
          <span>${order.type === 'pos' ? 'KASIR' : 'ONLINE'}</span>
        </div>
        <div class="row" style="font-size: 10px;">
          <span>Tgl: ${formattedDate}</span>
          <span>Plg: ${order.customerName.slice(0, 12)}</span>
        </div>

        <div class="divider"></div>

        <div style="font-size: 11px;">
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>Subtotal:</span>
          <span>${formatRupiah(order.subtotal)}</span>
        </div>
        ${
          order.totalDiscount > 0
            ? `<div class="row"><span>Diskon:</span><span>-${formatRupiah(order.totalDiscount)}</span></div>`
            : ''
        }
        <div class="row bold" style="font-size: 13px; margin: 2px 0;">
          <span>TOTAL:</span>
          <span>${formatRupiah(order.totalAmount)}</span>
        </div>
        <div class="row">
          <span>Metode:</span>
          <span>${paymentText}</span>
        </div>
        <div class="row">
          <span>Bayar:</span>
          <span>${formatRupiah(order.amountPaid)}</span>
        </div>
        ${
          order.paymentMethod === 'cash' && order.amountPaid >= order.totalAmount
            ? `<div class="row"><span>Kembalian:</span><span>${formatRupiah(order.amountPaid - order.totalAmount)}</span></div>`
            : ''
        }
        ${
          order.remainingDebt > 0
            ? `<div class="row bold" style="color: #b91c1c;"><span>SISA HUTANG:</span><span>${formatRupiah(order.remainingDebt)}</span></div>`
            : ''
        }

        <div class="divider"></div>

        <div class="text-center" style="font-size: 10px; margin-top: 6px;">
          <div>${settings.receiptFooter}</div>
          <div style="margin-top: 4px; font-weight: bold;">-- TERIMA KASIH --</div>
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
        <title>Bon Belanja Restock</title>
        <style>
          @page { margin: 0; size: auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 58mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 8px 6px;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .bold { font-weight: bold; }
          .title { font-size: 14px; font-weight: bold; }
          .row { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">BON BELANJA / RESTOCK</div>
          <div style="font-size: 11px; font-weight: bold;">${settings.storeName.toUpperCase()}</div>
          <div style="font-size: 10px;">Dicetak: ${formattedDate}</div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 10px; margin-bottom: 4px;">
          Total Item Perlu Belanja: <b>${products.length} Macam</b>
        </div>

        ${contentHtml}

        <div class="divider"></div>

        <div class="row bold" style="font-size: 12px;">
          <span>ESTIMASI MODAL:</span>
          <span>${formatRupiah(totalEstimatedCost)}</span>
        </div>

        <div class="divider"></div>
        <div class="text-center" style="font-size: 10px;">
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

