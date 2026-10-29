import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./cn";
import "./dropdown.css";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectProps = Omit<ComponentProps<typeof SelectPrimitive.Trigger>, "value" | "onChange"> & {
  value: string; onValueChange: (value: string) => void; options: readonly SelectOption[];
  contentClassName?: string; name?: string; placeholder?: string;
};

// Prefix every value so an empty application value (e.g. All months) remains a valid item.
export function Select({ value, onValueChange, options, className, contentClassName, name, disabled, placeholder, ...props }: SelectProps) {
  return <SelectPrimitive.Root value={options.some(option => option.value === value) ? `value:${value}` : ""} onValueChange={next => onValueChange(next.slice(6))} {...(disabled !== undefined ? { disabled } : {})}>
    {name ? <input type="hidden" name={name} value={value} disabled={disabled} /> : null}
    <SelectPrimitive.Trigger data-value={value} className={cn("ui-select-trigger", className)} {...props}>
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon className="ui-select-chevron"><ChevronDown size={18} aria-hidden="true" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content className={cn("ui-dropdown-surface ui-select-content", contentClassName)} position="popper" sideOffset={6} collisionPadding={12}>
      <SelectPrimitive.ScrollUpButton className="ui-select-scroll"><ChevronUp size={18} aria-hidden="true" /></SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="ui-select-viewport">
        {options.map(option => <SelectPrimitive.Item data-option-value={option.value} key={option.value} value={`value:${option.value}`} {...(option.disabled !== undefined ? { disabled: option.disabled } : {})} className="ui-dropdown-option">
          <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
          <SelectPrimitive.ItemIndicator className="ui-dropdown-check"><Check size={18} aria-hidden="true" /></SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>)}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="ui-select-scroll"><ChevronDown size={18} aria-hidden="true" /></SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
