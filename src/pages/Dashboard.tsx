import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getItems, getTransactions } from "@/lib/inventory-store";
import { getStockStatus, formatStock, CATEGORIES } from "@/lib/types";
import { getIconByName } from "@/components/IconPicker";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const items = getItems();
  const transactions = getTransactions();

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      const status = getStockStatus(item.stock, item.minStock);
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const totalItems = items.length;
  const lowStockItems = items.filter(i => getStockStatus(i.stock, i.minStock) === 'low').length;
  const pendingToday = transactions.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.timestamp).toDateString() === today;
  }).length;

  const recentTransactions = transactions.slice(0, 8);

  const statusBadge = (status: string) => {
    const styles = {
      safe: "bg-safe/15 text-safe border-safe/30",
      low: "bg-low/15 text-low border-low/30",
      mid: "bg-warning/15 text-warning border-warning/30",
    };
    const labels = { safe: "Safe", low: "Low", mid: "Mid" };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <AppLayout onSearch={setSearchQuery}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm opacity-90">Total Items</p>
                <p className="text-3xl font-bold">{totalItems}</p>
              </div>
              <div className="rounded-xl bg-primary-foreground/20 p-3">
                {(() => { const Icon = getIconByName("Package"); return <Icon className="h-6 w-6" />; })()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-low to-low/80 text-low-foreground shadow-lg">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm opacity-90">Low Stock</p>
                <p className="text-3xl font-bold">{lowStockItems}</p>
              </div>
              <div className="rounded-xl bg-low-foreground/20 p-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-safe to-safe/80 text-safe-foreground shadow-lg">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm opacity-90">Transaksi Hari Ini</p>
                <p className="text-3xl font-bold">{pendingToday}</p>
              </div>
              <div className="rounded-xl bg-safe-foreground/20 p-3">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Stock Table */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Stock Status</CardTitle>
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="safe">Safe</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          {items.length === 0 ? "Belum ada barang. Tambahkan di Master Data." : "Tidak ada hasil."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.slice(0, 10).map(item => {
                        const status = getStockStatus(item.stock, item.minStock);
                        const ItemIcon = getIconByName(item.icon || "Package");
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <ItemIcon className="h-4 w-4 text-primary" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.category}</TableCell>
                            <TableCell>{formatStock(item.stock, item.baseUnit, item.units)}</TableCell>
                            <TableCell>{statusBadge(status)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => navigate("/master-data")}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                {filteredItems.length > 10 && (
                  <div className="mt-3 text-center">
                    <Button variant="link" className="text-primary" onClick={() => navigate("/master-data")}>
                      See All Items →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>
                  ) : (
                    recentTransactions.map(tx => (
                      <div key={tx.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                        <div className={`mt-0.5 rounded-full p-1.5 ${tx.type === 'in' ? 'bg-safe/15 text-safe' : 'bg-low/15 text-low'}`}>
                          {tx.type === 'in' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.type === 'in' ? '+' : '-'}{tx.quantity} {tx.unit} • oleh {tx.user}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(tx.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}{' '}
                          {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
