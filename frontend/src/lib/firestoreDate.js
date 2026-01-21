import { format } from "date-fns";

export function normalizeDateToYMD(value) {
  if (!value) return "";

  // Firestore Timestamp
  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      return format(value.toDate(), "yyyy-MM-dd");
    } catch (e) {
      return "";
    }
  }

  const s = String(value);

  // ISO datetime
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

export function yearFromDateValue(value) {
  const ymd = normalizeDateToYMD(value);
  const y = ymd.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "";
}

export function monthKeyFromDateValue(value) {
  const ymd = normalizeDateToYMD(value);
  return ymd.length >= 7 ? ymd.slice(0, 7) : "";
}
