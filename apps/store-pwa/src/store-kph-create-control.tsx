import { memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@coopfood-kph/ui";
import type { KphKind } from "@coopfood-kph/kph-rules";
import type { CreateRecordDialog, CreatedRecordDraft, CreateRecordSeed } from "./create-record-dialog";
import type { StoreProfile } from "./store-profile";
import type { components } from "@coopfood-kph/api";
import { mockBarcodeLookup, mockProfile } from "./store-app-mock";
import { KphFormSkeleton } from "./store-kph-loading";
import "./store-kph-create-forms.css";
const labels: Record<KphKind, string> = { TPCN: "TP khô & khác", TPTS: "TP tươi sống" };
const loadCreateForm = () => import("./create-record-dialog");
export function preloadKphCreateForm() { void loadCreateForm().catch(() => {}); }
export type KphCreateHandle = { open: (kind: KphKind, initialValues?: CreateRecordSeed, returnFocus?: HTMLElement | null, sourceLocked?: boolean) => void };
export const KphCreateControl = memo(function KphCreateControl({ ref, onSaved, profile = mockProfile, onBarcodeLookup = mockBarcodeLookup, suspended = false }: {
  ref: Ref<KphCreateHandle>; onSaved: (draft: CreatedRecordDraft) => Promise<void>;
  profile?: StoreProfile; suspended?: boolean;
  onBarcodeLookup?: (barcode: string) => Promise<components["schemas"]["BarcodeLookupResponse"]>;
}) {
  const saving = useRef(false);
  const blocked = useRef(suspended);
  blocked.current = suspended;
  const [kind, setKind] = useState<KphKind>("TPTS");
  const [open, setOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<CreateRecordSeed | undefined>();
  const [sourceLocked, setSourceLocked] = useState(false);
  const [session, setSession] = useState(0);
  const [entranceReady, setEntranceReady] = useState(false);
  const [readySession, setReadySession] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [Form, setForm] = useState<typeof CreateRecordDialog | null>(null);
  const [failed, setFailed] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDivElement | null>(null);
  const pendingScroll = useRef(0);
  const initialScroll = useRef(0);
  useImperativeHandle(ref, () => ({ open: (value, initial, returnFocus, lockSource = false) => {
    if (blocked.current || saving.current) return;
    opener.current = returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setInitialValues(initial);
    setSourceLocked(lockSource);
    pendingScroll.current = 0;
    initialScroll.current = 0;
    setReviewing(false);
    setEntranceReady(false);
    setReadySession(null);
    setSession(value => value + 1);
    setKind(value);
    setOpen(true);
  } }), []);
  useEffect(() => {
    if (!open || Form) return;
    let current = true;
    loadCreateForm().then(module => {
      if (!current) return;
      setForm(() => module.CreateRecordDialog);
    }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [open, Form]);
  useEffect(() => {
    if (!open) return;
    let current = true;
    let secondFrame = 0;
    // Paint the light surface first. Do not mount the full form during its entrance.
    const firstFrame = window.requestAnimationFrame(() => {
      const animations = dialog.current?.getAnimations?.() ?? [];
      void Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
        if (!current) return;
        secondFrame = window.requestAnimationFrame(() => { if (current) setEntranceReady(true); });
      });
    });
    return () => { current = false; window.cancelAnimationFrame(firstFrame); window.cancelAnimationFrame(secondFrame); };
  }, [open, session]);
  useEffect(() => {
    if (!open || !Form || !entranceReady || readySession === session) return;
    initialScroll.current = pendingScroll.current;
    setReadySession(session);
  }, [open, Form, entranceReady, readySession, session]);
  useLayoutEffect(() => {
    // A focused loading-only control may disappear; keep focus inside the same surface.
    if (open && readySession === session && document.activeElement === document.body) dialog.current?.querySelector<HTMLElement>('[data-slot="dialog-close"]')?.focus({ preventScroll: true });
  }, [open, readySession, session]);
  const changeOpen = useCallback((next: boolean) => { if (!saving.current && !blocked.current) setOpen(next); }, []);
  const save = async (draft: CreatedRecordDraft) => {
    if (blocked.current || saving.current) throw new Error("Đang xác minh phiên. Hãy thử lại sau.");
    saving.current = true;
    try { await onSaved(draft); } finally { saving.current = false; }
  };
  const restoreFocus = useCallback((event: Event) => { event.preventDefault(); opener.current?.focus({ preventScroll: true }); }, []);
  return <Dialog open={open} onOpenChange={changeOpen}><DialogContent ref={dialog} data-kind={kind.toLowerCase()} data-suspended={suspended || undefined} onKeyDownCapture={event => { if (suspended) { event.preventDefault(); event.stopPropagation(); } }} data-reviewing={reviewing ? "true" : "false"} aria-busy={suspended || (readySession !== session && !failed)} className="store-create-screen create-dialog-content p-0 sm:p-0" aria-describedby="kph-create-description" onScrollCapture={event => {
    if (event.target instanceof HTMLElement && event.target.classList.contains("create-dialog-form")) pendingScroll.current = event.target.scrollTop;
  }} onInteractOutside={event => event.preventDefault()} onCloseAutoFocus={restoreFocus} onOpenAutoFocus={event => {
    event.preventDefault();
    dialog.current?.querySelector<HTMLElement>('[data-slot="dialog-close"]')?.focus({ preventScroll: true });
  }}>
    {suspended ? <p data-scope-status role="status" aria-live="polite">Đang xác minh phiên và quyền cửa hàng…</p> : null}
    <DialogHeader className="create-dialog-header"><DialogTitle className="create-dialog-title">{reviewing ? "Xem lại phiếu KPH" : "Tạo phiếu KPH"}<small>{labels[kind]}</small></DialogTitle></DialogHeader>
    <DialogDescription id="kph-create-description" className="sr-only">Tạo phiếu hàng không phù hợp; trường có dấu sao là bắt buộc.</DialogDescription>
    {readySession !== session && !failed ? <p className="sr-only" role="status">Đang tải biểu mẫu tạo phiếu…</p> : null}
    {/* Keep the body intact through the close animation; each open starts a new draft. */}
    {Form && readySession === session ? <Form key={session} embedded onReviewingChange={setReviewing} initialScrollTop={initialScroll.current} initialValues={initialValues} kind={kind} open onOpenChange={changeOpen} suspended={suspended} onSaved={save} onBarcodeLookup={onBarcodeLookup} profile={profile} actorReadOnly onlineMode sourceLocked={sourceLocked} presentation="screen" />
      : failed ? <div className="store-create-loading-body"><p role="alert">Chưa tải được biểu mẫu. Kiểm tra kết nối rồi tải lại ứng dụng.</p><button type="button" className="store-button" onClick={() => window.location.reload()}>Tải lại ứng dụng</button><button type="button" onClick={() => changeOpen(false)}>Hủy mở phiếu</button></div>
      : <KphFormSkeleton kind={kind} onCancel={() => changeOpen(false)} />}
  </DialogContent></Dialog>;
});
