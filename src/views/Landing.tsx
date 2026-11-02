import { Wrench, Search, UserCog, ShieldCheck } from 'lucide-react';

type Role = 'client' | 'mechanic' | 'admin';

export function Landing({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-5 pb-4 pt-14">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wrench className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Taller de Don Ramiro</span>
          </div>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight">Tu carro,<br />siempre en buenas manos.</h1>
          <p className="mt-3 text-slate-400">Sigue el estado de tu vehículo en tiempo real, sin llamar al taller.</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">¿Cómo quieres entrar?</p>
        <div className="space-y-3">
          <RoleCard
            icon={Search}
            title="Soy cliente"
            desc="Ver el estado de mi carro y aprobar cotizaciones."
            accent="bg-emerald-600"
            onClick={() => onPick('client')}
          />
          <RoleCard
            icon={UserCog}
            title="Soy mecánico"
            desc="Actualizar el estado de las órdenes asignadas."
            accent="bg-amber-500"
            onClick={() => onPick('mechanic')}
          />
          <RoleCard
            icon={ShieldCheck}
            title="Administración"
            desc="Crear órdenes, asignar mecánicos y ver cotizaciones."
            accent="bg-slate-700"
            onClick={() => onPick('admin')}
          />
        </div>

        <div className="mt-10 rounded-xl bg-slate-900 p-4 text-center">
          <p className="text-xs text-slate-500">
            Prototipo · datos guardados localmente en este navegador.
          </p>
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  icon: Icon, title, desc, accent, onClick,
}: {
  icon: React.ElementType; title: string; desc: string; accent: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl bg-slate-900 p-4 text-left ring-1 ring-slate-800 transition active:scale-[0.98] hover:ring-emerald-600"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-6 w-6 text-white" />
      </span>
      <span className="flex-1">
        <span className="block text-lg font-bold text-white">{title}</span>
        <span className="block text-sm text-slate-400">{desc}</span>
      </span>
      <span className="text-slate-600">→</span>
    </button>
  );
}
