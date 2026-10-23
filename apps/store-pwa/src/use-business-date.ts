import { useEffect, useState } from "react";
import { addDays } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";

// One Store-level calendar clock; refresh after background/sleep as well as midnight HCM.
export function useBusinessDate() {
  const [today, setToday] = useState(() => formatBusinessDate(new Date()).iso);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const now = new Date();
      const date = formatBusinessDate(now).iso;
      setToday(date);
      const midnight = new Date(`${addDays(date, 1)}T00:00:00+07:00`).getTime();
      timer = setTimeout(refresh, Math.max(1, midnight - now.getTime() + 1));
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  return today;
}
