import { KPH_OPTIONS, type ChoiceTone } from "@coopfood-kph/kph-rules";
import type { ListLabelTone } from "@coopfood-kph/ui";
import { Apple, Biohazard, Check, PackageOpen, Wind } from "lucide-react";
import { getKphLabelPresentation } from "./store-kph-label";

// Choice colors identify an option, while list-label tones describe a recorded state.
// Preserve the established option palette without changing the domain's option matrix.
const tones: Record<ChoiceTone, ListLabelTone> = { red: "danger", orange: "warning", green: "success", blue: "info", gray: "neutral" };
const icons = { TORN_PACKAGING: PackageOpen, VACUUM_LEAK: Wind, BRUISED_WATERLOGGED: Apple, ROTTEN_MOLDY: Biohazard };
const sets = Object.values(KPH_OPTIONS);
const palettes = {
  condition: new Map(sets.flatMap(set => set.conditions.map(choice => [choice.value as string, tones[choice.tone]] as const))),
  resolution: new Map(sets.flatMap(set => set.resolutions.map(choice => [choice.value as string, tones[choice.tone]] as const))),
};
export function getKphChoicePresentation(kind: "condition" | "resolution", value: string) {
  const { icon } = getKphLabelPresentation(kind, value);
  return { tone: palettes[kind].get(value) ?? "neutral", icon: kind === "condition" && Object.hasOwn(icons, value) ? icons[value as keyof typeof icons] : icon };
}

// Shared content keeps loading/ready choice geometry identical; inputs belong to the form.
export function KphChoiceContent({ kind, value, label }: { kind: "condition" | "resolution"; value: string; label: string }) {
  const { icon: Icon } = getKphChoicePresentation(kind, value);
  return <>
    <span className="choice-icon" aria-hidden="true"><Icon /></span>
    <span className="choice-text">{label}</span>
    <span className="choice-indicator" aria-hidden="true"><Check /></span>
  </>;
}
