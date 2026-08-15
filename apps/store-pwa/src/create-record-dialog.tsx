import { zodResolver } from "@hookform/resolvers/zod";
import { KPH_OPTIONS, type KphKind } from "@coopfood-kph/kph-rules";
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
import { Camera, Images, ScanLine } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  detectedDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Nhập ngày theo dd/mm/yyyy"),
  barcode: z.string().max(50),
  productName: z.string().max(200),
  quantity: z.string().refine((value) => Number(value) > 0, "Số lượng phải lớn hơn 0"),
  unit: z.enum(["EA", "kg"]),
  condition: z.string().min(1),
  resolution: z.string().min(1),
  detectedBy: z.string().min(1, "Thiếu người phát hiện").max(100),
}).refine(({ barcode, productName }) => barcode.trim() || productName.trim(), {
  message: "Nhập SKU/UPC hoặc tên hàng hóa",
  path: ["productName"],
});

type FormData = z.infer<typeof schema>;

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

export function CreateRecordDialog({ kind, onOpenChange, onSaved, open }: CreateRecordDialogProps) {
  const options = KPH_OPTIONS[kind ?? "TPCN"];
  const [photoCount, setPhotoCount] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      detectedDate: "15/08/2026",
      barcode: "",
      productName: "",
      quantity: "1",
      unit: "EA",
      condition: options.defaultCondition,
      resolution: options.defaultResolution,
      detectedBy: "Nguyễn Minh An",
    },
  });

  useEffect(() => {
    if (!kind) return;
    const next = KPH_OPTIONS[kind];
    reset({
      detectedDate: "15/08/2026",
      barcode: "",
      productName: "",
      quantity: "1",
      unit: "EA",
      condition: next.defaultCondition,
      resolution: next.defaultResolution,
      detectedBy: "Nguyễn Minh An",
    });
    setPhotoCount(0);
    setPhotoError("");
  }, [kind, reset]);

  if (!kind) return null;

  const submit = handleSubmit(() => {
    if (photoCount < 1) {
      setPhotoError("Cần chọn ít nhất 1 ảnh minh chứng");
      return;
    }
    onSaved(kind);
    onOpenChange(false);
  });

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const nextCount = event.target.files?.length ?? 0;
    if (nextCount > 3) {
      setPhotoCount(0);
      setPhotoError("Mỗi phiếu chỉ được tối đa 3 ảnh");
      event.target.value = "";
      return;
    }
    setPhotoCount(nextCount);
    setPhotoError(nextCount > 0 ? "" : "Cần chọn ít nhất 1 ảnh minh chứng");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="create-description">
        <DialogHeader>
          <DialogTitle>Tạo phiếu · {kindLabels[kind]}</DialogTitle>
          <DialogDescription id="create-description">
            Bản foundation dùng dữ liệu tổng hợp; chưa gửi dữ liệu sang backend.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-6" onSubmit={submit}>
          <section className="grid gap-4" aria-labelledby="detection-heading">
            <h3 id="detection-heading" className="border-b border-line pb-2 text-sm font-black uppercase tracking-wide text-brand">
              Thông tin phát hiện
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ngày phát hiện" htmlFor="detected-date" required error={errors.detectedDate?.message}>
                <Input id="detected-date" inputMode="numeric" placeholder="dd/mm/yyyy" {...register("detectedDate")} />
              </Field>
              <Field label="Người phát hiện" htmlFor="detected-by" required error={errors.detectedBy?.message}>
                <Input id="detected-by" {...register("detectedBy")} />
              </Field>
            </div>
            <Field label="SKU/UPC" htmlFor="barcode" hint="Lookup thật sẽ trả 0 hoặc 1 sản phẩm.">
              <div className="flex gap-2">
                <Input id="barcode" autoComplete="off" {...register("barcode")} />
                <Button type="button" size="icon" variant="secondary" aria-label="Quét SKU hoặc UPC">
                  <ScanLine aria-hidden="true" size={20} />
                </Button>
              </div>
            </Field>
            <Field label="Tên hàng hóa" htmlFor="product-name" error={errors.productName?.message}>
              <Input id="product-name" {...register("productName")} />
            </Field>
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <Field label="Số lượng" htmlFor="quantity" required error={errors.quantity?.message}>
                <Input id="quantity" inputMode="decimal" {...register("quantity")} />
              </Field>
              <Field label="Đơn vị" htmlFor="unit">
                <select id="unit" className="h-11 rounded-[10px] border border-line bg-white px-3" {...register("unit")}>
                  <option value="EA">EA</option>
                  <option value="kg">kg</option>
                </select>
              </Field>
            </div>
          </section>

          <ChoiceGroup legend="Tình trạng" name="condition" register={register} choices={options.conditions} />
          <ChoiceGroup legend="Biện pháp xử lý" name="resolution" register={register} choices={options.resolutions} />

          <section className="grid gap-3" aria-labelledby="photos-heading">
            <div>
              <h3 id="photos-heading" className="text-sm font-black text-ink">Ảnh minh chứng <span className="text-danger">*</span></h3>
              <p className="mt-1 text-xs text-ink-muted">Tối thiểu 1, tối đa 3 ảnh. Backend giữ riêng bản gốc và bản đóng dấu.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid min-h-24 cursor-pointer place-items-center rounded-xl border border-dashed border-brand/40 bg-brand-soft p-3 text-center text-sm font-bold text-brand">
                <span className="grid gap-1 place-items-center"><Camera aria-hidden="true" />Chụp ảnh</span>
                <input className="sr-only" type="file" accept="image/jpeg,image/png" capture="environment" onChange={selectPhotos} />
              </label>
              <label className="grid min-h-24 cursor-pointer place-items-center rounded-xl border border-dashed border-brand/40 bg-brand-soft p-3 text-center text-sm font-bold text-brand">
                <span className="grid gap-1 place-items-center"><Images aria-hidden="true" />Chọn ảnh</span>
                <input className="sr-only" type="file" accept="image/jpeg,image/png" multiple onChange={selectPhotos} />
              </label>
            </div>
            <p className={cn("text-xs font-semibold", photoError ? "text-danger" : "text-ink-muted")} role={photoError ? "alert" : "status"}>
              {photoError || (photoCount ? `Đã chọn ${photoCount} ảnh` : "Chưa chọn ảnh")}
            </p>
          </section>

          <footer className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Lưu phiếu demo</Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ChoiceGroupProps = {
  legend: string;
  name: "condition" | "resolution";
  register: UseFormRegister<FormData>;
  choices: readonly { value: string; label: string; tone: string }[];
};

function ChoiceGroup({ choices, legend, name, register }: ChoiceGroupProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-black text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {choices.map((choice) => (
          <label key={choice.value} className={cn(
            "choice-card grid min-h-16 cursor-pointer place-items-center rounded-xl border border-line bg-white px-2 text-center text-sm font-bold",
            `choice-${choice.tone}`,
          )}>
            <input className="sr-only" type="radio" value={choice.value} {...register(name)} />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
