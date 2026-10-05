import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Papa from 'papaparse';
import { format, startOfMonth } from 'date-fns';
import { Download, FileSpreadsheet } from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_OWNER_ID } from '../constants';
import { formatCurrency, toSafeDate } from '../lib/utils';

type Row = Record<string, any>;

const toInputDate = (d: Date) => format(d, 'yyyy-MM-dd');

function downloadCsv(filename: string, rows: Row[]) {
  if (rows.length === 0) {
    alert('No hay datos en el rango seleccionado.');
    return;
  }
  // BOM para que Excel respete las tildes
  const csv = '﻿' + Papa.unparse(rows);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { effectiveUid } = useAuth();
  const [from, setFrom] = useState(toInputDate(startOfMonth(new Date())));
  const [to, setTo] = useState(toInputDate(new Date()));
  const [sales, setSales] = useState<Row[]>([]);
  const [expenses, setExpenses] = useState<Row[]>([]);
  const [purchases, setPurchases] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const owners = [effectiveUid];
    if (effectiveUid !== DEFAULT_OWNER_ID) owners.push(DEFAULT_OWNER_ID);

    const load = async (col: string) => {
      const snap = await getDocs(query(collection(db, col), where('ownerId', 'in', owners)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    (async () => {
      try {
        const [s, e, p] = await Promise.all([load('sales'), load('expenses'), load('purchases')]);
        setSales(s);
        setExpenses(e);
        setPurchases(p);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'reports');
      } finally {
        setLoading(false);
      }
    })();
  }, [effectiveUid]);

  const inRange = (r: Row) => {
    const d = toSafeDate(r.createdAt);
    if (!d) return false;
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);
    return d >= start && d <= end;
  };

  const data = useMemo(() => {
    const s = sales.filter(inRange);
    const e = expenses.filter(inRange);
    const p = purchases.filter(inRange);

    const totalSales = s.reduce((a, r) => a + (Number(r.total) || 0), 0);
    const cogs = s.reduce((a, r) => a + (r.items || []).reduce(
      (b: number, it: any) => b + (Number(it.cost) || 0) * (Number(it.quantity) || 0), 0), 0);
    const totalExpenses = e.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const totalPurchases = p.reduce((a, r) => a + (Number(r.total) || 0), 0);
    const receivable = sales
      .filter(r => r.saleType === 'credito')
      .reduce((a, r) => a + Math.max(0, Number(r.balance ?? r.total) || 0), 0);

    return { s, e, p, totalSales, cogs, totalExpenses, totalPurchases, receivable,
      profit: totalSales - cogs - totalExpenses };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, expenses, purchases, from, to]);

  const dateOf = (r: Row) => {
    const d = toSafeDate(r.createdAt);
    return d ? format(d, 'yyyy-MM-dd HH:mm') : '';
  };

  const exportSales = () => downloadCsv(`ventas_${from}_${to}.csv`, data.s.map(r => ({
    Fecha: dateOf(r),
    Factura: r.invoiceNumber ?? '',
    Cliente: r.customerName ?? '',
    Tipo: r.saleType ?? '',
    Pago: r.paymentMethod ?? '',
    Subtotal: r.subtotal ?? '',
    Descuento: r.discount ?? 0,
    Total: r.total ?? 0,
    Saldo: r.saleType === 'credito' ? (r.balance ?? r.total ?? 0) : 0,
    Productos: (r.items || []).map((i: any) => `${i.quantity} x ${i.name}`).join(' | '),
  })));

  const exportExpenses = () => downloadCsv(`gastos_${from}_${to}.csv`, data.e.map(r => ({
    Fecha: dateOf(r),
    Descripcion: r.description ?? '',
    Categoria: r.category ?? '',
    Monto: r.amount ?? 0,
    Pago: r.paymentStatus ?? '',
  })));

  const exportPurchases = () => downloadCsv(`compras_${from}_${to}.csv`, data.p.map(r => ({
    Fecha: dateOf(r),
    Proveedor: r.supplierName ?? '',
    Documento: r.documentNumber ?? '',
    Pago: r.paymentStatus ?? '',
    Total: r.total ?? 0,
    Productos: (r.items || []).map((i: any) => `${i.quantity} x ${i.productId}`).join(' | '),
  })));

  const exportReceivable = () => downloadCsv(`cuentas_por_cobrar.csv`, sales
    .filter(r => r.saleType === 'credito' && (Number(r.balance ?? r.total) || 0) > 0.01)
    .map(r => ({
      Fecha: dateOf(r),
      Factura: r.invoiceNumber ?? '',
      Cliente: r.customerName ?? '',
      Total: r.total ?? 0,
      Saldo: r.balance ?? r.total ?? 0,
      Telefono: r.customerPhone ?? '',
    })));

  const card = (label: string, value: number, tone = 'text-slate-900') => (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-2xl font-black mt-1 ${tone}`}>{formatCurrency(value)}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
        <p className="text-slate-500 mt-1">Resumen del período y descarga en Excel (CSV).</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <label className="text-xs font-bold text-slate-500">Desde
          <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
            className="block mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-bold text-slate-500">Hasta
          <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)}
            className="block mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </label>
      </div>

      {loading ? (
        <p className="text-slate-400">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {card('Ventas', data.totalSales)}
            {card('Costo de lo vendido', data.cogs)}
            {card('Gastos', data.totalExpenses)}
            {card('Compras', data.totalPurchases)}
            {card('Utilidad (ventas − costo − gastos)', data.profit, data.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}
            {card('Por cobrar (total actual)', data.receivable, 'text-amber-600')}
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              ['Ventas', exportSales, data.s.length],
              ['Gastos', exportExpenses, data.e.length],
              ['Compras', exportPurchases, data.p.length],
              ['Cuentas por cobrar', exportReceivable, null],
            ].map(([label, fn, n]) => (
              <button key={label as string} onClick={fn as () => void}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold active:scale-95 transition">
                <FileSpreadsheet size={16} />
                {label as string}{n !== null ? ` (${n})` : ''}
                <Download size={14} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
