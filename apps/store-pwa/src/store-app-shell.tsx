import type { KphKind } from "@coopfood-kph/kph-rules";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@coopfood-kph/ui";
import { ClipboardPlus, History } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import "./store-app-shell.css";

type StoreAppShellProps = {
  canCreate: boolean;
  context: ReactNode;
  onCreate: (kind: KphKind) => void;
};

/** The authenticated Store App composition seam. KPH tasks remain direct actions. */
export function StoreAppShell({ canCreate, context, onCreate }: StoreAppShellProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  function chooseCategory(kind: KphKind) {
    setCategoryOpen(false);
    onCreate(kind);
  }
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
      <button type="button" className="store-app-shell-task" aria-label="Tạo phiếu" disabled={!canCreate} onClick={() => setCategoryOpen(true)}>
        <ClipboardPlus aria-hidden="true" />
        <span><strong>Tạo phiếu</strong><small>Ghi nhận hàng không phù hợp</small></span>
      </button>
      <a className="store-app-shell-task store-app-shell-history" href="#history-title">
        <History aria-hidden="true" />
        <span><strong>Lịch sử</strong><small>Tra cứu phiếu KPH</small></span>
      </a>
    </nav>

    <div className="store-app-shell-context">{context}</div>
    <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
      <DialogContent aria-describedby="create-kind-description">
        <DialogHeader>
          <DialogTitle>Chọn nhóm thực phẩm</DialogTitle>
          <DialogDescription id="create-kind-description">Chọn nhóm để mở phiếu KPH.</DialogDescription>
        </DialogHeader>
        <div className="store-app-shell-category-options">
          <Button type="button" onClick={() => chooseCategory("TPCN")}>Thực phẩm khô &amp; khác</Button>
          <Button type="button" variant="secondary" onClick={() => chooseCategory("TPTS")}>Thực phẩm tươi sống</Button>
        </div>
      </DialogContent>
    </Dialog>
  </section>;
}
