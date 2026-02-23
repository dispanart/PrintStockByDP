export interface UnitConversion {
  unit: string;
  rate: number; // how many base units per 1 of this unit
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
  baseUnit: string;
  units: UnitConversion[];
  stock: number; // in base units
  minStock: number; // threshold in base units
  icon?: string; // lucide icon name
  createdAt: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out';
  quantity: number;
  unit: string;
  baseQuantity: number;
  note?: string;
  reference?: string;
  timestamp: string;
  user: string;
}

export type StockStatus = 'safe' | 'low' | 'mid';

export const CATEGORIES = [
  'Kertas', 'Tinta', 'Bahan Finishing', 'Spare Part', 'Packaging', 'Lainnya'
] as const;

export const UNIT_PRESETS: Record<string, UnitConversion[]> = {
  'Lembar': [],
  'Pcs': [],
  'Rim': [{ unit: 'Lembar', rate: 500 }],
  'Box': [{ unit: 'Pcs', rate: 100 }],
};

export const BASE_UNITS = Object.keys(UNIT_PRESETS);

export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= minStock) return 'low';
  if (stock <= minStock * 1.5) return 'mid';
  return 'safe';
}

export function formatStock(stock: number, baseUnit: string, units: UnitConversion[]): string {
  if (units.length === 0) return `${stock} ${baseUnit}`;
  const largest = units.reduce((a, b) => a.rate > b.rate ? a : b);
  if (stock >= largest.rate) {
    const whole = Math.floor(stock / largest.rate);
    const remainder = stock % largest.rate;
    if (remainder === 0) return `${whole} ${largest.unit}`;
    return `${whole} ${largest.unit} ${remainder} ${baseUnit}`;
  }
  return `${stock} ${baseUnit}`;
}

export function convertToBase(quantity: number, unit: string, baseUnit: string, units: UnitConversion[]): number {
  if (unit === baseUnit) return quantity;
  const conv = units.find(u => u.unit === unit);
  return conv ? quantity * conv.rate : quantity;
}
