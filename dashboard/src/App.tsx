import { GlassDashboard } from './layouts/GlassDashboard';
import { KitchenDashboard } from './layouts/KitchenDashboard';
// import { OfficeDashboard } from './layouts/OfficeDashboard'; // Classic layout

type LayoutType = 'glass' | 'kitchen' | 'office';

function getLayout(): LayoutType {
  // Check URL param first: ?layout=kitchen
  const urlParams = new URLSearchParams(window.location.search);
  const layoutParam = urlParams.get('layout') as LayoutType | null;
  if (layoutParam && ['glass', 'kitchen', 'office'].includes(layoutParam)) {
    return layoutParam;
  }

  // Then check environment variable
  const envLayout = import.meta.env.VITE_LAYOUT as LayoutType | undefined;
  if (envLayout && ['glass', 'kitchen', 'office'].includes(envLayout)) {
    return envLayout;
  }

  // Default to kitchen (Fire TV doesn't handle query params well)
  return 'kitchen';
}

function App() {
  const layout = getLayout();

  switch (layout) {
    case 'kitchen':
      return <KitchenDashboard />;
    case 'office':
      // return <OfficeDashboard />;
      return <GlassDashboard />; // Fallback until Office is rebuilt
    case 'glass':
    default:
      return <GlassDashboard />;
  }
}

export default App;
