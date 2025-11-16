import React, { createContext, useContext, useEffect, useRef } from "react";
import type { JSX, ReactNode, SVGProps } from "react";
import { useLocation, useNavigate, BrowserRouter } from "react-router-dom";
import classNames from "classnames";
import { useMenu } from "./headless/useMenu";
import { Menu } from "./headless/Menu";
import { ArrowsIcon } from "../assets/Icons";

interface AppMenuProps {
  basename?: string;
  children: ReactNode;
}

// Контекст для определения, находится ли элемент внутри группы,
// чтобы переепределять стили menuItem
const InGroupContext = createContext({ isInGroup: false, path: "" });

// Хук для обработки клика вне элемента
function useOutsideClick(callback: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [callback]);

  return ref;
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
    const target = p === "/" ? basename || "/" : `${basename}${p}`;
    navigate(target);
  }

  return (
    <Menu activePath={activePath} onChangeActive={onChangeActive}>
      <SidebarWrapper>{children}</SidebarWrapper>
    </Menu>
  );
}

function SidebarWrapper({ children }: { children: ReactNode }) {
  const { expanded } = useMenu();

  return (
    <div
      className={classNames(
        "flex fixed md:relative bottom-0 md:flex-col md:h-screen w-full md:w-fit transition-all duration-300 ease-in-out group/sidebar p-2",
        "bg-gray-50 border-t border-gray-200 md:border-t-0 md:border-r",
        {
          "md:min-w-48": expanded,
        }
      )}
    >
      <div className="flex md:flex-col gap-0.5 grow relative justify-center md:justify-start">
        {children}
      </div>

      <Menu.ToggleMenuButton className="p-2 w-fit text-left mt-auto cursor-pointer bg-white hidden md:block md:hover:bg-blue-100 rounded-md">
        <ArrowsIcon
          className={classNames("size-5", { "rotate-180": expanded })}
        />
      </Menu.ToggleMenuButton>
    </div>
  );
}

/* Group component */
interface GroupProps {
  path: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  label: string;
  children: ReactNode;
}

function AppMenuGroup({ path, icon: Icon, label, children }: GroupProps) {
  const { activePath, openGroups, toggleGroup, expanded } = useMenu();

  const isOpen = Boolean(openGroups[path]);
  const isActive = activePath.startsWith(path);

  // Обработчик закрытия группы при клике вне элемента
  const handleCloseGroup = () => {
    // Если группа открыта и ширина экрана меньше 768px, то закрываем группу
    if (isOpen && window.innerWidth < 768) {
      toggleGroup(path);
    }
  };

  const groupRef = useOutsideClick(handleCloseGroup);

  return (
    <div ref={groupRef} className="relative group/item flex flex-col gap-0.5">
      <button
        onClick={() => toggleGroup(path)}
        className={classNames(
          "flex flex-col md:flex-row items-center gap-2 p-2 cursor-pointer w-full text-left md:hover:bg-blue-50  rounded-md",
          {
            "bg-blue-100 md:hover:bg-blue-100 text-blue-600": isActive,
          }
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{Icon && <Icon className={"size-6"} />}</span>
        <span className={classNames({ "md:hidden": !expanded })}>{label}</span>
      </button>

      {/* Если меню развернуто — показываем обычное вложенное меню */}
      {expanded && isOpen && (
        <div className="pl-6 hidden md:flex flex-col gap-0.5">{children}</div>
      )}

      {/* Универсальный попап - работает и на мобилке и на десктопе */}
      <div
        className={classNames(
          // Базовые стили
          "fixed md:absolute left-0 bottom-[88px] md:bottom-auto md:top-0 md:left-full",
          "z-50 md:rounded md:shadow-lg",
          "md:bg-white border-t md:border border-gray-200",
          "w-screen md:w-fit md:whitespace-nowrap",
          // Управление видимостью
          {
            // Мобильная версия
            "hidden md:block": !isOpen, // скрыто на мобилке если не открыто, но может быть видно на десктопе
            "block md:hidden": isOpen, // показано на мобилке если открыто

            // Десктоп версия при свернутом меню
            "md:hidden": expanded || !isOpen, // скрыто на десктопе если меню развернуто
            "md:group-hover/item:block": !expanded, // показано при ховере на десктопе если меню свернуто
          }
        )}
      >
        <div className="p-2 font-semibold">{label}</div>
        <InGroupContext.Provider value={{ isInGroup: true, path }}>
          <div className="p-2">{children}</div>
        </InGroupContext.Provider>
      </div>
    </div>
  );
}

/* Item component */
interface ItemProps {
  to: string;
  label: string;
  icon?: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

function AppMenuItem({ to, label, icon: Icon }: ItemProps) {
  const { activePath, onChangeActive, expanded, toggleGroup } = useMenu();
  const { isInGroup, path } = useContext(InGroupContext); // Узнаем, находимся ли внутри группы

  const isActive = activePath === to;

  // Обработчик нажатия на элемент
  // используем toggleGroup, чтобы переключить состояние группы (скрыть группу)
  function handleItemClick(
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  ) {
    e.preventDefault();
    if (isInGroup) toggleGroup(path);
    onChangeActive(to);
  }

  return (
    <div className="relative group/item">
      <div
        onClick={handleItemClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleItemClick(e);
          }
        }}
        className={classNames(
          "flex flex-col md:flex-row items-center gap-2 p-2 cursor-pointer md:hover:bg-blue-50 rounded-md",
          {
            "bg-blue-100 md:hover:bg-blue-100 text-blue-600": isActive,
            "items-start": isInGroup,
          }
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {Icon && <Icon className={"size-6"} />}
        <span className={classNames({ "md:hidden": !expanded && !isInGroup })}>
          {label}
        </span>
      </div>

      {/* Tooltip при свернутом меню */}
      {!isInGroup && (
        <div
          className={classNames(
            "absolute top-0 left-full ml-1 whitespace-nowrap z-50 bg-blue-50 rounded shadow-lg px-2 py-1",
            "hidden md:group-hover/item:block", // Показывается при hover
            {
              "md:hidden": expanded, // Скрыт когда меню развернуто
              "md:group-hover/item:hidden": expanded,
            }
          )}
        >
          {label}
        </div>
      )}
    </div>
  );
}

/* добавляем именованные поля для удобства использования */
AppMenu.Group = AppMenuGroup;
AppMenu.Item = AppMenuItem;

export default AppMenu;
