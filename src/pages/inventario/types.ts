// src/pages/inventario/types.ts
export interface Insumo {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  lote: string | null;
  fecha_vencimiento: string | null;
}

export interface MovimientoEntrada {
  insumo_id: string;
  cantidad: number;
  lote?: string;
  fecha_vencimiento?: string; 
  notas?: string;
}

export interface MovimientoSalida {
  insumo_id: string;
  cantidad: number;
  motivo: 'Uso en consulta' | 'Vencido' | 'Pérdida' | 'Otro';
  notas?: string;
}
