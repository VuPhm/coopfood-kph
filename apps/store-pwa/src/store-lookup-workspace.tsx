import { useState } from "react";
import { Button, Input } from "@coopfood-kph/ui";
import type { components } from "@coopfood-kph/api";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { mockBarcodeLookup, mockProfile } from "./store-app-mock";
import { figmaAsset } from "./figma-assets";
import { daysBetween, parseDisplayDate } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";

type Product = components["schemas"]["BarcodeFound"]["product"];
type Lot = { id: string; manufactured: string; expiry: string; status: "track" | "warning" | "alert" };
const demoProduct: Product = { id: "synthetic-product-2", barcode: "8936000123456", skuCode: "0008421", name: "Bánh quy bơ hộp 300 g", primarySupplier: { code: "NCC001", name: "Công ty Thực phẩm An Việt" } };
const produceProduct: Product = { id: "synthetic-product-1", barcode: "29123415005", skuCode: "0011730", name: "Cải thìa VietGAP 500 g", primarySupplier: { code: "NCC001", name: "Nông sản Miền Đông" } };
const products = [demoProduct, produceProduct];
// Presentation metadata belongs to these synthetic fixtures, not the API Product schema.
const productMetadata: Record<string, { group: string; unit: "EA" | "kg" }> = {
  "synthetic-product-2": { group: "Thực phẩm khô", unit: "EA" },
  "synthetic-product-1": { group: "Thực phẩm tươi sống", unit: "kg" },
};
const lots: Record<string, Lot[]> = {
  "synthetic-product-2": [
    { id: "A24-301", manufactured: "01/08/2026", expiry: "15/11/2026", status: "track" },
    { id: "A24-255", manufactured: "15/07/2026", expiry: "18/10/2026", status: "warning" },
    { id: "A24-198", manufactured: "28/06/2026", expiry: "07/10/2026", status: "alert" },
  ],
  "synthetic-product-1": [
    { id: "C24-118", manufactured: "01/09/2026", expiry: "07/10/2026", status: "alert" },
  ],
};
const statusText = { track: "Theo dõi", warning: "Cận hạn", alert: "Cảnh báo" };

export function StoreLookupWorkspace() {
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function search(value = query) {
    const term = value.trim();
    setQuery(term);
    setProduct(null);
    setMessage("");
    if (!term) { setMessage("Nhập mã hàng, tên hàng hoặc lô cần tra cứu."); return; }
    setBusy(true);
    try {
      const normalized = term.toLocaleLowerCase("vi");
      const localProduct = products.find(item => item.barcode === term || item.skuCode === term || item.name.toLocaleLowerCase("vi") === normalized || lots[item.id]?.some(lot => lot.id.toLocaleLowerCase("vi") === normalized)) ?? null;
      const result = localProduct ? { status: "FOUND" as const, barcode: localProduct.barcode, product: localProduct } : await mockBarcodeLookup(term);
      if (result.status === "FOUND" && result.product) setProduct(result.product);
      else setMessage("Không tìm thấy mã hàng. Có thể quét lại hoặc nhập mã khác; không có sản phẩm nào được suy đoán.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chưa thể tra cứu danh mục. Thử lại.");
    } finally { setBusy(false); }
  }

  const productLots = product ? lots[product.id] ?? [] : [];
  const metadata = product ? productMetadata[product.id] : undefined;
  const today = formatBusinessDate(new Date()).iso;
  return <div className="store-lookup">
    <form className="store-lookup-search" onSubmit={event => { event.preventDefault(); void search(); }}>
      <label><img data-figma-asset-slot="lookup-search" data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-1", "imgFeatherSearch")} alt="" /><span className="sr-only">Mã hàng, tên hàng hoặc lô</span><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Mã hàng, tên hàng hoặc quét" autoComplete="off" /></label>
      <button type="button" aria-label="Quét barcode để tra cứu" onClick={() => setScannerOpen(true)}><img src={figmaAsset("203-701", "imgFeatherMaximize")} alt="" /></button>
      <Button className="store-button" type="submit" disabled={busy}>{busy ? "Đang tra cứu…" : "Tra cứu"}</Button>
    </form>
    {message ? <p className="store-lookup-message" role="status">{message}</p> : null}
    {product ? <div className="store-lookup-results">
      <section className="store-lookup-product"><span className="store-lookup-product-icon"><img src={figmaAsset("main-2", "imgFeatherPackage")} alt="" /></span><h2>{product.name}</h2><p>SKU {product.skuCode} · UPC {product.barcode}</p><span className="store-lookup-found">Đã nhận diện</span><hr /><h3>Thông tin</h3><dl><div><dt>Nhóm hàng</dt><dd>{metadata?.group ?? "Chưa có dữ liệu"}</dd></div><div><dt>Nhà cung cấp</dt><dd>{product.primarySupplier.name}</dd></div><div><dt>Đơn vị</dt><dd>{metadata?.unit ?? "Chưa có dữ liệu"}</dd></div><div><dt>Cửa hàng</dt><dd>{mockProfile.storeName}</dd></div></dl></section>
      <section className="store-lookup-lots"><header><h2>Các lô đang theo dõi</h2><span>{productLots.length} lô</span></header><div className="store-lookup-table-wrap"><table><thead><tr><th>Số lô</th><th>Ngày sản xuất</th><th>Hạn sử dụng</th><th>Còn lại</th><th>Trạng thái</th></tr></thead><tbody>{productLots.map(lot => { const remaining = daysBetween(today, parseDisplayDate(lot.expiry)); return <tr key={lot.id}><td>{lot.id}</td><td>{lot.manufactured}</td><td>{lot.expiry}</td><td className={`is-${lot.status}`}>{remaining < 0 ? `Quá ${Math.abs(remaining)} ngày` : `${remaining} ngày`}</td><td><span className={`store-lookup-status is-${lot.status}`}>{statusText[lot.status]}</span></td></tr>; })}</tbody></table></div></section>
    </div> : null}
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={value => { setQuery(value); void search(value); }} presentation="screen" />
  </div>;
}
