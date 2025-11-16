// выносим хук useMenu в отдельный модуль для удобства

import { useContext } from "react";
import { MenuContext } from "./MenuContext";

export const useMenu = () => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("Menu components must be inside <Menu>");
  return ctx;
};
