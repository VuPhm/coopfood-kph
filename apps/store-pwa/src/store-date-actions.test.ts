import { describe, it, expect } from "vitest";
import { acknowledgeDateLot, dateLotKphSeed, reactivateDueDateLots } from "./store-date-actions";
import { mockDateLots } from "./store-app-mock";
const lot = mockDateLots[0]!;
describe("DATE reminder and KPH handoff rules", () => {
  it.each([[1, "2026-12-31", "2027-01-01"], [7, "2024-02-25", "2024-03-03"]] as const)("schedules %s calendar days across boundaries", (days,today,due) => {
    const next=acknowledgeDateLot(lot,today,days);
    expect(next).toMatchObject({status:"acknowledged",remindOn:due});
    expect(reactivateDueDateLots([next],today)[0]?.status).toBe("acknowledged");
    expect(reactivateDueDateLots([next],due)[0]?.status).toBe("open");
    expect(next.status).toBe("acknowledged");
  });
  it("keeps resolved lots resolved and legacy acknowledgements without an invented schedule",()=>{
    const resolved={...lot,status:"resolved" as const,remindOn:"2026-10-07" as const,kphRecordId:"kph-1"};
    expect(acknowledgeDateLot(resolved,"2026-10-08",1)).toBe(resolved);
    expect(reactivateDueDateLots([resolved,{...lot,status:"acknowledged"}],"2026-10-08").map(l=>l.status)).toEqual(["resolved","acknowledged"]);
  });
  it("uses explicit product kind and keeps leading-zero SKU and lot/date snapshot",()=>{
    expect(dateLotKphSeed(lot,"2026-10-08")).toMatchObject({kind:"TPTS",seed:{skuCode:"0011730",barcode:"29123415005",unit:"kg",condition:"EXPIRED",note:expect.stringContaining("C24-118")}});
    expect(dateLotKphSeed(mockDateLots[4]!,"2026-10-07")).toMatchObject({kind:"TPCN",seed:{skuCode:"0008421",condition:"NEAR_EXPIRY"}});
  });
  it("does not infer product, supplier or kind for an unknown SKU or malformed dates",()=>{
    expect(dateLotKphSeed({...lot,sku:"000000",date:"2026-02-31"},"2026-10-08")).toMatchObject({kind:null,seed:{barcode:"",skuCode:"000000",supplier:"",note:expect.stringContaining("2026-02-31")}});
  });
});
