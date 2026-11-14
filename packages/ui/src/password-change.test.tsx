import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PasswordChangeDialog } from "./password-change";

function fill(next = ' synthetic new password ') {
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: ' current password ' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), { target: { value: next } });
}
function Harness({ submit = vi.fn().mockResolvedValue(undefined), changed = vi.fn() }) {
  const [open, setOpen] = useState(true);
  return <><button onClick={() => setOpen(true)}>Mở lại</button><PasswordChangeDialog open={open} onOpenChange={setOpen} onSubmit={submit} onChanged={changed} /></>;
}
describe('shared password change', () => {
  it('clears credentials and visibility after an explicit cancel and reopen', async () => {
    render(<Harness />); fill();
    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Mở lại' }));
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveValue('');
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('');
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveAttribute('type', 'password');
  });
  it('preserves whitespace and accepts 15 Unicode codepoints without truncation', async () => {
    const submit = vi.fn().mockResolvedValue(undefined), changed = vi.fn();
    render(<Harness submit={submit} changed={changed} />);
    const password = ' ' + '🔑'.repeat(13) + ' ';
    fill(password);
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(submit).toHaveBeenCalledExactlyOnceWith(' current password ', password);
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('');
  });
  it('blocks duplicate sends and closing while pending, then retains a failed draft', async () => {
    let reject!: (error: Error) => void;
    const submit = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    render(<Harness submit={submit} />); fill();
    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(submit).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => reject(new Error('Không thể đổi mật khẩu lúc này.')));
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể đổi mật khẩu lúc này.');
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue(' synthetic new password ');
  });
  it('does not send invalid length or mismatched confirmation', () => {
    const submit = vi.fn(); render(<Harness submit={submit} />);
    fill('short'); fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('15 đến 64');
    fill(); fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), { target: { value: 'different confirmation' } });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('chưa khớp'); expect(submit).not.toHaveBeenCalled();
  });
});
