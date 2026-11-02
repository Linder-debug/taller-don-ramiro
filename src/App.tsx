import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Landing } from '@/views/Landing';
import { ClientView } from '@/views/ClientView';
import { MechanicView } from '@/views/MechanicView';
import { AdminView } from '@/views/AdminView';

type Role = 'home' | 'client' | 'mechanic' | 'admin';

function App() {
  const [role, setRole] = useState<Role>('home');
  const store = useStore();

  return (
    <div className="min-h-screen">
      {role === 'home' && <Landing onPick={(r) => setRole(r)} />}
      {role === 'client' && <ClientView store={store} />}
      {role === 'mechanic' && <MechanicView store={store} />}
      {role === 'admin' && <AdminView store={store} />}

      {role !== 'home' && (
        <button
          onClick={() => setRole('home')}
          className="fixed bottom-4 right-4 z-40 rounded-full bg-slate-900/90 px-4 py-2.5 text-xs font-bold text-white shadow-lg ring-1 ring-white/10 backdrop-blur hover:bg-slate-800"
        >
          Inicio
        </button>
      )}
    </div>
  );
}

export default App;
