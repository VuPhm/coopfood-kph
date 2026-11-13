import type { ComponentProps } from "react";
import { Button } from "@coopfood-kph/ui";
import { StoreSearchField } from "./store-search-field";
import "./store-workspace-search.css";

/** Same search geometry for KPH and DATE; each workspace owns query semantics. */
export function StoreWorkspaceSearch({ busy = false, ...field }: ComponentProps<typeof StoreSearchField> & { busy?: boolean }) {
  return <form className="store-workspace-search" onSubmit={event => { event.preventDefault(); field.onSearch?.(field.value); }}>
    <StoreSearchField {...field} maxLength={128} />
    <Button type="submit" aria-label="Tìm mã hàng" aria-busy={busy}>Tìm</Button>
  </form>;
}
