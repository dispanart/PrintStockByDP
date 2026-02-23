import { Item, Transaction } from './types';

const ITEMS_KEY = 'printstock_items';
const TRANSACTIONS_KEY = 'printstock_transactions';
const SMART_UNITS_KEY = 'printstock_smart_units';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Items
export function getItems(): Item[] {
  const data = localStorage.getItem(ITEMS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveItems(items: Item[]): void {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function addItem(item: Omit<Item, 'id' | 'createdAt'>): Item {
  const items = getItems();
  const newItem: Item = { ...item, id: generateId(), createdAt: new Date().toISOString() };
  items.push(newItem);
  saveItems(items);
  return newItem;
}

export function updateItem(id: string, updates: Partial<Item>): void {
  const items = getItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    saveItems(items);
  }
}

export function deleteItem(id: string): void {
  saveItems(getItems().filter(i => i.id !== id));
}

// Transactions
export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
  const txs = getTransactions();
  const newTx: Transaction = { ...tx, id: generateId(), timestamp: new Date().toISOString() };
  txs.unshift(newTx);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));

  // Update stock
  const items = getItems();
  const item = items.find(i => i.id === tx.itemId);
  if (item) {
    item.stock = tx.type === 'in' ? item.stock + tx.baseQuantity : Math.max(0, item.stock - tx.baseQuantity);
    saveItems(items);
  }

  return newTx;
}

// Smart Unit Default
export function getSmartUnit(itemId: string): string | null {
  const data = localStorage.getItem(SMART_UNITS_KEY);
  const map: Record<string, string> = data ? JSON.parse(data) : {};
  return map[itemId] || null;
}

export function setSmartUnit(itemId: string, unit: string): void {
  const data = localStorage.getItem(SMART_UNITS_KEY);
  const map: Record<string, string> = data ? JSON.parse(data) : {};
  map[itemId] = unit;
  localStorage.setItem(SMART_UNITS_KEY, JSON.stringify(map));
}
