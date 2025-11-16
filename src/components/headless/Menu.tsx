import { useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import { MenuContext } from "./MenuContext";
import type { MenuContextShape } from "./MenuContext";
import { useMenu } from "./useMenu";

interface MenuProps {
  activePath: string;
  onChangeActive: (p: string) => void;
  children: ReactNode;
}

/**
 * Вычисляет автоматически открываемые группы в меню,
 * исходя из текущего активного пути.
 * Например, для пути "/a/b/c" вернёт открытые группы "/a" и "/a/b"
 */
function computeAutoOpenGroups(activePath: string): Record<string, boolean> {
  const segments = activePath.split("/").filter(Boolean);
  const openGroups: Record<string, boolean> = {};
  let accumulated = "";
  for (let i = 0; i < segments.length - 1; i++) {
    accumulated += "/" + segments[i];
    openGroups[accumulated] = true;
  }
  return openGroups;
}

export function Menu({ activePath, onChangeActive, children }: MenuProps) {
  // состояние для открытия/закрытия пользовательских групп
  const [userOpenGroups, setUserOpenGroups] = useState<Record<string, boolean>>(
    {}
  );
  // состояние для открытия/закрытия меню
  const [expanded, setExpanded] = useState(true);

  // вычисляем автоматически открываемые группы
  const autoOpenGroups = useMemo(
    () => computeAutoOpenGroups(activePath),
    [activePath]
  );

  // состояние для открытия/закрытия пользовательских групп и автоматических
  const openGroups = { ...autoOpenGroups, ...userOpenGroups };

  // Синхронизируем (удаляем пользовательские группы не относящиеся к активному пути)
  useEffect(() => {
    // Используем Promise.resolve().then(...) чтобы избежать
    // синхронного вызова setState в эффекте и избежать каскадных рендеров
    Promise.resolve().then(() => {
      setUserOpenGroups((prev) => {
        const filtered: Record<string, boolean> = {};
        let changed = false;

        for (const key in prev) {
          // Оставляем только те пользовательские группы,
          // которые принадлежат текущему активному пути
          if (activePath.startsWith(key)) {
            filtered[key] = true;
          } else {
            changed = true;
          }
        }

        // Возвращаем обновлённый объект, если что-то изменилось,
        // иначе возвращаем старое состояние, чтобы не вызывать лишний ререндер
        if (changed) {
          return filtered;
        }
        return prev;
      });
    });
  }, [activePath]);

  // Обработчик изменения состояния группы
  function toggleGroup(id: string) {
    setUserOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  const contextValue: MenuContextShape = {
    activePath,
    onChangeActive,
    expanded,
    setExpanded,
    openGroups,
    toggleGroup,
  };

  return (
    <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>
  );
}


// компонент для открытия/закрытия меню
function ToggleMenuButton({ children, className }: { children: ReactNode, className?: string }) {
  const { expanded, setExpanded } = useMenu();

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      aria-label={expanded ? "Collapse menu" : "Expand menu"}
      aria-expanded={expanded}
      className={className}
    >
      {children}
    </button>
  );
}

Menu.ToggleMenuButton = ToggleMenuButton;
