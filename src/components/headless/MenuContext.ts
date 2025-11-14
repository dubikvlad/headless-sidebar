// MenuContext.tsx
import { createContext } from "react";

export interface MenuContextShape {
  activePath: string;
  onChangeActive: (p: string) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  openGroups: Record<string, boolean>;
  toggleGroup: (id: string) => void;
}

export const MenuContext = createContext<MenuContextShape | null>(null);
