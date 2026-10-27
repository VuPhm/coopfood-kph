import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateWorkspace } from "./store-date-workspace";
import { mockDateLots } from "./store-app-mock";
import type { CreatedRecordDraft } from "./create-record-dialog";
import { processEvidencePhoto } from "./image-processing";
vi.mock("./image-processing",()=>({processEvidencePhoto:vi.fn()}));
function Workspace({save}: {save:(draft:CreatedRecordDraft)=>Promise<string>}) {
  const [lots,setLots]=useState([mockDateLots[5]!]);
  return <><DateWorkspace lots={lots} onLotsChange={setLots} today="2026-11-16" onCreateKph={save} /><output aria-label="Trạng thái lô nguồn">{lots[0]?.status}</output></>;
}
async function openKph(save=vi.fn<(_:CreatedRecordDraft)=>Promise<string>>().mockResolvedValue("kph-created")) {
  render(<Workspace save={save}/>);
  fireEvent.click(screen.getByRole("button",{name:/Bánh quy/}));
  fireEvent.click(screen.getByRole("button",{name:"Xử lý"}));
  await screen.findByRole("textbox",{name:"Tên hàng hóa"});
  return save;
}
async function reviewKph() {
  fireEvent.change(screen.getByLabelText("Chọn ảnh"),{target:{files:[new File(["synthetic"],"evidence.jpg",{type:"image/jpeg"})]}});
  await screen.findByText(/Đã xử lý 1\/3 ảnh/);
  fireEvent.click(screen.getByRole("button",{name:"Xem lại"}));
  await screen.findByRole("button",{name:"Gửi phiếu"});
}
beforeEach(()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2026-11-16T08:00:00+07:00"));vi.mocked(processEvidencePhoto).mockResolvedValue({blob:new Blob(["stamped"],{type:"image/jpeg"}),capturedAt:new Date(),width:1,height:1});});
afterEach(()=>vi.useRealTimers());
beforeEach(() => vi.stubGlobal("matchMedia", () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()})));
afterEach(() => vi.unstubAllGlobals());

describe("DATE actions use real KPH form",()=>{
  it("does not acknowledge before a reminder is confirmed and supports a week",()=>{
    const save=vi.fn();render(<Workspace save={save}/>);
    fireEvent.click(screen.getByRole("button",{name:/Bánh quy/}));fireEvent.click(screen.getByRole("button",{name:"Ghi nhận"}));
    fireEvent.click(screen.getByRole("radio",{name:/1 tuần/}));
    fireEvent.click(screen.getByRole("button",{name:"Hủy"}));
    expect(document.querySelector('.store-date-lot [data-processing-status]')).toHaveAttribute('data-processing-status','open');
    fireEvent.click(screen.getByRole("button",{name:"Ghi nhận"}));fireEvent.click(screen.getByRole("radio",{name:/1 tuần/}));fireEvent.click(screen.getByRole("button",{name:"Hẹn báo lại"}));

    expect(screen.getByRole("button",{name:/Báo lại 23\/11\/2026/})).toBeInTheDocument();expect(save).not.toHaveBeenCalled();
  });
  it("cancelling a seeded form leaves DATE open and saves nothing",async()=>{
    const save=await openKph();expect(screen.getByRole('textbox',{name:'Mã SKU / UPC'})).toHaveValue('8936000123456');
    expect(screen.getByRole('radio',{name:'Hết HSD'})).toBeChecked();
    expect((screen.getByLabelText('Ghi chú') as HTMLTextAreaElement).value).toContain('A24-255');
    fireEvent.click(screen.getByRole('button',{name:'Đóng'}));
    expect(document.querySelector('.store-date-lot [data-processing-status]')).toHaveAttribute('data-processing-status','open');expect(save).not.toHaveBeenCalled();
  });
  it("keeps the lot open on failed save; retry resolves only after success",async()=>{
    const save=await openKph(vi.fn<(_:CreatedRecordDraft)=>Promise<string>>().mockRejectedValueOnce(new Error('Lưu chưa thành công')).mockResolvedValue('kph-created'));
    await reviewKph();fireEvent.click(screen.getByRole('button',{name:'Gửi phiếu'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Lưu chưa thành công');expect(document.querySelector('.store-date-lot [data-processing-status]')).toHaveAttribute('data-processing-status','open');
    fireEvent.click(screen.getByRole('button',{name:'Gửi phiếu'}));await waitFor(()=>expect(document.querySelector('.store-create-screen')).not.toBeInTheDocument());
    expect(screen.queryByRole('button',{name:/Bánh quy/})).not.toBeInTheDocument();expect(screen.getByLabelText('Trạng thái lô nguồn')).toHaveTextContent('resolved');
    expect(save.mock.calls[0]?.[0]).toMatchObject({skuCode:'0008421',kind:'TPCN',photos:[expect.any(Object)]});
  });
  it("rejects a different product instead of resolving the source lot",async()=>{
    const save=await openKph();const barcode=screen.getByRole('textbox',{name:'Mã SKU / UPC'});fireEvent.change(barcode,{target:{value:'29123415005'}});fireEvent.blur(barcode);
    await screen.findByDisplayValue('Cải thìa VietGAP 500 g');await reviewKph();fireEvent.click(screen.getByRole('button',{name:'Gửi phiếu'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mã hàng trên phiếu phải khớp lô DATE');expect(save).not.toHaveBeenCalled();
  });
});
