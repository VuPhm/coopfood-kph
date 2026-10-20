import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "./cn";
import "./dropdown.css";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export function DropdownMenuContent({ className, ...props }: ComponentProps<typeof MenuPrimitive.Content>) {
  return <MenuPrimitive.Portal><MenuPrimitive.Content align="end" sideOffset={6} collisionPadding={12} className={cn("ui-dropdown-surface ui-menu-content", className)} {...props} /></MenuPrimitive.Portal>;
}
export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof MenuPrimitive.Item>) {
  return <MenuPrimitive.Item className={cn("ui-dropdown-option", className)} {...props} />;
}
export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("ui-dropdown-label", className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("ui-dropdown-separator", className)} {...props} />;
}
