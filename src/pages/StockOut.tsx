import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PackageMinus, Calculator, ArrowDownRight, AlertTriangle } from "lucide-react";
import { getItems, addTransaction, getSmartUnit, setSmartUnit, getTransactions } from "@/lib/inventory-store";
import { convertToBase, formatStock } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Combobox } from "@/components/ui/combobox";

const StockOut = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const items = getItems();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [, setRefresh] = useState(0);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  // FIXED: Sort items by name (A-Z) for dropdown with search
  const itemOptions = useMemo(() => {
    return items
      .map((item) => ({
        value: item.id,
        label: `${item.name} (${item.sku})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "id"));
  }, [items]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setUnit(item.baseUnit);
    }
  };

  const baseQty = useMemo(() => {
    if (!selectedItem) return 0;
    return convertToBase(quantity, unit, selectedItem.baseUnit, selectedItem.units);
  }, [selectedItem, quantity, unit]);

  const willGoNegative = selectedItem ? baseQty > selectedItem.stock : false;

  const handleSubmit = () => {
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Pilih barang terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const safeQty = Math.max(0, Math.min(quantity, 999999999));
    if (safeQty <= 0 || !Number.isFinite(safeQty)) {
      toast({
        title: "Error",
        description: "Masukkan jumlah yang valid (lebih dari 0)",
        variant: "destructive",
      });
      return;
    }

    if (willGoNegative) {
      toast({
        title: "Stok Tidak Cukup",
        description: `Stok tersedia: ${formatStock(
          selectedItem.stock,
          selectedItem.baseUnit,
          selectedItem.units
        )}`,
        variant: "destructive",
      });
      return;
    }

    addTransaction({
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      type: "out",
      quantity: safeQty,
      unit,
      baseQuantity: baseQty,
      note: note.trim().slice(0, 500) || undefined,
      reference: reference.trim().slice(0, 100) || undefined,
      user: user?.name || "Unknown",
    });

    setSmartUnit(selectedItem.id, unit);
    toast({
      title: "Berhasil",
      description: `${safeQty} ${unit} ${selectedItem.name} keluar`,
    });

    setQuantity(0);
    setNote("");
    setReference("");
    setSelectedItemId("");
    setRefresh((r) => r + 1);
  };

  const recentOut = getTransactions().filter((t) => t.type === "out").slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Out — Barang Keluar</h1>
          <p className="text-muted-foreground">Input barang keluar dari inventori</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageMinus className="h-5 w-5 text-accent" /> Input Barang Keluar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pilih Barang</Label>
                  {/* FIXED: Using Combobox with search and sorted options */}
                  <Combobox
                    options={itemOptions}
                    value={selectedItemId}
                    onChange={handleItemSelect}
                    placeholder="Pilih barang..."
                    searchPlaceholder="Ketik nama barang atau SKU..."
                    className="w-full"
                  />
                </div>

                {selectedItem && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Jumlah</Label>
                        <Input
                          type="number"
                          value={quantity || ""}
                          onChange={(e) =>
                            setQuantity(Math.max(0, Math.min(999999999, Number(e.target.value) || 0)))
                          }
                          min={0}
                          max={999999999}
                        />
                      </div>
                      <div>
                        <Label>Satuan</Label>
                        <Input value={selectedItem.baseUnit} disabled className="bg-muted" />
                      </div>
                    </div>

                    {quantity > 0 && unit !== selectedItem.baseUnit && (
                      <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-sm">
                        <Calculator className="h-4 w-4 text-accent" />
                        <span className="font-medium text-accent">
                          {quantity} {unit} = {baseQty.toLocaleString()} {selectedItem.baseUnit}
                        </span>
                      </div>
                    )}

                    {willGoNegative && (
                      <div className="flex items-center gap-2 rounded-lg bg-low/10 p-3 text-sm text-low">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">
                          Stok tidak cukup! Tersedia:{" "}
                          {formatStock(selectedItem.stock, selectedItem.baseUnit, selectedItem.units)}
                        </span>
                      </div>
                    )}

                    <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      Stok saat ini:{" "}
                      <span className="font-semibold text-foreground">
                        {formatStock(selectedItem.stock, selectedItem.baseUnit, selectedItem.units)}
                      </span>
                      {quantity > 0 && !willGoNegative && (
                        <>
                          {" "}→ Setelah:{" "}
                          <span className="font-semibold text-accent">
                            {formatStock(
                              selectedItem.stock - baseQty,
                              selectedItem.baseUnit,
                              selectedItem.units
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    <div>
                      <Label>Referensi Job/PO (opsional)</Label>
                      <Input
                        value={reference}
                        onChange={(e) => setReference(e.target.value.slice(0, 100))}
                        placeholder="JOB-2024-001"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label>Catatan (opsional)</Label>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value.slice(0, 500))}
                        placeholder="Catatan tambahan..."
                        rows={2}
                        maxLength={500}
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={willGoNegative}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <PackageMinus className="mr-2 h-4 w-4" /> Submit Stock Out
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Riwayat Keluar Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOut.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada.</p>
              ) : (
                <div className="space-y-3">
                  {recentOut.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="rounded-full bg-low/15 p-1.5 text-low">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          -{tx.quantity} {tx.unit} • {tx.user}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          {new Date(tx.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default StockOut;