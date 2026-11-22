import { useState, type ComponentProps } from "react";

import { DateWorkspace } from "./store-date-workspace";
import { StoreBarcodeLookup } from "./store-barcode-lookup";
import type { MockDateLot } from "./store-app-mock";

type LookupProps = ComponentProps<typeof StoreBarcodeLookup>;

/** DATE rows remain local to this mounted user/store session; they are never persisted. */
export function StoreOnlineDate({ active, suspended = false, ...lookup }: LookupProps & { active: boolean; suspended?: boolean }) {
  const [lots, setLots] = useState<MockDateLot[]>([]);
  return active ? <DateWorkspace mode="session" lots={lots} onLotsChange={setLots} suspended={suspended}
    lookupContent={<StoreBarcodeLookup {...lookup} suspended={suspended} />} /> : null;
}
