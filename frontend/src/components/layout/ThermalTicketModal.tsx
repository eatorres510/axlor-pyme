import React, { useRef } from "react";
import { Printer, CheckCircle2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface TicketItem {
  productName: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface ThermalTicketData {
  ticketNumber: string;
  companyName: string;
  companyTaxId?: string;
  branchName?: string;
  date: string;
  items: TicketItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  cashierName?: string;
  clientName?: string;
  clientTaxId?: string;
  docTypeLabel?: string;
}

interface ThermalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: ThermalTicketData | null;
}

export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({
  isOpen,
  onClose,
  ticketData,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!ticketData) return null;

  const handlePrint = () => {
    if (!ticketData) return;

    // Crear iframe invisible para impresión aislada del ticket (estándar térmico 80mm/58mm)
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const itemsHtml = ticketData.items
      .map(
        (item) => `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; font-size: 11px;">
          <div style="flex: 1; padding-right: 8px;">
            <span style="font-weight: bold;">${item.qty}x</span> ${item.productName}
            <span style="display: block; font-size: 9px; color: #444;">$${item.unitPrice.toFixed(2)} c/u</span>
          </div>
          <span style="font-weight: bold; white-space: nowrap;">$${item.total.toFixed(2)}</span>
        </div>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ticket #${ticketData.ticketNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace, monospace;
              font-size: 11px;
              color: #000;
              background: #fff;
              width: 72mm;
              max-width: 72mm;
              margin: 0 auto;
              padding: 6px 2px;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .header h3 { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .header p { font-size: 10px; color: #222; }
            .folio { font-size: 11px; font-weight: bold; margin-top: 3px; }
            .totals { font-size: 11px; }
            .totals .total-row { font-size: 13px; font-weight: bold; margin-top: 4px; padding-top: 4px; border-top: 1px solid #000; }
            .footer { text-align: center; font-size: 9px; margin-top: 8px; }
            .footer .thank-you { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h3>${ticketData.companyName}</h3>
            ${ticketData.companyTaxId ? `<p>RFC: ${ticketData.companyTaxId}</p>` : ""}
            <p>${ticketData.branchName || "Caja Principal 01"}</p>
            <p class="folio">${ticketData.docTypeLabel || "TICKET"} #${ticketData.ticketNumber}</p>
            <p style="font-size: 9px;">${ticketData.date}</p>
            ${ticketData.clientName ? `<div class="divider"></div><p style="font-size: 10px; font-weight: bold;">CLIENTE: ${ticketData.clientName}</p>${ticketData.clientTaxId ? `<p style="font-size: 9px;">RFC: ${ticketData.clientTaxId}</p>` : ""}` : ""}
          </div>

          <div class="divider"></div>

          <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
            <span>CANT X PROD</span>
            <span>TOTAL</span>
          </div>

          <div>${itemsHtml}</div>

          <div class="divider"></div>

          <div class="totals">
            <div class="row">
              <span>Subtotal:</span>
              <span>$${ticketData.subtotal.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>IVA (16%):</span>
              <span>$${ticketData.taxAmount.toFixed(2)}</span>
            </div>
            <div class="row total-row">
              <span>TOTAL:</span>
              <span>$${ticketData.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div style="font-size: 10px;">
            <div class="row">
              <span>Forma de Pago:</span>
              <span class="font-bold">${ticketData.paymentMethod}</span>
            </div>
            <div class="row">
              <span>Monto Recibido:</span>
              <span>$${ticketData.amountPaid.toFixed(2)}</span>
            </div>
            <div class="row font-bold">
              <span>Cambio:</span>
              <span>$${ticketData.change.toFixed(2)}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <p class="thank-you">¡Gracias por su compra!</p>
            <p>Este comprobante no tiene validez fiscal</p>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ticket de Venta (POS)" maxWidth="md">
      <div className="flex flex-col items-center">
        {/* Ticket Box */}
        <div
          id="thermal-ticket-print-area"
          ref={printRef}
          className="w-full max-w-[340px] bg-white text-slate-900 font-mono text-xs p-6 rounded-xl border border-dashed border-slate-300 shadow-inner my-2"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center p-2 rounded-full bg-emerald-100 text-emerald-700 mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">{ticketData.companyName}</h4>
            {ticketData.companyTaxId && <p className="text-[10px] text-slate-500">RFC: {ticketData.companyTaxId}</p>}
            <p className="text-[10px] text-slate-500">{ticketData.branchName || "Matriz Principal"}</p>
            <p className="text-[10px] mt-1 font-bold text-slate-700">{ticketData.docTypeLabel || "TICKET"} #{ticketData.ticketNumber}</p>
            <p className="text-[9px] text-slate-400">{ticketData.date}</p>
            {ticketData.clientName && (
              <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-left">
                <p className="text-[11px] font-bold text-slate-800">Cliente: {ticketData.clientName}</p>
                {ticketData.clientTaxId && <p className="text-[10px] text-slate-500 font-mono">RFC: {ticketData.clientTaxId}</p>}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase">
              <span>Cant x Prod</span>
              <span>Total</span>
            </div>
            {ticketData.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="flex-1 pr-2">
                  <span className="font-bold">{item.qty}x</span> {item.productName}
                  <span className="text-[9px] text-slate-400 block">${item.unitPrice.toFixed(2)} c/u</span>
                </div>
                <span className="font-bold">${item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-right">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Subtotal:</span>
              <span>${ticketData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>IVA (16%):</span>
              <span>${ticketData.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL:</span>
              <span>${ticketData.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="py-2.5 text-[10px] space-y-0.5 text-slate-600">
            <div className="flex justify-between">
              <span>Forma de Pago:</span>
              <span className="font-bold uppercase">{ticketData.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Monto Recibido:</span>
              <span>${ticketData.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Cambio:</span>
              <span>${ticketData.change.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
            <p className="font-bold text-slate-600">¡Gracias por su compra!</p>
            <p className="text-[8px] mt-1">Este comprobante no tiene validez fiscal</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" glow className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Imprimir Ticket
          </Button>
        </div>
      </div>
    </Modal>
  );
};
