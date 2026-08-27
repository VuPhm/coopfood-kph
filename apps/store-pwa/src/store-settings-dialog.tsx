import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
} from "@coopfood-kph/ui";
import { CircleDashed, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { storeProfileSchema, type StoreProfile } from "./store-profile";

type StoreSettingsDialogProps = {
  open: boolean;
  profile: StoreProfile;
  onOpenChange: (open: boolean) => void;
  onSaved: (profile: StoreProfile) => Promise<void> | void;
};

export function StoreSettingsDialog({ onOpenChange, onSaved, open, profile }: StoreSettingsDialogProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<StoreProfile>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: profile,
  });

  useEffect(() => {
    if (!open) return;
    reset(profile);
    setSaveError("");
  }, [open, profile, reset]);

  const submit = handleSubmit(async (values) => {
    setSaving(true);
    setSaveError("");
    try {
      await onSaved(storeProfileSchema.parse(values));
      onOpenChange(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không thể lưu thiết lập cửa hàng");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className="settings-dialog-content w-[min(40rem,calc(100%-2rem))] max-w-[40rem] p-0 sm:p-0" aria-describedby="store-settings-description">
        <DialogHeader className="create-dialog-header">
          <DialogTitle className="create-dialog-title">Thiết lập cửa hàng</DialogTitle>
          <DialogDescription id="store-settings-description" className="sr-only">
            Chỉnh thông tin cửa hàng và người dùng hiện tại; trường có dấu sao là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form className="create-dialog-form" onSubmit={submit}>
          <section className="form-section" aria-labelledby="store-section-title">
            <h3 id="store-section-title"><span>1.</span> Thông tin cửa hàng</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tên cửa hàng" htmlFor="store-name" required error={errors.storeName?.message}>
                <div className="store-name-control">
                  <span aria-hidden="true">Co.op Food</span>
                  <Input id="store-name" className="store-name-input" autoComplete="organization" placeholder="Tên cửa hàng" aria-invalid={Boolean(errors.storeName)} {...register("storeName")} />
                </div>
              </Field>
              <Field label="Mã cửa hàng" htmlFor="store-code" required error={errors.storeCode?.message}>
                <Input id="store-code" type="text" inputMode="numeric" maxLength={4} autoComplete="off" placeholder="Ví dụ: 0123" aria-invalid={Boolean(errors.storeCode)} {...register("storeCode")} />
              </Field>
            </div>
          </section>

          <section className="form-section" aria-labelledby="actor-section-title">
            <h3 id="actor-section-title"><span>2.</span> Thông tin nhân sự</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset className="sm:col-span-2">
                <legend className="mb-1 text-sm font-bold text-ink">Vai trò</legend>
                <div className="choice-grid store-role-grid">
                  <label className="choice-card">
                    <input className="sr-only" type="radio" value="" {...register("role")} />
                    <span className="choice-icon"><CircleDashed aria-hidden="true" /></span>
                    <span>Chưa chọn</span>
                  </label>
                  <label className="choice-card choice-blue">
                    <input className="sr-only" type="radio" value="STAFF" {...register("role")} />
                    <span className="choice-icon"><UserRound aria-hidden="true" /></span>
                    <span>Nhân viên</span>
                  </label>
                  <label className="choice-card choice-green">
                    <input className="sr-only" type="radio" value="STORE_MANAGER" {...register("role")} />
                    <span className="choice-icon"><ShieldCheck aria-hidden="true" /></span>
                    <span>CHT</span>
                  </label>
                </div>
              </fieldset>
              <Field label="Họ tên" htmlFor="employee-name" error={errors.fullName?.message}>
                <Input id="employee-name" autoComplete="name" placeholder="Nhập họ tên" aria-invalid={Boolean(errors.fullName)} {...register("fullName")} />
              </Field>
              <Field label="Mã nhân viên" htmlFor="employee-code" error={errors.employeeCode?.message}>
                <Input id="employee-code" type="text" autoComplete="off" placeholder="Nhập mã nhân viên" aria-invalid={Boolean(errors.employeeCode)} {...register("employeeCode")} />
              </Field>
            </div>
          </section>

          {saveError ? <p className="action-dialog-error" role="alert">{saveError}</p> : null}
          <footer className="create-dialog-footer">
            <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Đang lưu</> : "Lưu thiết lập"}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
