import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getItems, getTransactions } from "@/lib/inventory-store";
import { getStockStatus, formatStock, CATEGORIES } from "@/lib/types";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, setMonth, setYear } from "date-fns";
import { id } from "date-fns/locale";
import { FileSpreadsheet, Printer } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useToast } from "@/hooks/use-toast";

// --- Styles & Constants ---
const STATUS_STYLES: Record<string, string> = {
  safe: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  mid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = { safe: "Aman", mid: "Menipis", low: "Kritis" };

// --- Helper Functions ---

// CSV Export
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// PDF Export - FIXED with Full CSS Styling
function exportPDF(title: string, monthFilter: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocker mencegah pencetakan. Izinkan pop-up untuk situs ini.");
    return;
  }

  const content = document.querySelector("[data-print-area]");
  if (!content) return;

  // CSS Lengkap untuk memastikan tabel dan isi terlihat saat dicetak
  const styles = `
    <style>
      body { font-family: sans-serif; color: #000; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
      th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
      th { background-color: #f3f4f6; font-weight: bold; }
      h1 { font-size: 24px; margin-bottom: 5px; }
      h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #000; }
      h3 { font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: bold; background: #eee; padding: 4px; }
      p { margin: 5px 0; }
      .no-print { display: none !important; }
      .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #000; display: inline-block; }
      .bg-red { background-color: #fee2e2; color: #991b1b; }
      .bg-amber { background-color: #fef3c7; color: #92400e; }
      .bg-emerald { background-color: #d1fae5; color: #065f46; }
      .category-group { margin-bottom: 30px; page-break-inside: avoid; }
      .card { border: 1px solid #000; margin-bottom: 20px; padding: 15px; }
      .card-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
      .grid { display: grid; gap: 15px; }
      .grid-4 { grid-template-columns: repeat(4, 1fr); }
      @media print {
        .no-print { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  `;

  const contentClone = content.cloneNode(true) as HTMLElement;
  contentClone.querySelectorAll(".no-print").forEach((el) => el.remove());

  printWindow.document.write(`
    <html>
      <head>
        <title>PrintStock - ${title}</title>
        ${styles}
      </head>
      <body>
        <div style="margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h1>PrintStock - ${title}</h1>
          <p>Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy", { locale: id })}</p>
          <p>Periode: ${title.includes("Stok") ? "Saat Ini" : monthFilter}</p>
        </div>
        ${contentClone.innerHTML}
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// --- Component ---
const Reports = () => {
  const { toast } = useToast();
  const items = useMemo(() => getItems(), []);
  const transactions = useMemo(() => getTransactions(), []);

  // FIXED: Default month set to February 2026
  const [monthFilter, setMonthFilter] = useState("2026-02");

  // FIXED: Month options start from February 2026 to current month
  const monthOptions = useMemo(() => {
    const opts = [];
    const startDate = setYear(setMonth(new Date(), 1), 2026); // February 2026 (month is 0-indexed, so 1 = Feb)
    const endDate = new Date();
    
    let currentDate = startDate;
    while (currentDate <= endDate) {
      opts.push({
        value: format(currentDate, "yyyy-MM"),
        label: format(currentDate, "MMMM yyyy", { locale: id }),
      });
      currentDate = subMonths(currentDate, -1); // Move forward by 1 month
    }
    
    return opts;
  }, []);

  const filteredTx = useMemo(() => {
    const [y, m] = monthFilter.split("-").map(Number);
    const start = startOfMonth(new Date(y, m - 1));
    const end = endOfMonth(new Date(y, m - 1));
    return transactions.filter((tx) =>
      isWithinInterval(new Date(tx.timestamp), { start, end })
    );
  }, [transactions, monthFilter]);

  // Grouping & Sorting Logic for Stock Report - BY CATEGORY & NAME
  const stockByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    // Initialize all categories
    CATEGORIES.forEach((cat) => {
      grouped[cat] = [];
    });

    // Map items to categories
    items.forEach((item) => {
      const status = getStockStatus(item.stock, item.minStock);
      const cat = item.category || "Lainnya";
      if (!grouped[cat]) grouped[cat] = [];
      
      grouped[cat].push({
        ...item,
        status,
        stockDisplay: formatStock(item.stock, item.baseUnit, item.units),
      });
    });

    // Sort items by Name (A-Z) within each category
    Object.keys(grouped).forEach((cat) => {
      grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [items]);

  const categoryData = useMemo(() => {
    const map: Record<string, { category: string; masuk: number; keluar: number }> = {};
    CATEGORIES.forEach((c) => (map[c] = { category: c, masuk: 0, keluar: 0 }));
    filteredTx.forEach((tx) => {
      const item = items.find((i) => i.id === tx.itemId);
      if (item && map[item.category]) {
        if (tx.type === "in") map[item.category].masuk += tx.baseQuantity;
        else map[item.category].keluar += tx.baseQuantity;
      }
    });
    return Object.values(map).filter((d) => d.masuk > 0 || d.keluar > 0);
  }, [filteredTx, items]);

  const chartConfig: ChartConfig = {
    masuk: { label: "Masuk", color: "hsl(var(--primary))" },
    keluar: { label: "Keluar", color: "hsl(var(--destructive))" },
  };

  const stats = useMemo(() => {
    const totalIn = filteredTx
      .filter((t) => t.type === "in")
      .reduce((s, t) => s + t.baseQuantity, 0);
    const totalOut = filteredTx
      .filter((t) => t.type === "out")
      .reduce((s, t) => s + t.baseQuantity, 0);
    const lowItems = items.filter(
      (i) => getStockStatus(i.stock, i.minStock) === "low"
    ).length;
    return { totalIn, totalOut, txCount: filteredTx.length, lowItems };
  }, [filteredTx, items]);

  const handleExportStockCSV = () => {
    const headers = ["Kategori", "Nama", "SKU", "Stok", "Min Stok", "Status"];
    const rows: string[][] = [];
    Object.keys(stockByCategory).forEach((cat) => {
      stockByCategory[cat].forEach((i) => {
        rows.push([
          cat,
          i.name,
          i.sku,
          i.stockDisplay,
          `${i.minStock} ${i.baseUnit}`,
          STATUS_LABEL[i.status],
        ]);
      });
    });
    downloadCSV(`stok_${monthFilter}.csv`, headers, rows);
    toast({
      title: "Berhasil",
      description: "Data stok berhasil diexport ke CSV",
    });
  };

  const handleExportTxCSV = () => {
    const headers = ["Tanggal", "Barang", "Tipe", "Jumlah", "Referensi", "User"];
    const rows = filteredTx.map((tx) => [
      format(new Date(tx.timestamp), "dd/MM/yyyy HH:mm"),
      tx.itemName,
      tx.type === "in" ? "Masuk" : "Keluar",
      `${tx.quantity} ${tx.unit}`,
      tx.reference || "-",
      tx.user,
    ]);
    downloadCSV(`transaksi_${monthFilter}.csv`, headers, rows);
    toast({
      title: "Berhasil",
      description: "Riwayat transaksi berhasil diexport ke CSV",
    });
  };

  return (
    <AppLayout>
      {/* Print Area Wrapper */}
      <div data-print-area className="space-y-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
            <p className="text-muted-foreground">
              Pantau stok, transaksi, dan audit pergerakan barang.
            </p>
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.txCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barang Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">+{stats.totalIn.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barang Keluar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-{stats.totalOut.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Kritis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowItems}</div>
              <p className="text-xs text-muted-foreground">Perlu perhatian segera</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="stock" className="no-print">
          <TabsList>
            <TabsTrigger value="stock">Ringkasan Stok</TabsTrigger>
            <TabsTrigger value="transaction">Riwayat Transaksi</TabsTrigger>
            <TabsTrigger value="chart">Grafik Kategori</TabsTrigger>
          </TabsList>

          {/* Tab: Stock Summary - Grouped by Category */}
          <TabsContent value="stock" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleExportStockCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel/CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPDF("Ringkasan Stok", monthFilter)}>
                <Printer className="mr-2 h-4 w-4" /> PDF
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Stok Barang (Per Kategori)</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(stockByCategory).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Belum ada data barang.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(stockByCategory).map(([category, categoryItems]) => 
                      categoryItems.length > 0 && (
                        <div key={category} className="category-group">
                          <h3 className="text-lg font-semibold mb-2 bg-muted p-2 rounded">
                            📦 {category}
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nama Barang</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Stok</TableHead>
                                <TableHead className="text-right">Min. Stok</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell>{item.sku}</TableCell>
                                  <TableCell className="text-right">{item.stockDisplay}</TableCell>
                                  <TableCell className="text-right">
                                    {item.minStock} {item.baseUnit}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={STATUS_STYLES[item.status]}>
                                      {STATUS_LABEL[item.status]}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Transaction History */}
          <TabsContent value="transaction" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleExportTxCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel/CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPDF("Riwayat Transaksi", monthFilter)}>
                <Printer className="mr-2 h-4 w-4" /> PDF
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Transaksi (Audit Log)</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTx.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Tidak ada transaksi di bulan ini.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Barang</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Referensi</TableHead>
                        <TableHead>User (Admin)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTx.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(tx.timestamp), "dd MMM yyyy HH:mm", { locale: id })}
                          </TableCell>
                          <TableCell>{tx.itemName}</TableCell>
                          <TableCell>
                            <Badge variant={tx.type === "in" ? "default" : "secondary"}>
                              {tx.type === "in" ? "Masuk" : "Keluar"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {tx.quantity} {tx.unit}
                          </TableCell>
                          <TableCell>{tx.reference || "-"}</TableCell>
                          <TableCell className="font-medium">{tx.user}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Category Chart */}
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pergerakan per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Tidak ada data transaksi di bulan ini.</p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={categoryData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="masuk" fill="var(--color-masuk)" radius={4} />
                      <Bar dataKey="keluar" fill="var(--color-keluar)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Reports;