import { Button } from "@coopfood-kph/ui";
import { Component, lazy, Suspense, type ReactNode } from "react";

// PinGate mounts this only after successful unlock. Keep the workspace and
// its form/query dependencies out of the PIN screen's initial module graph.
const Workspace = lazy(() => import("./workspace"));

export class WorkspaceLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="pin-lock-screen">
        <section className="pin-lock-card">
          <h1>Không thể mở ứng dụng</h1>
          <p className="pin-lock-description" role="alert">Vui lòng tải lại để thử mở ứng dụng.</p>
          <Button className="pin-lock-submit" onClick={() => window.location.reload()}>Tải lại</Button>
        </section>
      </main>
    );
  }
}

export function WorkspaceLoader() {
  return (
    <WorkspaceLoadBoundary>
      <Suspense fallback={
        <main className="pin-lock-screen">
          <section className="pin-lock-card" role="status">Đang mở ứng dụng…</section>
        </main>
      }>
        <Workspace />
      </Suspense>
    </WorkspaceLoadBoundary>
  );
}
