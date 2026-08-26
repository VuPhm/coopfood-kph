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
  Ban,
  CalendarClock,
  Camera,
  CircleAlert,
  Images,
  Image as ImageIcon,
  LoaderCircle,
  MoreHorizontal,
  Repeat2,
  ScanLine,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { z } from "zod";

import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { processEvidencePhoto } from "./image-processing";
import { EvidenceImageViewer } from "./image-viewer";

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
  resolution: string;
  treatmentDate: string;
  detectedBy: string;
  note: string;
  photos: readonly { id: string; fileName: string; blob: Blob }[];
};

type CreateRecordDialogProps = {
  kind: KphKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (draft: CreatedRecordDraft) => void;
};

const kindLabels: Record<KphKind, string> = {
  TPCN: "Thực phẩm khô & khác",
  TPTS: "Thực phẩm tươi sống",
};

const DEMO_STORE_STAMP = { storeCode: "CF-DEMO-001", storeName: "Nguyễn Kiệm" };

function defaultValues(kind: KphKind): FormData {
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
    detectedBy: "Nguyễn Văn Demo",
    note: "",
  };
}

export function CreateRecordDialog({ kind, onOpenChange, onSaved, open }: CreateRecordDialogProps) {
  const activeKind = kind ?? "TPCN";
  const options = KPH_OPTIONS[activeKind];
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const photoRef = useRef<PhotoDraft[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [activePhoto, setActivePhoto] = useState<PhotoDraft | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setFocus,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(activeKind),
  });

  const selectedCondition = watch("condition");
  const selectedResolution = watch("resolution");
  const detectedDate = watch("detectedDate");
  const treatmentDate = watch("treatmentDate");
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
    reset(defaultValues(kind));
    clearPhotos();
    setPhotoError("");
  }, [kind, reset]);

  useEffect(() => () => {
    for (const photo of photoRef.current) {
      if (photo.url) URL.revokeObjectURL(photo.url);
    }
  }, []);

  if (!kind) return null;

  const submit = handleSubmit((values) => {
    if (processingPhotos) {
      setPhotoError("Vui lòng chờ ảnh được tối ưu và đóng tem xong");
      return;
    }
    if (photos.length < 1) {
      setPhotoError("Cần chọn ít nhất 1 ảnh minh chứng");
      return;
    }
    const conditionChoice = options.conditions.find(({ value }) => value === values.condition) ?? options.conditions[0]!;
    const resolutionChoice = options.resolutions.find(({ value }) => value === values.resolution) ?? options.resolutions[0]!;
    onSaved({
      kind,
      detectedDate: values.detectedDate,
      barcode: values.barcode.trim(),
      supplier: values.supplier.trim(),
      productName: values.productName.trim(),
      quantity: Number(values.quantity),
      unit: values.unit,
      condition: resolveChoiceLabel(conditionChoice, values.conditionDetail),
      resolution: resolveChoiceLabel(resolutionChoice, values.resolutionDetail),
      treatmentDate: values.treatmentDate.trim(),
      detectedBy: values.detectedBy.trim(),
      note: values.note.trim(),
      photos: photos.map(({ id, fileName, stampedBlob }) => ({ id, fileName, blob: stampedBlob })),
    });
    reset(defaultValues(kind));
    clearPhotos();
    setPhotoError("");
    onOpenChange(false);
  });

  async function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (photoRef.current.length + files.length > 3) {
      setPhotoError("Mỗi phiếu chỉ được tối đa 3 ảnh");
      return;
    }
    setProcessingPhotos(true);
    setPhotoError("");
    const additions: PhotoDraft[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const processed = await processEvidencePhoto(file, DEMO_STORE_STAMP);
        additions.push({
          id: globalThis.crypto?.randomUUID?.() ?? `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
          fileName: file.name,
          originalFile: file,
          stampedBlob: processed.blob,
          capturedAt: processed.capturedAt,
          url: URL.createObjectURL(processed.blob),
        });
      }
      const next = [...photoRef.current, ...additions];
      photoRef.current = next;
      setPhotos(next);
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
                    <Input id="barcode" className="pr-12" autoComplete="off" placeholder="Nhập hoặc quét mã" {...register("barcode")} />
                    <button type="button" className="field-input-action" aria-label="Quét mã barcode" onClick={() => setScannerOpen(true)}>
                      <ScanLine aria-hidden="true" size={18} />
                    </button>
                  </div>
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
                <Input id="detected-by" {...register("detectedBy")} />
              </Field>
              <div className="mt-3">
                <p className="text-sm font-bold">Ảnh minh chứng <span className="text-danger" aria-hidden="true">*</span></p>
                <p className="mt-1 text-xs text-ink-muted">Cần ít nhất một ảnh, tối đa ba ảnh. Ảnh được giữ đúng thứ tự đã chọn.</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <PhotoPicker disabled={processingPhotos || photos.length >= 3} icon={<Camera aria-hidden="true" />} label="Chụp ảnh" capture="environment" onChange={selectPhotos} />
                  <PhotoPicker disabled={processingPhotos || photos.length >= 3} icon={<Images aria-hidden="true" />} label="Chọn ảnh" multiple onChange={selectPhotos} />
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
              <Button type="submit" disabled={processingPhotos}>{processingPhotos ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Đang xử lý ảnh</> : "Lưu phiếu"}</Button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>

      <EvidenceImageViewer image={activePhoto ? { src: activePhoto.url, alt: `Ảnh minh chứng ${activePhoto.fileName} đã đóng tem` } : null} open={activePhoto !== null} onOpenChange={(next) => { if (!next) setActivePhoto(null); }} />

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quét mã SKU / UPC</DialogTitle>
            <DialogDescription>Ưu tiên camera sau. Có thể thử lại hoặc dùng máy quét cầm tay dạng bàn phím.</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-52 place-items-center rounded-2xl bg-ink p-5 text-center text-white">
            <div><ScanLine className="mx-auto" size={42} aria-hidden="true" /><p className="mt-3 font-bold">Camera chưa được nối trong foundation</p><p className="mt-1 text-sm text-white/70">Luồng nhập tay vẫn luôn khả dụng, không làm người dùng mắc kẹt.</p></div>
          </div>
          <div className="flex justify-end"><Button type="button" onClick={() => { setScannerOpen(false); window.setTimeout(() => setFocus("barcode"), 0); }}>Nhập mã thủ công</Button></div>
        </DialogContent>
      </Dialog>
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
  if (["EXPIRED", "TORN_PACKAGING", "VACUUM_LEAK", "BRUISED_WATERLOGGED", "ROTTEN_MOLDY"].includes(value)) return <CircleAlert aria-hidden="true" />;
  if (value === "CANCEL") return <Ban aria-hidden="true" />;
  if (value === "EXCHANGE") return <Repeat2 aria-hidden="true" />;
  if (value === "RETURN") return <Truck aria-hidden="true" />;
  return <MoreHorizontal aria-hidden="true" />;
}

function PhotoPicker({ capture, disabled, icon, label, multiple, onChange }: { capture?: "environment"; disabled?: boolean; icon: ReactNode; label: string; multiple?: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className={cn("photo-picker", disabled && "is-disabled")}><span>{icon}{label}</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" capture={capture} multiple={multiple} disabled={disabled} onChange={onChange} /></label>;
}
