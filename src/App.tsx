import { AppMenu } from "./components/AppMenu";
import { HomeIcon, SettingsIcon, UserIcon } from "./assets/Icons";

export default function App() {
  return (
    <AppMenu basename="/menu">
      <AppMenu.Group path="/menu-item-1" icon={HomeIcon} label="Menu item 1">
        <AppMenu.Item to="/menu-item-1/sub-menu-item-1" label="Sub item 1" />
        <AppMenu.Item to="/menu-item-1/sub-menu-item-2" label="Sub item 2" />
        <AppMenu.Item to="/menu-item-1/sub-menu-item-3" label="Sub item 3" />
      </AppMenu.Group>

      <AppMenu.Item to="/menu-item-2" icon={UserIcon} label="Menu item 2" />
      <AppMenu.Item to="/menu-item-3" icon={SettingsIcon} label="Menu item 3" />
    </AppMenu>
  );
}
