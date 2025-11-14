// AppMenu.tsx
import React, {
  isValidElement,
  cloneElement,
  useState,
  useCallback,
} from "react";
import type { ReactNode, ReactElement as RE } from "react";
import { useLocation, useNavigate, BrowserRouter } from "react-router-dom";
import { useMenu } from "./headless/useMenu";
import { Menu } from "./headless/Menu";

interface AppMenuProps {
  basename?: string;
  children: ReactNode;
}

export function AppMenu({ basename, children }: AppMenuProps) {
  // Router обёртка вынесена наружу, чтобы headless-часть не знала про Router
  return (
    <BrowserRouter>
      <AppMenuComponent basename={basename}>{children}</AppMenuComponent>
    </BrowserRouter>
  );
}

function AppMenuComponent({ basename = "", children }: AppMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();


  // убираем basename из pathname если он там — иначе оставляем полный путь
  const activePath = location.pathname.startsWith(basename)
    ? location.pathname.slice(basename.length) || "/"
    : location.pathname;

  function onChangeActive(p: string) {
    // если p === "/", то навигируем на базовый путь (без лишнего слеша)
    const target = p === "/" ? (basename || "/") : `${basename}${p}`;
    navigate(target);
  }

  return (
    <Menu activePath={activePath} onChangeActive={onChangeActive}>
      <SidebarWrapper>{children}</SidebarWrapper>
    </Menu>
  );
}

/* SidebarWrapper и injection props */
interface InjectedProps {
  expanded: boolean;
  hoveredGroup: string | null;
  setHoveredGroup: (id: string | null) => void;
  hoveredItem: string | null;
  setHoveredItem: (id: string | null) => void;
}

function SidebarWrapper({ children }: { children: ReactNode }) {
  const { expanded } = useMenu();

  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Аккуратно обрабатываем разные виды детей (фрагменты, массивы)
  const childrenWithProps = React.Children.map(children, (child) => {
    if (isValidElement(child)) {
      // Не насилуем типы — даём TS знать, что мы добавляем дополнительные props
      return cloneElement(child as RE<unknown>, {
        expanded,
        hoveredGroup,
        setHoveredGroup,
        hoveredItem,
        setHoveredItem,
      } as Partial<InjectedProps>);
    }
    return child;
  });

  return (
    <div
      className={`flex flex-col h-screen border-r bg-white transition-all duration-300 ease-in-out ${
        expanded ? "min-w-48" : "w-12"
      }`}
    >
      <div className="flex flex-col grow relative">{childrenWithProps}</div>

      <Menu.ToggleMenuButton
        className="p-2 border-t w-full text-left mt-auto cursor-pointer bg-white"
        
      >
        {expanded ? "←" : "→"}
      </Menu.ToggleMenuButton>
    </div>
  );
}

/* Group component */
interface GroupProps {
  path: string;
  icon: ReactNode;
  label: string;
  children: ReactNode;

  expanded?: boolean;
  hoveredGroup?: string | null;
  setHoveredGroup?: (id: string | null) => void;
}

export function AppMenuGroup({
  path,
  icon,
  label,
  children,
  expanded = true,
  hoveredGroup,
  setHoveredGroup,
}: GroupProps) {
  const { activePath, openGroups, toggleGroup } = useMenu();

  const isOpen = Boolean(openGroups[path]);
  const isActive = activePath.startsWith(path);
  const isHovered = hoveredGroup === path;

  const onMouseEnter = useCallback(() => {
    if (!expanded && setHoveredGroup) setHoveredGroup(path);
  }, [expanded, setHoveredGroup, path]);

  const onMouseLeave = useCallback(() => {
    if (!expanded && setHoveredGroup) setHoveredGroup(null);
  }, [expanded, setHoveredGroup]);

  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        onClick={() => toggleGroup(path)}
        className={`flex items-center gap-2 p-2 cursor-pointer w-full text-left ${
          isActive ? "font-bold text-blue-600" : ""
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{icon}</span>
        {expanded && <span>{label}</span>}
      </button>

      {/* Если меню развернуто — показываем обычное вложенное меню */}
      {expanded && isOpen && <div className="pl-6">{children}</div>}

      {/* Если меню свернуто и группа ховерится — показываем абсолютный popup */}
      {!expanded && isHovered && (
        <div
          className="absolute top-0 left-full z-50 w-48 bg-white border rounded shadow-lg"
          onMouseEnter={() => setHoveredGroup && setHoveredGroup(path)}
          onMouseLeave={() => setHoveredGroup && setHoveredGroup(null)}
        >
          <div className="p-2 font-semibold">{label}</div>
          <div className="p-2">{children}</div>
        </div>
      )}
    </div>
  );
}

/* Item component */
interface ItemProps {
  to: string;
  label: string;
  icon?: ReactNode;

  expanded?: boolean;
  hoveredItem?: string | null;
  setHoveredItem?: (id: string | null) => void;
}

export function AppMenuItem({
  to,
  label,
  icon,
  expanded = true,
  hoveredItem,
  setHoveredItem,
}: ItemProps) {
  const { activePath, onChangeActive } = useMenu();

  const isActive = activePath === to;
  const isHovered = hoveredItem === to;

  const onMouseEnter = () => {
    if (!expanded && setHoveredItem) setHoveredItem(to);
  };
  const onMouseLeave = () => {
    if (!expanded && setHoveredItem) setHoveredItem(null);
  };

  return (
    <div className="relative">
      <div
        onClick={() => onChangeActive(to)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onChangeActive(to);
          }
        }}
        className={`flex items-center gap-2 p-2 cursor-pointer ${isActive ? "font-semibold bg-blue-100" : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        <span>{icon}</span>
        {expanded && <span>{label}</span>}
      </div>

      {/* Tooltip при свернутом меню */}
      {!expanded && isHovered ? (
        <div
          className="absolute top-0 left-full ml-1 whitespace-nowrap z-50 bg-white border rounded shadow-lg px-2 py-1"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

/* добавляем именованные поля для удобства использования */
AppMenu.Group = AppMenuGroup;
AppMenu.Item = AppMenuItem;

export default AppMenu;
