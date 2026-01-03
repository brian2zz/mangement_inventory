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