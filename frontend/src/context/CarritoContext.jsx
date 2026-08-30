import React, { createContext, useContext, useState, useCallback } from 'react';

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);

  const agregarProducto = useCallback((producto, cantidad = 1) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.productoId === producto.ProductoId);
      if (existente) {
        return prev.map((i) => (
          i.productoId === producto.ProductoId ? { ...i, cantidad: i.cantidad + cantidad } : i
        ));
      }
      return [...prev, {
        productoId: producto.ProductoId,
        nombre: producto.Nombre,
        talla: producto.Talla || null,
        precioVenta: Number(producto.PrecioVenta),
        cantidad,
      }];
    });
  }, []);

  const quitarProducto = useCallback((productoId) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const actualizarCantidad = useCallback((productoId, cantidad) => {
    if (cantidad < 1) return;
    setItems((prev) => prev.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)));
  }, []);

  const vaciarCarrito = useCallback(() => setItems([]), []);

  const total = items.reduce((acc, i) => acc + i.precioVenta * i.cantidad, 0);
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CarritoContext.Provider value={{
      items, agregarProducto, quitarProducto, actualizarCantidad, vaciarCarrito, total, cantidadTotal,
    }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  return useContext(CarritoContext);
}
