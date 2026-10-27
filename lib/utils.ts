import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


function formatRupiah(value: number | null | undefined) {
  if (value == null) return "Rp 0";

  const hasDecimal = value % 1 !== 0;

  const number = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: hasDecimal ? 2 : 0,
  }).format(value);
  return String(number);
};
export { formatRupiah };

const formatRupiahInput = (value: number) => {
  const hasDecimal = value % 1 !== 0

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: hasDecimal ? 2 : 0,
  }).format(value)
}

const parseRupiahInput = (value: string) => {
  if (!value) return 0

  return Number(
    value
      .replace(/\./g, "") // hapus ribuan
      .replace(",", ".")  // koma → desimal
  )
}

const formatNumber = (value: number) => {
  const hasDecimal = value % 1 !== 0

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: hasDecimal ? 2 : 0,
  }).format(value)
}
export { formatRupiahInput, parseRupiahInput, formatNumber };

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === "-" || dateStr === "null" || dateStr === "undefined") return "-";
  try {
    const s = String(dateStr).trim();
    // Tangani format d-m-yyyy atau dd-mm-yyyy dari backend Laravel
    const parts = s.split("-");
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return s;
  } catch {
    return String(dateStr);
  }
}
