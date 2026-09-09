import { zodResolver } from "@hookform/resolvers/zod";
import { KPH_OPTIONS, parseDisplayDate, resolveChoiceLabel, type KphKind } from "@coopfood-kph/kph-rules";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  cn,
} from "@coopfood-kph/ui";
import {
  Apple,
  Ban,
  Biohazard,
  CalendarClock,
  Camera,
  CircleAlert,
  Images,
  Image as ImageIcon,
  LoaderCircle,
  MoreHorizontal,
  PackageOpen,
  Repeat2,
  ScanLine,
  Trash2,
  Truck,
  Wind,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import type { components } from "@coopfood-kph/api";

import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { processEvidencePhoto } from "./image-processing";
import { EvidenceImageViewer } from "./image-viewer";
import { DEFAULT_STORE_PROFILE, type StoreProfile } from "./store-profile";

function isDisplayDate(value: string) {
  try {
    parseDisplayDate(value);
    return true;
  } catch {
    return false;
  }
}

const schema = z.object({
  detectedDate: z.string().refine(isDisplayDate, "Nhập ngày hợp lệ theo dd/mm/yyyy"),
  barcode: z.string().max(50, "SKU/UPC tối đa 50 ký tự"),
  supplier: z.string().max(150, "Nhà cung cấp tối đa 150 ký tự"),
  productName: z.string().max(200, "Tên hàng hóa tối đa 200 ký tự"),
  quantity: z.string().refine((value) => Number(value) > 0, "Số lượng phải lớn hơn 0"),
  unit: z.enum(["EA", "kg"]),
  condition: z.string().min(1),
  conditionDetail: z.string().max(255, "Nội dung tối đa 255 ký tự"),
  resolution: z.string().min(1),
  resolutionDetail: z.string().max(255, "Nội dung tối đa 255 ký tự"),
  treatmentDate: z.string().refine((value) => !value.trim() || isDisplayDate(value), "Nhập ngày hợp lệ theo dd/mm/yyyy"),
  detectedBy: z.string().min(1, "Thiếu người phát hiện").max(100, "Người phát hiện tối đa 100 ký tự"),
  note: z.string().max(255, "Ghi chú tối đa 255 ký tự"),
}).refine(({ barcode, productName }) => barcode.trim() || productName.trim(), {
  message: "Nhập SKU/UPC hoặc tên hàng hóa",
  path: ["productName"],
});

type FormData = z.infer<typeof schema>;
type PhotoDraft = {
  id: string;
  fileName: string;
  originalFile: File;
  stampedBlob: Blob;
  capturedAt: Date;
  url: string;
};

export type CreatedRecordDraft = {
  kind: KphKind;
  detectedDate: string;
  barcode: string;
  supplier: string;
  productName: string;
  quantity: number;
  unit: "EA" | "kg";
  condition: string;
  conditionValue: components["schemas"]["KphCondition"];
  conditionDetail: string;
  resolution: string;
  resolutionValue: components["schemas"]["KphResolution"];
  resolutionDetail: string;
  treatmentDate: string;
  detectedBy: string;
  note: string;
  idempotencyKey?: string;
  photos: readonly { id: string; fileName: string; blob: Blob; originalFile: File; capturedAt: Date }[];
};

type CreateRecordDialogProps = {
  kind: KphKind | null;
  open: boolean;
  profile?: StoreProfile;
  actorReadOnly?: boolean;
  onlineMode?: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (draft: CreatedRecordDraft) => Promise<void> | void;
  onBarcodeLookup?: ((barcode: string) => Promise<components["schemas"]["BarcodeLookupResponse"]>) | undefined;
};

const kindLabels: Record<KphKind, string> = {
  TPCN: "Thực phẩm khô & khác",
  TPTS: "Thực phẩm tươi sống",
};

function defaultValues(kind: KphKind, profile: StoreProfile): FormData {
  const options = KPH_OPTIONS[kind];
  return {
    detectedDate: formatBusinessDate(new Date()).display,
    barcode: "",
    supplier: "",
    productName: "",
    quantity: "1",
    unit: "EA",
    condition: options.defaultCondition,
    conditionDetail: "",
    resolution: options.defaultResolution,
    resolutionDetail: "",
    treatmentDate: "",
    detectedBy: profile.fullName,
    note: "",
  };
}

export function CreateRecordDialog({ kind, onOpenChange, onSaved, onBarcodeLookup, open, profile = DEFAULT_STORE_PROFILE, actorReadOnly = false, onlineMode = false }: CreateRecordDialogProps) {
  const activeKind = kind ?? "TPCN";
  const options = KPH_OPTIONS[activeKind];
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const photoRef = useRef<PhotoDraft[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [activePhoto, setActivePhoto] = useState<PhotoDraft | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeLookupMessage, setBarcodeLookupMessage] = useState("");
  const [lookupRetryValue, setLookupRetryValue] = useState("");
  const lookupRequestId = useRef(0);
  const autoFilledLookup = useRef({ barcode: "", productName: "", supplier: "" });
  const idempotencyKeyRef = useRef<string | null>(null);
  const savingRecordRef = useRef(false);
  const {
    formState: { errors },
    handleSubmit,
    getValues,
    register,
    reset,
    setFocus,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(activeKind, profile),
  });

  const selectedCondition = watch("condition");
  const selectedResolution = watch("resolution");
  const detectedDate = watch("detectedDate");
  const treatmentDate = watch("treatmentDate");
  const barcode = watch("barcode");
  const initialMonth = formatBusinessDate(new Date()).iso;

  function clearPhotos() {
    for (const photo of photoRef.current) {
      if (photo.url) URL.revokeObjectURL(photo.url);
    }
    photoRef.current = [];
    setPhotos([]);
    setActivePhoto(null);
  }

  useEffect(() => {
    if (!kind) return;
    reset(defaultValues(kind, profile));
    clearPhotos();
    setPhotoError("");
    setBarcodeLookupMessage("");
    setLookupRetryValue("");
    lookupRequestId.current += 1;
    idempotencyKeyRef.current = null;
    clearAutoFilledLookup();
  }, [kind, profile, reset]);

  useEffect(() => {
    if (open || !kind) return;
    reset(defaultValues(kind, profile));
    clearPhotos();
    setPhotoError("");
    setBarcodeLookupMessage("");
    setLookupRetryValue("");
    lookupRequestId.current += 1;
    idempotencyKeyRef.current = null;
    clearAutoFilledLookup();
  }, [open, kind, profile, reset]);

  useEffect(() => {
    const subscription = watch(() => {
      if (!savingRecordRef.current) idempotencyKeyRef.current = null;
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => () => {
    for (const photo of photoRef.current) {
      if (photo.url) URL.revokeObjectURL(photo.url);
    }
  }, []);

  if (!kind) return null;

  function clearAutoFilledLookup() {
    const current = autoFilledLookup.current;
    const values = getValues();
    if (current.productName && values.productName === current.productName) {
      setValue("productName", "", { shouldDirty: true });
    }
    if (current.supplier && values.supplier === current.supplier) {
      setValue("supplier", "", { shouldDirty: true });
    }
    autoFilledLookup.current = { barcode: "", productName: "", supplier: "" };
  }

  async function lookupBarcode(value = barcode) {
    const normalized = value.trim();
    if (!normalized) {
      lookupRequestId.current += 1;
      clearAutoFilledLookup();
      setBarcodeLookupMessage("");
      setLookupRetryValue("");
      return;
    }
    if (!onBarcodeLookup) return;
    const requestId = ++lookupRequestId.current;
    clearAutoFilledLookup();
    setBarcodeLookupMessage("Đang tra cứu barcode…");
    setLookupRetryValue("");
    try {
      const result = await onBarcodeLookup(normalized);
      if (requestId !== lookupRequestId.current || getValues("barcode").trim() !== normalized) return;
      if (result.status === "FOUND") {
        setValue("productName", result.product.name, { shouldDirty: true });
        setValue("supplier", result.product.primarySupplier.name, { shouldDirty: true });
        autoFilledLookup.current = {
          barcode: normalized,
          productName: result.product.name,
          supplier: result.product.primarySupplier.name,
        };
        setBarcodeLookupMessage(`Đã tìm thấy ${result.product.skuCode}.`);
      } else {
        clearAutoFilledLookup();
        setBarcodeLookupMessage("Không tìm thấy barcode. Có thể nhập tên hàng hóa và NCC thủ công; mã đã quét sẽ được giữ lại.");
      }
    } catch (error) {
      if (requestId !== lookupRequestId.current || getValues("barcode").trim() !== normalized) return;
      setBarcodeLookupMessage(error instanceof Error ? error.message : "Không thể tra cứu barcode lúc này.");
      setLookupRetryValue(normalized);
    }
  }

  const submit = handleSubmit(async (values) => {
    if (processingPhotos) {
      setPhotoError("Vui lòng chờ ảnh được tối ưu và đóng tem xong");
      return;
    }
    if (photos.length < 1) {
      setPhotoError("Cần chọn ít nhất 1 ảnh minh chứng");
      return;
    }
    const unsupportedPhoto = onlineMode && photos.find(({ originalFile }) => !isOnlinePhotoSupported(originalFile));
    if (unsupportedPhoto) {
      setPhotoError(onlinePhotoError(unsupportedPhoto.originalFile));
      return;
    }
    const conditionChoice = options.conditions.find(({ value }) => value === values.condition) ?? options.conditions[0]!;
    const resolutionChoice = options.resolutions.find(({ value }) => value === values.resolution) ?? options.resolutions[0]!;
    setSavingRecord(true);
    savingRecordRef.current = true;
    setPhotoError("");
    try {
      const idempotencyKey = idempotencyKeyRef.current ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
      idempotencyKeyRef.current = idempotencyKey;
      await onSaved({
        kind,
        detectedDate: values.detectedDate,
        barcode: values.barcode.trim(),
        supplier: values.supplier.trim(),
        productName: values.productName.trim(),
        quantity: Number(values.quantity),
        unit: values.unit,
        condition: resolveChoiceLabel(conditionChoice, values.conditionDetail),
        conditionValue: conditionChoice.value as components["schemas"]["KphCondition"],
        conditionDetail: values.conditionDetail.trim(),
        resolution: resolveChoiceLabel(resolutionChoice, values.resolutionDetail),
        resolutionValue: resolutionChoice.value as components["schemas"]["KphResolution"],
        resolutionDetail: values.resolutionDetail.trim(),
        treatmentDate: values.treatmentDate.trim(),
        detectedBy: actorReadOnly ? profile.fullName : values.detectedBy.trim(),
        note: values.note.trim(),
        idempotencyKey,
        photos: photos.map(({ id, fileName, originalFile, stampedBlob, capturedAt }) => ({
          id,
          fileName,
          blob: stampedBlob,
          originalFile,
          capturedAt,
        })),
      });
      reset(defaultValues(kind, profile));
      clearPhotos();
      idempotencyKeyRef.current = null;
      onOpenChange(false);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Không thể lưu phiếu trên thiết bị");
    } finally {
      setSavingRecord(false);
      savingRecordRef.current = false;
    }
  });

  async function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (photoRef.current.length + files.length > 3) {
      setPhotoError("Mỗi phiếu chỉ được tối đa 3 ảnh");
      return;
    }
    if (onlineMode) {
      const unsupportedFile = files.find((file) => !isOnlinePhotoSupported(file));
      if (unsupportedFile) {
        setPhotoError(onlinePhotoError(unsupportedFile));
        return;
      }
    }
    setProcessingPhotos(true);
    setPhotoError("");
    const additions: PhotoDraft[] = [];
    try {
      for (const [index, file] of files.entries()) {
        if (onlineMode) {
          const capturedAt = file.lastModified > 0 ? new Date(file.lastModified) : new Date();
          additions.push({
            id: globalThis.crypto?.randomUUID?.() ?? `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
            fileName: file.name,
            originalFile: file,
            stampedBlob: file,
            capturedAt,
            url: createObjectUrl(file),
          });
        } else {
          const processed = await processEvidencePhoto(file, { storeCode: profile.storeCode, storeName: profile.storeName });
          additions.push({
            id: globalThis.crypto?.randomUUID?.() ?? `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
            fileName: file.name,
            originalFile: file,
            stampedBlob: processed.blob,
            capturedAt: processed.capturedAt,
            url: createObjectUrl(processed.blob),
          });
        }
      }
      const next = [...photoRef.current, ...additions];
      photoRef.current = next;
      setPhotos(next);
      idempotencyKeyRef.current = null;
    } catch (error) {
      additions.forEach((photo) => URL.revokeObjectURL(photo.url));
      setPhotoError(error instanceof Error ? error.message : "Không thể tối ưu và đóng tem ảnh minh chứng");
    } finally {
      setProcessingPhotos(false);
    }
  }

  function removePhoto(id: string) {
    const removed = photos.find((photo) => photo.id === id);
    if (removed?.url) URL.revokeObjectURL(removed.url);
    const next = photos.filter((photo) => photo.id !== id);
    photoRef.current = next;
    setPhotos(next);
    idempotencyKeyRef.current = null;
    if (activePhoto?.id === id) setActivePhoto(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="create-dialog-content w-[min(46rem,calc(100%-2rem))] max-w-[46rem] p-0 sm:p-0" aria-describedby="create-description">
          <DialogHeader className="create-dialog-header">
            <DialogTitle className="create-dialog-title">Tạo phiếu KPH · {kindLabels[kind]}</DialogTitle>
            <DialogDescription id="create-description" className="sr-only">
              Tạo phiếu hàng không phù hợp; trường có dấu sao là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <form className="create-dialog-form" onSubmit={submit}>
            <FormSection number="1" title="Thông tin phát hiện">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ngày phát hiện" htmlFor="detected-date" required error={errors.detectedDate?.message}>
                  <CalendarInput id="detected-date" initialMonth={initialMonth} label="Ngày phát hiện" value={detectedDate} readOnly onValueChange={(value) => setValue("detectedDate", value, { shouldDirty: true })} />
                </Field>
                <Field label="Mã SKU / UPC" htmlFor="barcode">
                  <div className="relative">
                  <Input id="barcode" className="pr-12" autoComplete="off" placeholder="Nhập hoặc quét mã" {...register("barcode", { onChange: (event) => {
                    lookupRequestId.current += 1;
                    setBarcodeLookupMessage("");
                    setLookupRetryValue("");
                    if (autoFilledLookup.current.barcode && event.target.value.trim() !== autoFilledLookup.current.barcode) clearAutoFilledLookup();
                  }, onBlur: () => void lookupBarcode() })} />
                    <button type="button" className="field-input-action" aria-label="Quét mã barcode" onClick={() => setScannerOpen(true)}>
                      <ScanLine aria-hidden="true" size={18} />
                    </button>
                  </div>
                  {barcodeLookupMessage ? <p className="mt-1 text-xs text-ink-muted" role="status">{barcodeLookupMessage}{lookupRetryValue ? <button type="button" className="ml-2 underline" onClick={() => void lookupBarcode(lookupRetryValue)}>Thử tra cứu lại</button> : null}</p> : null}
                </Field>
                <Field label="Nhà cung cấp" htmlFor="supplier" error={errors.supplier?.message}>
                  <Input id="supplier" placeholder="Điền tên NCC" {...register("supplier")} />
                </Field>
                <Field label="Tên hàng hóa" htmlFor="product-name" error={errors.productName?.message}>
                  <Input id="product-name" placeholder="Điền tên hàng hóa" {...register("productName")} />
                </Field>
              </div>
            </FormSection>

            <FormSection number="2" title="Số lượng & đơn vị">
              <div className="grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <Field label="Số lượng" htmlFor="quantity" required error={errors.quantity?.message}>
                  <Input id="quantity" inputMode="decimal" {...register("quantity")} />
                </Field>
                <fieldset className="unit-fieldset">
                  <legend className="text-sm font-bold">Đơn vị</legend>
                  <div className="unit-options">
                    {(["EA", "kg"] as const).map((unit) => <label key={unit}><input className="sr-only" type="radio" value={unit} {...register("unit")} /><span>{unit}</span></label>)}
                  </div>
                </fieldset>
              </div>
            </FormSection>

            <FormSection number="3" title="Tình trạng hàng">
              <ChoiceGroup legend="Tình trạng" name="condition" register={register} choices={options.conditions} />
              {selectedCondition === "OTHER" ? <Field className="mt-3" label="Nội dung tình trạng khác" htmlFor="condition-detail" error={errors.conditionDetail?.message}><Input id="condition-detail" placeholder="Để trống sẽ giữ nhãn “Khác”" {...register("conditionDetail")} /></Field> : null}
            </FormSection>

            <FormSection number="4" title="Biện pháp xử lý">
              <ChoiceGroup legend="Biện pháp xử lý" name="resolution" register={register} choices={options.resolutions} />
              {selectedResolution === "OTHER" ? <Field className="mt-3" label="Nội dung biện pháp khác" htmlFor="resolution-detail" error={errors.resolutionDetail?.message}><Input id="resolution-detail" placeholder="Để trống sẽ giữ nhãn “KHÁC”" {...register("resolutionDetail")} /></Field> : null}
              <Field className="mt-3" label="Ngày xử lý (nếu có)" htmlFor="treatment-date" error={errors.treatmentDate?.message}>
                <CalendarInput id="treatment-date" initialMonth={initialMonth} label="Ngày xử lý (nếu có)" value={treatmentDate} onValueChange={(value) => setValue("treatmentDate", value, { shouldDirty: true })} />
              </Field>
            </FormSection>

            <FormSection number="5" title="Người phát hiện & ảnh">
              <Field label="Tên người nhập" htmlFor="detected-by" required error={errors.detectedBy?.message}>
                <Input id="detected-by" readOnly={actorReadOnly} {...register("detectedBy")} />
              </Field>
              <div className="mt-3">
                <p className="text-sm font-bold">Ảnh minh chứng <span className="text-danger" aria-hidden="true">*</span></p>
                <p className="mt-1 text-xs text-ink-muted">Cần ít nhất một ảnh, tối đa ba ảnh. Ảnh được giữ đúng thứ tự đã chọn.</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <PhotoPicker accept={onlineMode ? ONLINE_PHOTO_ACCEPT : PILOT_PHOTO_ACCEPT} disabled={processingPhotos || savingRecord || photos.length >= 3} icon={<Camera aria-hidden="true" />} label="Chụp ảnh" capture="environment" onChange={selectPhotos} />
                  <PhotoPicker accept={onlineMode ? ONLINE_PHOTO_ACCEPT : PILOT_PHOTO_ACCEPT} disabled={processingPhotos || savingRecord || photos.length >= 3} icon={<Images aria-hidden="true" />} label="Chọn ảnh" multiple onChange={selectPhotos} />
                </div>
                {photos.length ? <div className="photo-previews" aria-label="Ảnh đã chọn">{photos.map((photo, index) => <figure key={photo.id} className="photo-preview"><button type="button" className="photo-preview-open" onClick={() => setActivePhoto(photo)} aria-label={`Xem ảnh minh chứng ${index + 1}`} title={`Xem ${photo.fileName}`}>{photo.url ? <img src={photo.url} alt="" /> : <ImageIcon aria-hidden="true" />}</button><figcaption>{index + 1}</figcaption><button type="button" className="photo-preview-remove" onClick={() => removePhoto(photo.id)} aria-label={`Xóa ảnh ${index + 1}`} title={photo.fileName}><Trash2 size={15} aria-hidden="true" /></button></figure>)}</div> : null}
                <p className={cn("mt-2 text-xs font-semibold", photoError ? "text-danger" : "text-ink-muted")} role={photoError ? "alert" : "status"}>
                  {photoError || (processingPhotos ? "Đang tối ưu và đóng tem ảnh…" : photos.length ? `Đã xử lý ${photos.length}/3 ảnh · chạm ảnh để xem chi tiết` : "Chưa chọn ảnh")}
                </p>
              </div>
              <Field className="mt-3" label="Ghi chú" htmlFor="note" error={errors.note?.message}>
                <textarea id="note" rows={3} className="w-full resize-y rounded-xl border-2 border-surface-strong bg-white px-3 py-3 text-base outline-none transition-[background-color,border-color] placeholder:text-ink-muted/70 hover:border-brand/25 hover:bg-brand-soft/40 focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2" placeholder="Nhập ghi chú..." {...register("note")} />
              </Field>
            </FormSection>

            <footer className="create-dialog-footer">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={processingPhotos || savingRecord}>{processingPhotos || savingRecord ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />{processingPhotos ? "Đang xử lý ảnh" : "Đang lưu phiếu"}</> : "Lưu phiếu"}</Button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>

      <EvidenceImageViewer image={activePhoto ? { src: activePhoto.url, alt: `Ảnh minh chứng ${activePhoto.fileName} đã đóng tem` } : null} open={activePhoto !== null} onOpenChange={(next) => { if (!next) setActivePhoto(null); }} />

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
          onScan={(scannedBarcode) => {
            lookupRequestId.current += 1;
            setValue("barcode", scannedBarcode, { shouldDirty: true, shouldValidate: true });
            void lookupBarcode(scannedBarcode);
            window.setTimeout(() => setFocus("barcode"), 0);
        }}
      />
    </>
  );
}

function FormSection({ children, number, title }: { children: ReactNode; number: string; title: string }) {
  return <section className="form-section" aria-labelledby={`section-${number}`}><h3 id={`section-${number}`}><span>{number}.</span> {title}</h3>{children}</section>;
}

type ChoiceGroupProps = {
  legend: string;
  name: "condition" | "resolution";
  register: UseFormRegister<FormData>;
  choices: readonly { value: string; label: string; tone: string }[];
};

function ChoiceGroup({ choices, legend, name, register }: ChoiceGroupProps) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={cn("choice-grid", choices.length === 2 && "choice-grid-two", choices.length === 5 && "choice-grid-five")}>
        {choices.map((choice) => (
          <label key={choice.value} className={cn("choice-card", `choice-${choice.tone}`)}>
            <input className="sr-only" type="radio" value={choice.value} {...register(name)} />
            <span className="choice-icon">{choiceIcon(choice.value)}</span>
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function choiceIcon(value: string) {
  if (value === "NEAR_EXPIRY") return <CalendarClock aria-hidden="true" />;
  if (value === "TORN_PACKAGING") return <PackageOpen aria-hidden="true" />;
  if (value === "VACUUM_LEAK") return <Wind aria-hidden="true" />;
  if (value === "BRUISED_WATERLOGGED") return <Apple aria-hidden="true" />;
  if (value === "ROTTEN_MOLDY") return <Biohazard aria-hidden="true" />;
  if (value === "EXPIRED") return <CircleAlert aria-hidden="true" />;
  if (value === "CANCEL") return <Ban aria-hidden="true" />;
  if (value === "EXCHANGE") return <Repeat2 aria-hidden="true" />;
  if (value === "RETURN") return <Truck aria-hidden="true" />;
  return <MoreHorizontal aria-hidden="true" />;
}

const ONLINE_PHOTO_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";
const PILOT_PHOTO_ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif";

function isOnlinePhotoSupported(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type === "image/heic" || type === "image/heif" || /\.(heic|heif)$/.test(name)) return false;
  if (type === "image/jpeg" || type === "image/png") return true;
  return !type && /\.(jpe?g|png)$/.test(name);
}

function onlinePhotoError(file: File) {
  const isHeic = file.type.toLowerCase().includes("heic") || file.type.toLowerCase().includes("heif") || /\.(heic|heif)$/i.test(file.name);
  return isHeic
    ? `Ảnh “${file.name}” là HEIC/HEIF và hiện chưa được hỗ trợ khi gửi online. Hãy chọn JPEG hoặc PNG; ảnh gốc không được thay bằng bản stamped.`
    : `Ảnh “${file.name}” chưa được hỗ trợ khi gửi online. Hãy chọn JPEG hoặc PNG.`;
}

function createObjectUrl(blob: Blob) {
  return typeof URL.createObjectURL === "function" ? URL.createObjectURL(blob) : "";
}

function PhotoPicker({ accept, capture, disabled, icon, label, multiple, onChange }: { accept: string; capture?: "environment"; disabled?: boolean; icon: ReactNode; label: string; multiple?: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className={cn("photo-picker", disabled && "is-disabled")}><span>{icon}{label}</span><input className="sr-only" type="file" accept={accept} capture={capture} multiple={multiple} disabled={disabled} onChange={onChange} /></label>;
}
