import { ScanBarcode } from "lucide-react";
import "./store-utility-polish.css";

/** One barcode action glyph; placement and accessible label belong to each control. */
export function StoreScanIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return <ScanBarcode size={size} strokeWidth={1.8} className={`store-scan-icon ${className}`} data-store-scan-icon="barcode" aria-hidden="true" />;
}
