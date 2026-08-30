import React from 'react';

// Este componente se renderiza siempre en el DOM pero permanece oculto
// (ver .receipt-print-area en global.css). Al imprimir, es lo único que
// se muestra, aislado del resto de la interfaz.
export default function ReciboVenta({ venta }) {
  if (!venta || !venta.detalle) return null;

  return (
    <div className="receipt-print-area">
      <div style={{ maxWidth: 380, margin: '0 auto', fontFamily: 'Helvetica, Arial, sans-serif', color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <img src="/logo-glorita.png" alt="Exclusivos Glorita" style={{ width: 64, height: 64, borderRadius: '50%' }} />
          <h2 style={{ margin: '8px 0 2px', fontSize: 18 }}>Exclusivos Glorita</h2>
          <div style={{ fontSize: 11 }}>San Lucas Tolimán, Sololá</div>
          <div style={{ fontSize: 11 }}>Marroquinería artesanal en cuero</div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px dashed #000' }} />

        <div style={{ fontSize: 12, margin: '10px 0' }}>
          <div><strong>No. de venta:</strong> {venta.NumeroVenta}</div>
          <div><strong>Fecha:</strong> {new Date(venta.FechaVenta).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}</div>
          <div><strong>Cliente:</strong> {venta.ClienteNombre}</div>
          <div><strong>Atendido por:</strong> {venta.VendedorNombre}</div>
        </div>

        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>Producto</th>
              <th style={{ textAlign: 'center', padding: '4px 0' }}>Cant.</th>
              <th style={{ textAlign: 'right', padding: '4px 0' }}>Precio</th>
              <th style={{ textAlign: 'right', padding: '4px 0' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalle.map((d) => (
              <tr key={d.DetalleVentaId} style={{ borderBottom: '1px dotted #999' }}>
                <td style={{ padding: '4px 0' }}>{d.ProductoNombre}</td>
                <td style={{ textAlign: 'center' }}>{d.Cantidad}</td>
                <td style={{ textAlign: 'right' }}>Q {Number(d.PrecioUnitario).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>Q {Number(d.Subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={{ border: 'none', borderTop: '1px dashed #000', marginTop: 10 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 15, margin: '8px 0' }}>
          <span>Total</span>
          <span>Q {Number(venta.Total).toFixed(2)}</span>
        </div>

        {venta.Estado === 'ANULADA' && (
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, margin: '8px 0', border: '2px solid #000', padding: 4 }}>
            *** VENTA ANULADA ***
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11 }}>
          ¡Gracias por su compra!<br />
          Hecho a mano con cuero genuino
        </div>
      </div>
    </div>
  );
}
