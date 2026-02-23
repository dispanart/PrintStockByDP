import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, PackageMinus, LogOut, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { getStockStatus, formatStock } from "@/lib/types";
import { getItems } from "@/lib/inventory-store";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export function AppLayout({ children, onSearch }: AppLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const items = getItems();
  const lowStockItems = items.filter(i => getStockStatus(i.stock, i.minStock) === 'low');
  const lowStockCount = lowStockItems.length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Halo, {user?.name || 'User'}! 👋</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari barang..."
                  className="w-64 pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {lowStockCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-low text-[10px] font-bold text-low-foreground">
                        {lowStockCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="border-b border-border p-3">
                    <p className="text-sm font-semibold text-foreground">Notifikasi Stok</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {lowStockCount === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">Semua stok aman ✅</p>
                    ) : (
                      lowStockItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 border-b border-border p-3 last:border-0">
                          <div className="rounded-full bg-low/15 p-1.5 text-low">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Stok: {formatStock(item.stock, item.baseUnit, item.units)} (min: {item.minStock} {item.baseUnit})
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
                onClick={() => navigate("/stock-out")}
              >
                <PackageMinus className="mr-2 h-4 w-4" />
                Quick Stock Out
              </Button>

              <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
