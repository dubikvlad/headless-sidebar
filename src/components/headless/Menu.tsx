// import { useState, useMemo, useEffect } from "react";
// import type { ReactNode } from "react";
// import { MenuContext } from "./MenuContext";
// import type { MenuContextShape } from "./MenuContext";

// interface MenuProps {
//   activePath: string;
//   onChangeActive: (p: string) => void;  // Функция для смены активного пути
//   children: ReactNode;
// }

// /**
//  * Вычисляет автоматически открываемые группы в меню,
//  * исходя из текущего активного пути.
//  * Например, для пути "/a/b/c" вернёт открытые группы "/a" и "/a/b"
//  */
// function computeAutoOpenGroups(activePath: string): Record<string, boolean> {
//   const segments = activePath.split("/").filter(Boolean);
//   const openGroups: Record<string, boolean> = {};

//   let accumulated = "";
//   // Открываем все промежуточные группы, кроме последнего сегмента,
//   // так как последний обычно — сам пункт меню
//   for (let i = 0; i < segments.length - 1; i++) {
//     accumulated += "/" + segments[i];
//     openGroups[accumulated] = true;
//   }
//   return openGroups;
// }

// export function Menu({ activePath, onChangeActive, children }: MenuProps) {
//   // Состояние пользовательских открытых групп (открывает/закрывает вручную)
//   const [userOpenGroups, setUserOpenGroups] = useState<Record<string, boolean>>({});

//   // Вычисляем автоматически открываемые группы на основе активного пути
//   // Используем useMemo для оптимизации, чтобы не пересчитывать без нужды
//   const autoOpenGroups = useMemo(() => computeAutoOpenGroups(activePath), [activePath]);

//   // При смене activePath фильтруем userOpenGroups,
//   // чтобы убрать группы, которые не относятся к текущему пути
//   useEffect(() => {
//     // Используем Promise.resolve().then(...) чтобы избежать
//     // синхронного вызова setState в эффекте и избежать каскадных рендеров
//     Promise.resolve().then(() => {
//       setUserOpenGroups((prev) => {
//         const filtered: Record<string, boolean> = {};
//         let changed = false;

//         for (const key in prev) {
//           // Оставляем только те пользовательские группы,
//           // которые принадлежат текущему активному пути
//           if (activePath.startsWith(key)) {
//             filtered[key] = true;
//           } else {
//             changed = true;
//           }
//         }

//         // Возвращаем обновлённый объект, если что-то изменилось,
//         // иначе возвращаем старое состояние, чтобы не вызывать лишний ререндер
//         if (changed) {
//           return filtered;
//         }
//         return prev;
//       });
//     });
//   }, [activePath]);

//   // Объединяем автоматически открытые группы и пользовательские.
//   // Пользовательские имеют приоритет, так как накладываются поверх autoOpenGroups
//   const openGroups = { ...autoOpenGroups, ...userOpenGroups };

//   // Функция для переключения состояния конкретной группы (открыть/закрыть)
//   function toggleGroup(id: string) {
//     setUserOpenGroups((prev) => ({
//       ...prev,
//       [id]: !prev[id],
//     }));
//   }

//   // Управление состоянием раскрытия всего меню (свернуто/развернуто)
//   const [expanded, setExpanded] = useState(true);

//   // Значения и методы, которые передаются через контекст меню
//   const contextValue: MenuContextShape = {
//     activePath,
//     onChangeActive,
//     expanded,
//     setExpanded,
//     openGroups,
//     toggleGroup,
//   };

//   // Оборачиваем дочерние элементы в провайдер контекста,
//   // чтобы в любом месте меню можно было получать доступ к этим данным
//   return <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>;
// }

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
  const [userOpenGroups, setUserOpenGroups] = useState<Record<string, boolean>>(
    {}
  );
  const autoOpenGroups = useMemo(
    () => computeAutoOpenGroups(activePath),
    [activePath]
  );

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

  const openGroups = { ...autoOpenGroups, ...userOpenGroups };

  function toggleGroup(id: string) {
    setUserOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  const [expanded, setExpanded] = useState(true);

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
