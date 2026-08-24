import { zodResolver } from "@hookform/resolvers/zod";
import { KPH_OPTIONS, parseDisplayDate, type KphKind } from "@coopfood-kph/kph-rules";
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
  MoreHorizontal,
  Repeat2,
  ScanLine,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { z } from "zod";

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
type PhotoDraft = { id: string; fileName: string; url: string };

type CreateRecordDialogProps = {
  kind: KphKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (kind: KphKind) => void;
};

const kindLabels: Record<KphKind, string> = {
  TPCN: "Thực phẩm khô & khác",
  TPTS: "Thực phẩm tươi sống",
};

function defaultValues(kind: KphKind): FormData {
  const options = KPH_OPTIONS[kind];
  return {
    detectedDate: "15/08/2026",
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setFocus,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(activeKind),
  });

  const selectedCondition = watch("condition");
  const selectedResolution = watch("resolution");

  function clearPhotos() {
    for (const photo of photoRef.current) {
      if (photo.url) URL.revokeObjectURL(photo.url);
    }
    photoRef.current = [];
    setPhotos([]);
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

  const submit = handleSubmit(() => {
    if (photos.length < 1) {
      setPhotoError("Cần chọn ít nhất 1 ảnh minh chứng");
      return;
    }
    onSaved(kind);
    reset(defaultValues(kind));
    clearPhotos();
    setPhotoError("");
    onOpenChange(false);
  });

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 3) {
      setPhotoError("Mỗi phiếu chỉ được tối đa 3 ảnh");
      event.target.value = "";
      return;
    }
    const additions = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      fileName: file.name,
      url: typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : "",
    }));
    const next = [...photos, ...additions];
    photoRef.current = next;
    setPhotos(next);
    setPhotoError("");
    event.target.value = "";
  }

  function removePhoto(id: string) {
    const removed = photos.find((photo) => photo.id === id);
    if (removed?.url) URL.revokeObjectURL(removed.url);
    const next = photos.filter((photo) => photo.id !== id);
    photoRef.current = next;
    setPhotos(next);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(46rem,calc(100%-2rem))] max-w-[46rem] p-0 sm:p-0" aria-describedby="create-description">
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
                  <Input id="detected-date" inputMode="numeric" placeholder="dd/mm/yyyy" {...register("detectedDate")} />
                </Field>
                <Field label="Mã SKU / UPC" htmlFor="barcode">
                  <div className="flex gap-2">
                    <Input id="barcode" autoComplete="off" placeholder="Nhập hoặc quét mã" {...register("barcode")} />
                    <Button type="button" size="icon" variant="secondary" aria-label="Quét mã barcode" onClick={() => setScannerOpen(true)}>
                      <ScanLine aria-hidden="true" size={20} />
                    </Button>
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
                <fieldset>
                  <legend className="mb-1.5 text-sm font-bold">Đơn vị</legend>
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
                <Input id="treatment-date" inputMode="numeric" placeholder="dd/mm/yyyy" {...register("treatmentDate")} />
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
                  <PhotoPicker icon={<Camera aria-hidden="true" />} label="Chụp ảnh" capture="environment" onChange={selectPhotos} />
                  <PhotoPicker icon={<Images aria-hidden="true" />} label="Chọn ảnh" multiple onChange={selectPhotos} />
                </div>
                {photos.length ? <div className="photo-previews" aria-label="Ảnh đã chọn">{photos.map((photo, index) => <figure key={photo.id} className="photo-preview">{photo.url ? <img src={photo.url} alt={`Ảnh minh chứng ${index + 1}`} /> : <ImageIcon aria-hidden="true" />}<figcaption>{index + 1}</figcaption><button type="button" onClick={() => removePhoto(photo.id)} aria-label={`Xóa ảnh ${index + 1}`} title={photo.fileName}><Trash2 size={15} aria-hidden="true" /></button></figure>)}</div> : null}
                <p className={cn("mt-2 text-xs font-semibold", photoError ? "text-danger" : "text-ink-muted")} role={photoError ? "alert" : "status"}>
                  {photoError || (photos.length ? `Đã chọn ${photos.length}/3 ảnh` : "Chưa chọn ảnh")}
                </p>
              </div>
              <Field className="mt-3" label="Ghi chú" htmlFor="note" error={errors.note?.message}>
                <textarea id="note" rows={3} className="w-full resize-y rounded-xl bg-white px-3 py-3 text-base outline-none transition-[background-color,box-shadow] placeholder:text-ink-muted/70 hover:bg-brand-soft/40 focus-visible:ring-3 focus-visible:ring-focus" placeholder="Nhập ghi chú..." {...register("note")} />
              </Field>
            </FormSection>

            <footer className="create-dialog-footer">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit">Lưu phiếu</Button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>

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
      <div className={cn("choice-grid", choices.length === 2 && "choice-grid-two")}>
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
  if (value === "EXPIRED" || value === "DAMAGED") return <CircleAlert aria-hidden="true" />;
  if (value === "CANCEL") return <Ban aria-hidden="true" />;
  if (value === "EXCHANGE") return <Repeat2 aria-hidden="true" />;
  if (value === "RETURN") return <Truck aria-hidden="true" />;
  return <MoreHorizontal aria-hidden="true" />;
}

function PhotoPicker({ capture, icon, label, multiple, onChange }: { capture?: "environment"; icon: ReactNode; label: string; multiple?: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="photo-picker"><span>{icon}{label}</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" capture={capture} multiple={multiple} onChange={onChange} /></label>;
}
