"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterCondition, FilterConditionValue } from "./FilterCondition";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface FieldOption {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "date" | "relation";

  /**
   * Menentukan input UI untuk value:
   * - text → input biasa
   * - number → input number
   * - date → input date
   * - dropdown → select dengan options
   */
  valueType?: "text" | "number" | "date" | "dropdown";

  /**
   * Jika valueType = dropdown → harus ada options
   */
  options?: { label: string; value: any }[];

  /**
   * Untuk relation: ex supplier, category, warehouse
   * Akan render dropdown modal atau autocomplete
   */
  relationConfig?: {
    fetchUrl: string; // API untuk ambil data
    labelKey: string;
    valueKey: string;
  };
}

interface FilterBuilderProps {
  fields: FieldOption[];
  onApply: (filters: FilterConditionValue[]) => void;
  value?: FilterConditionValue[];       // ✅ controlled state dari parent
  open?: boolean;
  setOpen?: (val: boolean) => void;
}

export function FilterBuilder({
  fields,
  onApply,
  value = [],
  open: externalOpen,
  setOpen: externalSetOpen,
}: FilterBuilderProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConditionValue[]>(value);

  // ✅ Gunakan controlled mode jika disediakan
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalSetOpen ?? setInternalOpen;

  // ✅ Sync dari parent setiap kali `value` berubah
  useEffect(() => {
    setFilters(value);
  }, [value]);

  const handleAddFilter = () => {
    setFilters([...filters, { field: "", operator: "", value: "" }]);
  };

  const handleChange = (index: number, updated: FilterConditionValue) => {
    const newFilters = [...filters];
    newFilters[index] = updated;
    setFilters(newFilters);
  };

  const handleRemove = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onApply(filters ?? []); // ✅ kirim ke parent
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kondisi Filter</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          {filters.map((f, i) => (
            <FilterCondition
              key={i}
              index={i}
              value={f}
              fields={fields}
              onChange={(v) => handleChange(i, v)}
              onRemove={() => handleRemove(i)}
            />
          ))}

          <div
            className="border-dashed border rounded-md text-center py-2 cursor-pointer hover:bg-gray-50"
            onClick={handleAddFilter}
          >
            + Tambah Filter
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button onClick={handleApply}>Terapkan Filter</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
