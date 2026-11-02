import { useEffect, useState } from 'react';
import { LockKeyhole, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { Landing } from '@/views/Landing';
import { ClientView } from '@/views/ClientView';
import { MechanicView } from '@/views/MechanicView';
import { AdminView } from '@/views/AdminView';

type Role = 'home' | 'client' | 'mechanic' | 'admin';

type WorkshopGateProps = {
  role: 'mechanic' | 'admin';
  store: ReturnType<typeof useStore>;
  onBack: () => void;
};

function App() {
  const [role, setRole] = useState<Role>(() => window.location.hash.startsWith('#/seguimiento') ? 'client' : 'home');
  const store = useStore();

  return (
    <div className="min-h-screen">
      {role === 'home' && <Landing onPick={(nextRole) => setRole(nextRole)} />}
      {role === 'client' && <ClientView store={store} />}
      {(role === 'mechanic' || role === 'admin') && (
        <WorkshopGate role={role} store={store} onBack={() => setRole('home')} />
      )}

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

function WorkshopGate({ role, store, onBack }: WorkshopGateProps) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (data.session) {
          await authorize(data.session.user.id);
        }
      } catch (sessionError) {
        if (active) setError(sessionError instanceof Error ? sessionError.message : 'No se pudo validar el acceso.');
      } finally {
        if (active) setChecking(false);
      }
    };

    const authorize = async (userId: string) => {
      const { data: workshopUser, error: accessError } = await supabase
        .from('workshop_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (accessError) throw accessError;
      if (!workshopUser) {
        await supabase.auth.signOut();
        throw new Error('Sin acceso al taller');
      }
      await store.loadWorkshopData();
      if (active) setAuthorized(true);
    };

    void checkSession();
    return () => { active = false; };
  }, [store]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setChecking(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (!data.user) throw new Error('No se pudo iniciar sesión.');
      const { data: workshopUser, error: accessError } = await supabase
        .from('workshop_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();
      if (accessError) throw accessError;
      if (!workshopUser) {
        await supabase.auth.signOut();
        throw new Error('Sin acceso al taller');
      }
      await store.loadWorkshopData();
      setAuthorized(true);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'No se pudo iniciar sesión.');
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return <WorkshopLoading />;
  }

  if (authorized) {
    return role === 'mechanic' ? <MechanicView store={store} /> : <AdminView store={store} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wrench className="h-6 w-6" />
          <span className="text-sm font-bold uppercase tracking-wider">Taller Don Ramiro</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold">Acceso al taller</h1>
        <p className="mt-2 text-slate-400">Ingresa con tu correo y contraseña para continuar.</p>
        <form onSubmit={signIn} className="mt-6 space-y-4 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <label className="block text-sm font-semibold text-slate-300">
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border-2 border-slate-700 bg-slate-800 p-3 text-base text-white outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-300">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border-2 border-slate-700 bg-slate-800 p-3 text-base text-white outline-none focus:border-emerald-500"
            />
          </label>
          {error && <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm font-medium text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={checking}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white transition active:scale-95 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole className="h-5 w-5" /> Entrar al taller
          </button>
          <button type="button" onClick={onBack} className="min-h-12 w-full rounded-xl border border-slate-700 px-4 py-3 text-base font-bold text-slate-300 hover:bg-slate-800">
            Volver al inicio
          </button>
        </form>
      </div>
    </div>
  );
}

function WorkshopLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-center text-white">
      <div>
        <Wrench className="mx-auto h-8 w-8 animate-pulse text-emerald-400" />
        <p className="mt-3 font-semibold text-slate-300">Verificando acceso al taller…</p>
      </div>
    </div>
  );
}

export default App;
