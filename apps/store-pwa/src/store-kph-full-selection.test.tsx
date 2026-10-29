import {fireEvent,render,screen} from "@testing-library/react";
import {useState} from "react";
import {describe,expect,it,vi} from "vitest";
import {StoreKphList} from "./store-kph-list";
import {mockRecords} from "./store-app-mock";

describe("KPH full-item selection",()=>{
  it.each([false,true])("selects the entire item without opening detail, desktop=%s",desktop=>{
    const active=vi.fn(), record=mockRecords[0]!;
    function List(){const[selected,setSelected]=useState<string[]>([]);return <StoreKphList desktop={desktop} visible={[record]} groupByDate={false} selectionMode selection={selected} setSelection={setSelected} setActive={active}/>}
    const view=render(<List/>),row=view.container.querySelector('[data-record-id]')!;
    const checkbox=screen.getByRole('checkbox',{name:`Chọn ${record.productName}`});
    fireEvent.click(row);expect(checkbox).toBeChecked();
    fireEvent.click(screen.getByRole('button',{name:`Chọn phiếu ${record.productName}`}));expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);expect(checkbox).toBeChecked();
    const metadata=desktop?row.querySelector('td:nth-child(3)')!:row.querySelector('.store-ticket-foot')!;
    fireEvent.click(metadata);expect(checkbox).not.toBeChecked();
    expect(active).not.toHaveBeenCalled();
  });
});
