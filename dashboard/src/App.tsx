import { KitchenDashboard } from './layouts/KitchenDashboard';
import { OfficeDashboard } from './layouts/OfficeDashboard';

type LayoutType = 'kitchen' | 'office';

function getLayout(): LayoutType {
  // Check URL param first: ?layout=kitchen
  const urlParams = new URLSearchParams(window.location.search);
  const layoutParam = urlParams.get('layout') as LayoutType | null;
  if (layoutParam && ['kitchen', 'office'].includes(layoutParam)) {
    return layoutParam;
  }

  // Then check environment variable
  const envLayout = import.meta.env.VITE_LAYOUT as LayoutType | undefined;
  if (envLayout && ['kitchen', 'office'].includes(envLayout)) {
    return envLayout;
  }

  // Default to kitchen (Fire TV doesn't handle query params well)
  return 'kitchen';
}

function App() {
  const layout = getLayout();

  switch (layout) {
    case 'office':
      return <OfficeDashboard />;
    case 'kitchen':
    default:
      return <KitchenDashboard />;
  }
}

export default App;
