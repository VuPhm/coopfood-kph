import { Button } from "@coopfood-kph/ui";
import { ArrowRight, Boxes, Leaf, ShieldCheck, Store } from "lucide-react";

const modules = [
  { title: "Danh mục hàng hóa", detail: "Import, kiểm tra và phát hành catalog cho cửa hàng.", icon: Boxes, status: "Sẵn sàng nối contract" },
  { title: "Cửa hàng & phân quyền", detail: "Quản lý membership; backend là nơi quyết định quyền.", icon: Store, status: "Chờ vertical slice" },
  { title: "Giám sát phiếu KPH", detail: "Theo dõi đúng phạm vi, không tạo quyền xuyên cửa hàng.", icon: ShieldCheck, status: "Chờ vertical slice" },
] as const;

export function App() {
  return <div className="min-h-dvh bg-canvas text-ink">
    <header className="bg-brand text-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><Leaf aria-hidden="true" /></span><div><strong className="block text-base font-black sm:text-lg">Co.op Food KPH</strong><span className="text-xs text-white/75">Không gian quản trị</span></div></div><span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"><span className="sm:hidden">Foundation</span><span className="hidden sm:inline">Foundation · dữ liệu tổng hợp</span></span></div></header>
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="max-w-2xl"><p className="text-sm font-black uppercase tracking-[.16em] text-brand">Admin Web</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Nền tảng vận hành KPH</h1><p className="mt-3 leading-7 text-ink-muted">Frontend phát triển độc lập qua contract và fixture. Các module chỉ mở khi backend có capability tương ứng.</p></div>
      <section className="mt-8 grid gap-6 md:grid-cols-3" aria-label="Module quản trị">{modules.map(({ detail, icon: Icon, status, title }) => <article key={title} className="grid grid-rows-[auto_auto_1fr_auto_auto] rounded-3xl border border-surface-strong bg-white p-6 shadow-panel"><span className="grid size-12 place-items-center rounded-2xl border border-surface-strong bg-brand-soft text-brand"><Icon aria-hidden="true" /></span><h2 className="mt-6 text-lg font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-ink-muted">{detail}</p><p className="mt-6 min-h-11 rounded-xl border border-surface-strong bg-surface-muted px-3 py-2 text-xs font-bold text-brand">{status}</p><Button className="mt-4 justify-between" variant="secondary" disabled>Chưa mở <ArrowRight size={17} aria-hidden="true" /></Button></article>)}</section>
    </main>
  </div>;
}
