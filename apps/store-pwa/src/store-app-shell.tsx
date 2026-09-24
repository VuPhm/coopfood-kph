import type { KphKind } from "@coopfood-kph/kph-rules";
import { History, PackagePlus, Salad } from "lucide-react";
import type { ReactNode } from "react";

import "./store-app-shell.css";

type StoreAppShellProps = {
  canCreate: boolean;
  context: ReactNode;
  onCreate: (kind: KphKind) => void;
};

/** The authenticated Store App composition seam. KPH tasks remain direct actions. */
export function StoreAppShell({ canCreate, context, onCreate }: StoreAppShellProps) {
  return <section className="store-app-shell" aria-label="Store App">
    <div className="store-app-shell-heading">
      <p className="store-app-shell-identity">Co.op Food <span>Store App</span></p>
      <div className="store-app-shell-capability">
        <span className="store-app-shell-capability-mark" aria-hidden="true" />
        <div>
          <p className="store-app-shell-eyebrow">Nghiệp vụ đang hoạt động · KPH</p>
          <h1>Hàng không phù hợp</h1>
        </div>
      </div>
      <p className="store-app-shell-description">Tạo phiếu và tra cứu lịch sử tại cửa hàng hiện tại.</p>
    </div>

    <nav className="store-app-shell-tasks" aria-label="Công việc KPH">
      <button type="button" className="store-app-shell-task" disabled={!canCreate} aria-label="Tạo phiếu TP khô & khác (TPCN)" onClick={() => onCreate("TPCN")}>
        <PackagePlus aria-hidden="true" />
        <span><strong>Tạo TPCN</strong><small>TP khô & khác</small></span>
      </button>
      <button type="button" className="store-app-shell-task" disabled={!canCreate} aria-label="Tạo phiếu TP tươi sống (TPTS)" onClick={() => onCreate("TPTS")}>
        <Salad aria-hidden="true" />
        <span><strong>Tạo TPTS</strong><small>TP tươi sống</small></span>
      </button>
      <a className="store-app-shell-task store-app-shell-history" href="#history-title">
        <History aria-hidden="true" />
        <span><strong>Lịch sử</strong><small>Tra cứu phiếu KPH</small></span>
      </a>
    </nav>

    <div className="store-app-shell-context">{context}</div>
  </section>;
}
