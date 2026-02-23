import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Package, Box, Printer, FileText, Scissors, Palette, Layers, Droplets,
  Wrench, Cog, Truck, ShoppingBag, Ruler, PenTool, Brush, Stamp,
  BookOpen, Archive, Tag, Zap, Star, Heart, Diamond, Circle,
  Square, Triangle, Hexagon, Bookmark, Flag, Award, Crown, Shield,
} from "lucide-react";

export const ICON_OPTIONS = [
  { name: "Package", icon: Package },
  { name: "Box", icon: Box },
  { name: "Printer", icon: Printer },
  { name: "FileText", icon: FileText },
  { name: "Scissors", icon: Scissors },
  { name: "Palette", icon: Palette },
  { name: "Layers", icon: Layers },
  { name: "Droplets", icon: Droplets },
  { name: "Wrench", icon: Wrench },
  { name: "Cog", icon: Cog },
  { name: "Truck", icon: Truck },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "Ruler", icon: Ruler },
  { name: "PenTool", icon: PenTool },
  { name: "Brush", icon: Brush },
  { name: "Stamp", icon: Stamp },
  { name: "BookOpen", icon: BookOpen },
  { name: "Archive", icon: Archive },
  { name: "Tag", icon: Tag },
  { name: "Zap", icon: Zap },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Diamond", icon: Diamond },
  { name: "Circle", icon: Circle },
  { name: "Square", icon: Square },
  { name: "Triangle", icon: Triangle },
  { name: "Hexagon", icon: Hexagon },
  { name: "Bookmark", icon: Bookmark },
  { name: "Flag", icon: Flag },
  { name: "Award", icon: Award },
  { name: "Crown", icon: Crown },
  { name: "Shield", icon: Shield },
];

export function getIconByName(name: string) {
  return ICON_OPTIONS.find((i) => i.name === name)?.icon || Package;
}

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const SelectedIcon = getIconByName(value);

  const filtered = ICON_OPTIONS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <SelectedIcon className="h-4 w-4" />
          <span>{value || "Pilih Icon"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder="Cari icon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-xs"
        />
        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <Button
              key={item.name}
              variant={value === item.name ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              title={item.name}
              onClick={() => {
                onChange(item.name);
                setOpen(false);
              }}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
