import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, ArrowRight, Barcode, CalendarDays, Check, ChevronRight,
  CircleAlert, Clock3, Home, Image, Package, PackageOpen, Search,
  Salad, ShieldCheck, Store, Truck, Wind, X,
} from "lucide-react";

import { BottomNavigation, Button, Card, SectionTitle } from "@coopfood-kph/ui";
import { KPH_OPTIONS, type ConditionCode, type KphKind, type ResolutionCode } from "@coopfood-kph/kph-rules";
import { ExpiryWorkbench } from "./expiry-dialog";
import "./ui-dna-prototype.css";

type Screen = "home" | "kph";
type KphFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type CatalogState = "FOUND" | "NOT_FOUND" | "CATALOG_UNAVAILABLE";
type KphRecord = {
  id: string;
  name: string;
  kind: KphKind;
  reason: string;
  detail: string;
  status: KphFilter;
  statusLabel: string;
  tone: "green" | "amber" | "gray";
};

const initialRecords: KphRecord[] = [
  { id: "KPH-260928-018", name: "Cá hộp sốt cà chua", kind: "TPCN", reason: "Rách bao bì", detail: "2 EA · 28/09/2026", status: "PENDING", statusLabel: "Chờ duyệt", tone: "amber" },
  { id: "KPH-260927-014", name: "Cải thìa VietGAP 500 g", kind: "TPTS", reason: "Dập úng", detail: "1.5 kg · 27/09/2026", status: "APPROVED", statusLabel: "Đã duyệt", tone: "green" },
  { id: "KPH-260926-009", name: "Bánh quy bơ hộp 300 g", kind: "TPCN", reason: "Cận date", detail: "2 EA · 26/09/2026", status: "REJECTED", statusLabel: "Không duyệt", tone: "gray" },
];

export function UiDnaPrototype() {
  const [screen, setScreen] = useState<Screen>("home");
  const [assigned, setAssigned] = useState(true);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [records, setRecords] = useState(initialRecords);
  const [notice, setNotice] = useState("");

  return <div className="dna-app">
    <header className="dna-topbar">
      <a className="dna-brand" href="/" aria-label="CoopFood Store App"><span className="dna-brand-mark">C</span><span><strong>CoopFood</strong><small>STORE APP · PILOT</small></span></a>
      <div className="dna-top-context"><Store size={16} aria-hidden="true" /><span>{assigned ? "Cửa hàng 102 · Ca chiều" : "Chưa có cửa hàng được phân công"}</span></div>
      <span className="dna-avatar" aria-label="Nguyễn Minh Anh">MA</span>
    </header>

    <main className="dna-main">
      <div className="dna-prototype-bar" aria-label="Bản mẫu Round 1R">
        <span><span className="dna-live-dot" /> BẢN MẪU UI DNA <span className="dna-prototype-divider">/</span> Pilot</span>
        <div className="dna-prototype-actions">
          <details className="dna-prototype-state">
            <summary aria-label="Trạng thái cửa hàng minh họa"><Store size={14} aria-hidden="true" /><span>{assigned ? "Đã phân công" : "Chưa phân công"}</span><ChevronRight size={13} aria-hidden="true" /></summary>
            <div role="group" aria-label="Trạng thái cửa hàng minh họa">
              <button type="button" onClick={(event) => { setAssigned(true); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Đã phân công</button>
              <button type="button" onClick={(event) => { setAssigned(false); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Chưa phân công</button>
            </div>
          </details>
          <a href="/">Thoát bản mẫu <ArrowRight size={14} aria-hidden="true" /></a>
        </div>
      </div>

      {notice ? <div className="dna-toast" role="status"><Check size={17} aria-hidden="true" />{notice}<button type="button" aria-label="Đóng thông báo" onClick={() => setNotice("")}><X size={16} aria-hidden="true" /></button></div> : null}
      {screen === "home" ? <HomeScreen assigned={assigned} onOpenKph={() => setScreen("kph")} onOpenExpiry={() => setExpiryOpen(true)} records={records} /> : null}
      {screen === "kph" ? <KphScreen
        records={records}
        onBack={() => setScreen("home")}
        onSubmit={(record) => { setRecords((current) => [record, ...current]); setNotice("Bản mô phỏng: phiếu KPH đã được ghi nhận."); setScreen("kph"); }}
      /> : null}
    </main>

    <div className="workspace-side-stack dna-utility-float"><ExpiryWorkbench open={expiryOpen} onOpenChange={setExpiryOpen} /></div>
    <BottomNavigation className="dna-bottom-nav" activeItem={screen} onSelect={(itemId) => setScreen(itemId as Screen)} items={[
      { id: "home", label: "Trang chủ", icon: <Home aria-hidden="true" /> },
      { id: "kph", label: "KPH", icon: <Package aria-hidden="true" /> },
    ]} />
  </div>;
}

function HomeScreen({ assigned, onOpenKph, onOpenExpiry, records }: {
  assigned: boolean;
  onOpenKph: () => void;
  onOpenExpiry: () => void;
  records: KphRecord[];
}) {
  const pending = records.filter((record) => record.status === "PENDING").length;
  return <div className="dna-screen dna-home">
    <section className="dna-home-hero">
      <p className="dna-eyebrow">TRANG CHỦ · HÔM NAY</p>
      <h1>{assigned ? "Chào buổi chiều, Minh Anh" : "Chưa được phân công cửa hàng"}</h1>
      <p>{assigned ? "Co.op Food Nguyễn Kiệm · Ca chiều" : "Bạn vẫn có thể dùng tiện ích tra hạn lùi hàng."}</p>
      <div className="dna-home-hero-meta"><span><span className="dna-live-dot" /> Cửa hàng hoạt động</span><span>Thứ Hai, 28/09/2026</span></div>
    </section>

    <section className="dna-home-actions" aria-label="Công việc cửa hàng">
      <SectionTitle title="Công việc cửa hàng" description="Mở nhanh các luồng đang triển khai pilot" />
      <div className="dna-home-grid">
        {assigned ? <button type="button" className="dna-home-tile is-kph" onClick={onOpenKph}>
          <span className="dna-home-tile-icon"><PackageOpen size={24} aria-hidden="true" /></span>
          <span className="dna-home-tile-copy"><strong>Hàng không phù hợp</strong><small>KPH · Tạo và theo dõi phiếu</small></span>
          <PilotTag tone="amber">{pending} chờ duyệt</PilotTag><ChevronRight size={18} aria-hidden="true" />
        </button> : null}
        <button type="button" className="dna-home-tile is-utility" onClick={onOpenExpiry}>
          <span className="dna-home-tile-icon"><CalendarDays size={24} aria-hidden="true" /></span>
          <span className="dna-home-tile-copy"><strong>Tra hạn lùi hàng</strong><small>Tính ngày lùi theo NSX và HSD</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>

    {assigned ? <Card className="dna-home-attention">
      <SectionTitle title="Cần chú ý hôm nay" description="Phiếu đang chờ quản lý xem xét" action={<PilotTag tone="amber">{pending} phiếu</PilotTag>} />
      {pending > 0 ? <button type="button" className="dna-attention-row" onClick={onOpenKph}>
        <span className="dna-attention-icon"><Clock3 size={18} aria-hidden="true" /></span>
        <span><strong>Phiếu KPH chờ duyệt</strong><small>{records.find((record) => record.status === "PENDING")?.id} · Cập nhật hôm nay</small></span>
        <ChevronRight size={18} aria-hidden="true" />
      </button> : <div className="dna-empty-state"><ShieldCheck size={22} aria-hidden="true" /><span>Không có phiếu KPH chờ duyệt.</span></div>}
    </Card> : null}
  </div>;
}

function KphScreen({ records, onBack, onSubmit }: {
  records: KphRecord[];
  onBack: () => void;
  onSubmit: (record: KphRecord) => void;
}) {
  const [view, setView] = useState<"history" | "compose" | "review">("history");
  const [filter, setFilter] = useState<KphFilter>("ALL");
  const [kind, setKind] = useState<KphKind>("TPCN");
  const [catalogState, setCatalogState] = useState<CatalogState>("FOUND");
  const [barcode, setBarcode] = useState("8934673601284");
  const [manualEntry, setManualEntry] = useState(false);
  const [condition, setCondition] = useState<ConditionCode>(KPH_OPTIONS.TPCN.defaultCondition);
  const [resolution, setResolution] = useState<ResolutionCode>(KPH_OPTIONS.TPCN.defaultResolution);
  const [quantity, setQuantity] = useState("2");
  const [unit, setUnit] = useState<"EA" | "kg">("EA");
  const [photos, setPhotos] = useState(2);
  const [scenario, setScenario] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const optionSet = KPH_OPTIONS[kind];
  const selectedCondition = optionSet.conditions.find((option) => option.value === condition) ?? optionSet.conditions[0]!;
  const selectedResolution = optionSet.resolutions.find((option) => option.value === resolution) ?? optionSet.resolutions[0]!;
  const visibleRecords = filter === "ALL" ? records : records.filter((record) => record.status === filter);

  const startCompose = (nextKind: KphKind) => {
    setKind(nextKind);
    setCondition(KPH_OPTIONS[nextKind].defaultCondition);
    setResolution(KPH_OPTIONS[nextKind].defaultResolution);
    setCatalogState("FOUND");
    setManualEntry(false);
    setView("compose");
  };

  if (view === "history") return <div className="dna-screen dna-kph-history-screen">
    <PageHeading eyebrow="KPH · HÀNG KHÔNG PHÙ HỢP" title="Lịch sử KPH" description="Theo dõi phiếu và bắt đầu ghi nhận hàng." back={onBack} />
    <Card className="dna-history-card">
      <div className="dna-history-heading"><SectionTitle title="Phiếu gần đây" description={`${visibleRecords.length} phiếu`} /><button className="dna-filter-open" type="button" onClick={() => setFilterOpen(true)}>Lọc <Search size={15} aria-hidden="true" /></button></div>
      <div className="dna-filter-tabs" role="group" aria-label="Lọc trạng thái KPH">
        {([{ key: "ALL", label: "Tất cả" }, { key: "PENDING", label: "Chờ duyệt" }, { key: "APPROVED", label: "Đã duyệt" }, { key: "REJECTED", label: "Không duyệt" }] as const).map((item) => <button key={item.key} type="button" className={filter === item.key ? "is-active" : ""} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}{item.key === "ALL" ? <small>{records.length}</small> : null}</button>)}
      </div>
      <div className="dna-record-list" aria-label="Danh sách phiếu KPH">
        {visibleRecords.map((record) => <button key={record.id} className="dna-record-row" type="button" aria-label={`Phiếu ${record.id}, ${record.name}, ${record.kind}, ${record.reason}, ${record.statusLabel}`}>
          <span className="dna-record-marker"><PackageOpen size={19} aria-hidden="true" /></span>
          <span className="dna-row-main"><strong>{record.name}</strong><span>{record.id} · {record.kind} · {record.reason}</span><small>{record.detail}</small></span>
          <PilotTag tone={record.tone}>{record.statusLabel}</PilotTag><ChevronRight size={17} aria-hidden="true" />
        </button>)}
        {visibleRecords.length === 0 ? <p className="dna-empty-inline">Chưa có phiếu ở trạng thái này.</p> : null}
      </div>
    </Card>
    <Card className="dna-create-card"><SectionTitle title="Tạo phiếu mới" description="Chọn loại hàng không phù hợp." />
      <div className="dna-create-actions"><Button onClick={() => startCompose("TPCN")}><PackageOpen size={17} aria-hidden="true" /> Tạo TPCN</Button><Button variant="secondary" onClick={() => startCompose("TPTS")}><Salad size={17} aria-hidden="true" /> Tạo TPTS</Button></div>
    </Card>
    {filterOpen ? createPortal(<div className="dna-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false); }}>
      <section className="dna-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="dna-filter-title">
        <div className="dna-sheet-handle" /><div className="dna-sheet-heading"><div><p className="dna-eyebrow">KPH</p><h2 id="dna-filter-title">Lọc phiếu</h2></div><button type="button" aria-label="Đóng bộ lọc" onClick={() => setFilterOpen(false)}><X size={19} aria-hidden="true" /></button></div>
        <p>Chọn trạng thái để thu gọn lịch sử.</p><div className="dna-filter-sheet-options" role="group" aria-label="Trạng thái phiếu">{([{ key: "ALL", label: "Tất cả" }, { key: "PENDING", label: "Chờ duyệt" }, { key: "APPROVED", label: "Đã duyệt" }, { key: "REJECTED", label: "Không duyệt" }] as const).map((item) => <button key={item.key} type="button" aria-pressed={filter === item.key} className={filter === item.key ? "is-selected" : ""} onClick={() => setFilter(item.key)}>{item.label}{filter === item.key ? <Check size={17} aria-hidden="true" /> : null}</button>)}</div>
        <Button className="dna-filter-apply" onClick={() => setFilterOpen(false)}>Xem {visibleRecords.length} phiếu</Button>
      </section>
    </div>, document.body) : null}
  </div>;

  if (view === "compose") return <div className="dna-screen dna-kph-screen dna-kph-compose">
    <PageHeading eyebrow="KPH · TẠO PHIẾU" title={`Tạo phiếu ${kind}`} description="Nhập thông tin và ảnh minh chứng trước khi xem lại." back={() => setView("history")} />
    <div className="dna-kind-tabs" role="group" aria-label="Loại KPH">{(["TPCN", "TPTS"] as const).map((nextKind) => <button key={nextKind} type="button" aria-pressed={kind === nextKind} className={kind === nextKind ? "is-active" : ""} onClick={() => { setKind(nextKind); setCondition(KPH_OPTIONS[nextKind].defaultCondition); setResolution(KPH_OPTIONS[nextKind].defaultResolution); }}><strong>{nextKind}</strong><small>{nextKind === "TPCN" ? "Thực phẩm công nghệ" : "Thực phẩm tươi sống"}</small></button>)}</div>

    <Card className="dna-kph-product-card">
      <div className="dna-form-section-heading"><span className="dna-step">1</span><SectionTitle title="Sản phẩm" description="Quét barcode hoặc nhập SKU." /><PilotTag tone={catalogState === "FOUND" ? "green" : catalogState === "NOT_FOUND" ? "amber" : "gray"}>{catalogState}</PilotTag></div>
      <label className="dna-field-label" htmlFor="dna-barcode">Barcode / SKU</label>
      <div className="dna-barcode-field"><Barcode size={19} aria-hidden="true" /><input id="dna-barcode" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Quét hoặc nhập mã" /><Button variant="secondary" size="icon" aria-label="Quét barcode" onClick={() => setCatalogState("FOUND")}><Barcode size={19} aria-hidden="true" /></Button></div>
      {catalogState === "FOUND" && !manualEntry ? <div className="dna-product-result"><span className="dna-product-icon"><Package size={22} aria-hidden="true" /></span><span><strong>Cá hộp sốt cà chua</strong><small>SKU CF0000842 · Seaspimex</small><small>Barcode {barcode || "8934673601284"}</small></span><Check className="dna-product-check" size={19} aria-label="Đã tìm thấy sản phẩm" /></div> : null}
      {catalogState === "NOT_FOUND" ? <div className="dna-catalog-message is-not-found" role="status"><strong>Chưa tìm thấy sản phẩm</strong><p>Giữ nguyên mã đã nhập. Quét lại hoặc nhập tay; hệ thống không tự chọn sản phẩm.</p><div><Button variant="secondary" onClick={() => setCatalogState("FOUND")}><Barcode size={16} aria-hidden="true" /> Quét lại</Button><Button variant="ghost" onClick={() => setManualEntry(true)}>Nhập thủ công</Button></div></div> : null}
      {catalogState === "CATALOG_UNAVAILABLE" ? <div className="dna-catalog-message" role="alert"><strong>Danh mục chưa khả dụng</strong><p>Không thể tra cứu lúc này. Hãy thử lại khi kết nối ổn định.</p><Button variant="secondary" onClick={() => setCatalogState("FOUND")}>Thử lại</Button></div> : null}
      {manualEntry ? <div className="dna-manual-fields"><div className="dna-manual-note"><CircleAlert size={16} aria-hidden="true" />Nhập tay · Chưa gắn sản phẩm từ danh mục</div><label className="dna-field-label">Tên sản phẩm<input placeholder="Nhập tên sản phẩm" /></label><label className="dna-field-label">Mã SKU (nếu có)<input placeholder="Nhập SKU" /></label></div> : null}
      {scenario ? <label className="dna-scenario-picker">Mô phỏng trạng thái catalog<select value={catalogState} onChange={(event) => { setCatalogState(event.target.value as CatalogState); setManualEntry(false); }}><option value="FOUND">FOUND · Tìm thấy</option><option value="NOT_FOUND">NOT_FOUND</option><option value="CATALOG_UNAVAILABLE">Catalog chưa khả dụng</option></select></label> : null}
      <button className="dna-scenario-toggle" type="button" onClick={() => setScenario((current) => !current)}>{scenario ? "Ẩn trạng thái mô phỏng" : "Xem trạng thái mô phỏng"}</button>
    </Card>

    <Card className="dna-kph-form-card">
      <div className="dna-form-section-heading"><span className="dna-step">2</span><SectionTitle title="Tình trạng hàng" description="Chọn một tình trạng phù hợp." /></div>
      <div className="dna-choice-grid">{optionSet.conditions.map((option) => <button key={option.value} className={`dna-choice is-${option.tone}${condition === option.value ? " is-selected" : ""}`} type="button" aria-pressed={condition === option.value} onClick={() => setCondition(option.value)}><span className="dna-choice-icon">{kphChoiceIcon(option.value)}</span><span>{option.label}</span>{condition === option.value ? <Check className="dna-choice-check" size={16} aria-hidden="true" /> : null}</button>)}</div>
      {condition === "OTHER" ? <label className="dna-field-label dna-other-field">Mô tả tình trạng<input placeholder="Nhập mô tả" /></label> : null}
    </Card>

    <Card className="dna-kph-form-card">
      <div className="dna-form-section-heading"><span className="dna-step">3</span><SectionTitle title="Biện pháp xử lý" description="Chọn cách đề xuất xử lý." /></div>
      <div className="dna-resolution-list">{optionSet.resolutions.map((option) => <button key={option.value} className="dna-resolution-option" type="button" aria-pressed={resolution === option.value} onClick={() => setResolution(option.value)}><span className={`dna-radio${resolution === option.value ? " is-selected" : ""}`}>{resolution === option.value ? <Check size={12} aria-hidden="true" /> : null}</span><span>{option.label}</span><ChevronRight size={16} aria-hidden="true" /></button>)}</div>
      {resolution === "OTHER" ? <label className="dna-field-label dna-other-field">Mô tả biện pháp<input placeholder="Nhập biện pháp" /></label> : null}
    </Card>

    <Card className="dna-kph-form-card">
      <div className="dna-form-section-heading"><span className="dna-step">4</span><SectionTitle title="Số lượng và ngày phát hiện" /></div>
      <div className="dna-form-grid"><label className="dna-field-label">Số lượng<div className="dna-quantity-control"><input aria-label="Số lượng" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><div role="group" aria-label="Đơn vị" className="dna-unit-toggle"><button type="button" aria-pressed={unit === "EA"} onClick={() => setUnit("EA")}>EA</button><button type="button" aria-pressed={unit === "kg"} onClick={() => setUnit("kg")}>kg</button></div></div></label><label className="dna-field-label">Ngày phát hiện<div className="dna-readonly-date"><CalendarDays size={17} aria-hidden="true" /><input aria-label="Ngày phát hiện" value="28/09/2026" readOnly /></div></label></div>
    </Card>

    <Card className="dna-kph-form-card dna-evidence-card">
      <div className="dna-form-section-heading"><span className="dna-step">5</span><SectionTitle title="Ảnh minh chứng" description="Cần 1–3 ảnh · ảnh gốc được giữ riêng tư." action={<span className="dna-photo-count">{photos}/3</span>} /></div>
      <div className="dna-evidence-list">{Array.from({ length: photos }, (_, index) => <div key={index} className={`dna-evidence-thumb evidence-${index + 1}`}><Image size={20} aria-hidden="true" /><span>{index === 0 ? "Mặt trước" : index === 1 ? "Tình trạng" : "Chi tiết"}</span><b>{index + 1}</b></div>)}{photos < 3 ? <button className="dna-photo-add" type="button" onClick={() => setPhotos((count) => Math.min(3, count + 1))}><Image size={19} aria-hidden="true" /><strong>Thêm ảnh</strong><small>{3 - photos} còn lại</small></button> : null}</div>
    </Card>
    <details className="dna-kph-extra-details"><summary>Người phát hiện, ngày xử lý và ghi chú <span>Tùy chọn</span></summary><p>Nguyễn Minh Anh · Ngày xử lý chưa nhập</p><textarea aria-label="Ghi chú" placeholder="Nhập ghi chú..." /></details>
    <div className="dna-kph-submit-bar"><Button size="large" className="dna-review-cta" onClick={() => setView("review")}>Xem lại phiếu <ArrowRight size={17} aria-hidden="true" /></Button></div>
  </div>;

  const identity = catalogState === "FOUND" && !manualEntry ? "Cá hộp sốt cà chua" : manualEntry ? "Sản phẩm nhập tay" : "Chưa xác định sản phẩm";
  if (view === "review") return <div className="dna-screen dna-kph-review-screen">
    <PageHeading eyebrow="KPH · XEM LẠI" title="Xem lại phiếu" description="Kiểm tra các thông tin trước khi gửi." back={() => setView("compose")} />
    <div className="dna-kph-ready-notice"><span><Check size={17} aria-hidden="true" /></span><div><strong>Sẵn sàng gửi</strong><small>Phiếu chỉ được gửi sau khi bạn xác nhận.</small></div></div>
    <Card className="dna-review-card">
      <section className="dna-review-product"><span className="dna-review-marker"><PackageOpen size={20} aria-hidden="true" /></span><div><p className="dna-eyebrow">KPH · {kind}</p><h2>{identity}</h2><p>{catalogState === "FOUND" && !manualEntry ? `SKU CF0000842 · Barcode ${barcode}` : catalogState}</p></div><button type="button" onClick={() => setView("compose")}>Sửa</button></section>
      <div className="dna-review-fact-grid"><div><small>Tình trạng</small><strong>{selectedCondition.label}</strong></div><div><small>Biện pháp</small><strong>{selectedResolution.label}</strong></div><div><small>Số lượng</small><strong>{quantity} {unit}</strong></div><div><small>Ngày phát hiện</small><strong>28/09/2026</strong></div></div>
      <section className="dna-review-evidence"><div><strong>Ảnh minh chứng</strong><span>{photos} ảnh</span></div><div className="dna-review-thumbs">{Array.from({ length: photos }, (_, index) => <span key={index} className={`evidence-${index + 1}`}><Image size={17} aria-hidden="true" /><small>{index + 1} · {index === 0 ? "Mặt trước" : index === 1 ? "Tình trạng" : "Chi tiết"}</small></span>)}</div></section>
    </Card>
    <div className="dna-review-actions"><Button variant="secondary" onClick={() => setView("compose")}>Sửa nội dung</Button><Button onClick={() => onSubmit({ id: `KPH-260929-${String(records.length + 1).padStart(3, "0")}`, name: identity, kind, reason: selectedCondition.label, detail: `${quantity} ${unit} · 29/09/2026`, status: "PENDING", statusLabel: "Chờ duyệt", tone: "amber" })}>Gửi phiếu · bản mô phỏng <Check size={17} aria-hidden="true" /></Button></div>
  </div>;
  return null;
}

function PageHeading({ eyebrow, title, description, back }: { eyebrow: string; title: string; description?: string; back?: () => void }) {
  return <div className="dna-page-heading">
    {back ? <button type="button" className="dna-back" onClick={back}><ArrowLeft size={17} aria-hidden="true" />Quay lại</button> : null}
    <p className="dna-eyebrow">{eyebrow}</p><h1>{title}</h1>{description ? <p className="dna-description">{description}</p> : null}
  </div>;
}

function PilotTag({ children, tone }: { children: ReactNode; tone: "green" | "amber" | "gray" }) {
  return <span className={`dna-tag is-${tone}`}>{children}</span>;
}

function kphChoiceIcon(value: string): ReactNode {
  switch (value) {
    case "NEAR_EXPIRY": return <Clock3 size={19} aria-hidden="true" />;
    case "EXPIRED": return <CircleAlert size={19} aria-hidden="true" />;
    case "TORN_PACKAGING": return <PackageOpen size={19} aria-hidden="true" />;
    case "VACUUM_LEAK": return <Wind size={19} aria-hidden="true" />;
    case "BRUISED_WATERLOGGED": return <Salad size={19} aria-hidden="true" />;
    case "ROTTEN_MOLDY": return <CircleAlert size={19} aria-hidden="true" />;
    case "CANCEL": return <CircleAlert size={19} aria-hidden="true" />;
    case "EXCHANGE": return <Package size={19} aria-hidden="true" />;
    case "RETURN": return <Truck size={19} aria-hidden="true" />;
    default: return <CircleAlert size={19} aria-hidden="true" />;
  }
}
