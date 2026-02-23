import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PackagePlus, Calculator, ArrowUpRight } from "lucide-react";
import { getItems, addTransaction, getSmartUnit, setSmartUnit, getTransactions } from "@/lib/inventory-store";
import { convertToBase, formatStock } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Combobox } from "@/components/ui/combobox";

const StockIn = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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

    addTransaction({
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      type: "in",
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
      description: `${safeQty} ${unit} ${selectedItem.name} masuk`,
    });

    setQuantity(0);
    setNote("");
    setReference("");
    setSelectedItemId("");
    setRefresh((r) => r + 1);
  };

  const recentIn = getTransactions().filter((t) => t.type === "in").slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock In — Barang Masuk</h1>
          <p className="text-muted-foreground">Input barang masuk ke inventori</p>
        </div>

        {!isAdmin ? (
          <Card className="shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-xl bg-low/10 p-4 mb-4">
                <PackagePlus className="h-8 w-8 text-low" />
              </div>
              <p className="text-lg font-medium text-foreground">Akses Terbatas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hanya Admin yang bisa melakukan Stock In.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackagePlus className="h-5 w-5 text-safe" /> Input Barang Masuk
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
                        <div className="flex items-center gap-2 rounded-lg bg-safe/10 p-3 text-sm">
                          <Calculator className="h-4 w-4 text-safe" />
                          <span className="font-medium text-safe">
                            {quantity} {unit} = {baseQty.toLocaleString()} {selectedItem.baseUnit}
                          </span>
                        </div>
                      )}

                      <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                        Stok saat ini:{" "}
                        <span className="font-semibold text-foreground">
                          {formatStock(selectedItem.stock, selectedItem.baseUnit, selectedItem.units)}
                        </span>
                        {quantity > 0 && (
                          <>
                            {" "}→ Setelah:{" "}
                            <span className="font-semibold text-safe">
                              {formatStock(
                                selectedItem.stock + baseQty,
                                selectedItem.baseUnit,
                                selectedItem.units
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      <div>
                        <Label>Referensi PO (opsional)</Label>
                        <Input
                          value={reference}
                          onChange={(e) => setReference(e.target.value.slice(0, 100))}
                          placeholder="PO-2024-001"
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
                        className="w-full bg-safe text-safe-foreground hover:bg-safe/90"
                      >
                        <PackagePlus className="mr-2 h-4 w-4" /> Submit Stock In
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Riwayat Masuk Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                {recentIn.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Belum ada.</p>
                ) : (
                  <div className="space-y-3">
                    {recentIn.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="rounded-full bg-safe/15 p-1.5 text-safe">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            +{tx.quantity} {tx.unit} • {tx.user}
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
        )}
      </div>
    </AppLayout>
  );
};

export default StockIn;