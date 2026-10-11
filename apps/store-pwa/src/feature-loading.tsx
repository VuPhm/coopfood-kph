import { Component, type ReactNode } from "react";
import "./feature-loading.css";

export function KphLoadingSkeleton({ compact = false, label = "Đang tải KPH" }: { compact?: boolean; label?: string }) {
  return <section className={`kph-loading ${compact ? "is-compact" : ""}`} aria-busy="true" aria-label={label}>
    <p role="status">{label}…</p>
    <div aria-hidden="true">
      {!compact ? <><div className="kph-loading-actions"><span /><span /></div><div className="kph-loading-tabs"><span /><span /></div></> : null}
      <div className="kph-loading-rows">{[0, 1, 2, 3, 4].map(row => <div key={row}><span /><span /><span /></div>)}</div>
    </div>
  </section>;
}

// Local chunk failures need a visible recovery action, including offline navigation.
export function FeatureLoadError() {
  return <section className="feature-load-error" role="alert">
    <p>Chưa tải được giao diện. Kiểm tra kết nối rồi tải lại ứng dụng.</p>
    <button type="button" onClick={() => window.location.reload()}>Tải lại ứng dụng</button>
  </section>;
}

export class FeatureLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <FeatureLoadError />;
    return this.props.children;
  }
}
