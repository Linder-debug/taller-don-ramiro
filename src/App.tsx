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
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const store = useStore();

  useEffect(() => {
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    return () => authSubscription.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      {passwordRecovery && <ResetPasswordScreen onDone={() => setPasswordRecovery(false)} />}
      {!passwordRecovery && role === 'home' && <Landing onPick={(nextRole) => setRole(nextRole)} />}
      {!passwordRecovery && role === 'client' && <ClientView store={store} />}
      {!passwordRecovery && (role === 'mechanic' || role === 'admin') && (
        <WorkshopGate role={role} store={store} onBack={() => setRole('home')} />
      )}

      {!passwordRecovery && role !== 'home' && (
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
  const [mode, setMode] = useState<'login' | 'recover'>('login');
  const [recoverSent, setRecoverSent] = useState(false);

  const loadWorkshopData = store.loadWorkshopData;

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
      await loadWorkshopData();
      if (active) setAuthorized(true);
    };

    void checkSession();
    return () => { active = false; };
  }, [loadWorkshopData]);

  useEffect(() => {
    if (!checking) return undefined;
    const timer = window.setTimeout(() => {
      setChecking(false);
      setError((current) => current || 'La verificación está tardando más de lo normal. Revisa tu conexión, vuelve a ingresar tus datos y pulsa "Entrar al taller" para reintentar.');
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [checking]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setChecking(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setChecking(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/',
      });
      if (resetError) throw resetError;
      setRecoverSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar el correo de recuperación.');
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

  if (mode === 'recover') {
    return (
      <div className="min-h-screen bg-slate-950 px-5 py-12 text-white">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wrench className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Taller Don Ramiro</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold">Recuperar contraseña</h1>
          {recoverSent ? (
            <div className="mt-6 space-y-4 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
              <p className="text-sm text-slate-300">
                Si el correo está registrado, te llegará un enlace para crear una nueva contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <button
                type="button"
                onClick={() => { setMode('login'); setRecoverSent(false); setError(''); }}
                className="min-h-12 w-full rounded-xl border border-slate-700 px-4 py-3 text-base font-bold text-slate-300 hover:bg-slate-800"
              >
                Volver a ingresar
              </button>
            </div>
          ) : (
            <form onSubmit={requestReset} className="mt-6 space-y-4 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
              <p className="text-sm text-slate-400">Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
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
              {error && <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm font-medium text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={checking}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white transition active:scale-95 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Enviar enlace de recuperación
              </button>
              <button type="button" onClick={() => { setMode('login'); setError(''); }} className="min-h-12 w-full rounded-xl border border-slate-700 px-4 py-3 text-base font-bold text-slate-300 hover:bg-slate-800">
                Volver a ingresar
              </button>
            </form>
          )}
        </div>
      </div>
    );
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
          <button
            type="button"
            onClick={() => { setMode('recover'); setError(''); }}
            className="w-full text-center text-sm font-semibold text-emerald-400 hover:text-emerald-300"
          >
            ¿Olvidaste tu contraseña?
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

function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submitNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      window.history.replaceState(null, '', window.location.pathname);
      setDone(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wrench className="h-6 w-6" />
          <span className="text-sm font-bold uppercase tracking-wider">Taller Don Ramiro</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold">Nueva contraseña</h1>
        {done ? (
          <div className="mt-6 space-y-4 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <p className="text-sm text-slate-300">Tu contraseña se actualizó. Ingresa de nuevo con tu correo y la nueva contraseña.</p>
            <button
              type="button"
              onClick={onDone}
              className="min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-bold text-white hover:bg-emerald-500"
            >
              Ir a ingresar
            </button>
          </div>
        ) : (
          <form onSubmit={submitNewPassword} className="mt-6 space-y-4 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <label className="block text-sm font-semibold text-slate-300">
              Nueva contraseña
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border-2 border-slate-700 bg-slate-800 p-3 text-base text-white outline-none focus:border-emerald-500"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-300">
              Repite la contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border-2 border-slate-700 bg-slate-800 p-3 text-base text-white outline-none focus:border-emerald-500"
              />
            </label>
            {error && <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm font-medium text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white transition active:scale-95 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Guardar nueva contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

