import React, { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { ColorPicker } from './components/ColorPicker';
import { Notifications } from './components/Notifications';
import { AdminPanel } from './components/AdminPanel';
import { Menu } from './components/Menu';
import { useStore } from './store';

function App() {
  const loadInitialPixels = useStore(state => state.loadInitialPixels);
  const user = useStore(state => state.user);

  useEffect(() => {
    // Check if we have Supabase credentials
    const hasCredentials = !!import.meta.env.VITE_SUPABASE_URL && 
                         !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (hasCredentials) {
      loadInitialPixels();
    }
  }, [loadInitialPixels]);

  return (
    <div className="min-h-screen">
      <Canvas />
      <ColorPicker />
      <Notifications />
      <Menu />
      {user && <AdminPanel />}
    </div>
  );
}

export default App;