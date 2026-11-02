import type { AppData } from '@/types';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const hoursAhead = (h: number) => new Date(now + h * 3600_000).toISOString();

export const seedData: AppData = {
  clients: [
    { id: 'c1', name: 'María Fernández', phone: '809-555-0142' },
    { id: 'c2', name: 'José Ramírez', phone: '809-555-0177' },
    { id: 'c3', name: 'Lucía Martínez', phone: '829-555-0190' },
    { id: 'c4', name: 'Carlos Pichardo', phone: '829-555-0233' },
  ],
  mechanics: [
    { id: 'm1', name: 'Don Ramiro', specialty: 'Motor y transmisión' },
    { id: 'm2', name: 'El Chino', specialty: 'Frenos y suspensión' },
    { id: 'm3', name: 'Miguel', specialty: 'Electricidad' },
  ],
  orders: [
    {
      id: 'o1',
      code: 'TR-1042',
      clientId: 'c1',
      clientName: 'María Fernández',
      vehicle: { make: 'Toyota', model: 'Corolla', year: 2018, plate: 'A123456', color: 'Plateado' },
      mechanicId: 'm2',
      mechanicName: 'El Chino',
      status: 'en_reparacion',
      complaint: 'El carro juerza al frenar y hace ruido en la rueda delantera izquierda.',
      createdAt: hoursAgo(6),
      quotes: [],
      approvals: [],
      history: [
        { status: 'recibido', at: hoursAgo(6), actor: 'Don Ramiro' },
        { status: 'diagnostico', at: hoursAgo(5), note: 'Pastillas de freno gastadas, posible disco rayado.', actor: 'El Chino' },
        { status: 'en_reparacion', at: hoursAgo(3), note: 'Cambiando pastillas y revisando discos.', actor: 'El Chino' },
      ],
    },
    {
      id: 'o2',
      code: 'TR-1043',
      clientId: 'c2',
      clientName: 'José Ramírez',
      vehicle: { make: 'Honda', model: 'Civic', year: 2015, plate: 'B778899', color: 'Negro' },
      mechanicId: 'm1',
      mechanicName: 'Don Ramiro',
      status: 'esperando_aprobacion',
      complaint: 'Se calienta en subida y pierde refrigerante.',
      createdAt: hoursAgo(26),
      quotes: [
        {
          id: 'q1',
          detail:
            'Al revisar encontramos que la bomba de agua tiene fuga y la correa de distribución está cuarteada. Hay que cambiar bomba de agua, correa y tensor. Trabajo garantizado por 6 meses.',
          amount: 8500,
          createdAt: hoursAgo(2),
        },
      ],
      approvals: [
        {
          id: 'a1',
          quoteId: 'q1',
          quoteDetail:
            'Al revisar encontramos que la bomba de agua tiene fuga y la correa de distribución está cuarteada. Hay que cambiar bomba de agua, correa y tensor. Trabajo garantizado por 6 meses.',
          amount: 8500,
          clientName: 'José Ramírez',
          status: 'pendiente',
        },
      ],
      history: [
        { status: 'recibido', at: hoursAgo(26), actor: 'Don Ramiro' },
        { status: 'diagnostico', at: hoursAgo(24), note: 'Fuga en bomba de agua. Correa cuarteada.', actor: 'Don Ramiro' },
        { status: 'esperando_aprobacion', at: hoursAgo(2), note: 'Cotización enviada al cliente.', actor: 'Don Ramiro' },
      ],
    },
    {
      id: 'o3',
      code: 'TR-1044',
      clientId: 'c3',
      clientName: 'Lucía Martínez',
      vehicle: { make: 'Hyundai', model: 'Accent', year: 2020, plate: 'C332211', color: 'Blanco' },
      mechanicId: 'm3',
      mechanicName: 'Miguel',
      status: 'listo_para_recoger',
      complaint: 'No enciende. Posible problema eléctrico.',
      createdAt: hoursAgo(48),
      quotes: [
        {
          id: 'q2',
          detail: 'El alternador está dañado y la batería ya no carga. Recomendamos cambiar el alternador. La batería se puede salvar con una carga.',
          amount: 6200,
          createdAt: hoursAgo(30),
        },
      ],
      approvals: [
        {
          id: 'a2',
          quoteId: 'q2',
          quoteDetail: 'El alternador está dañado y la batería ya no carga. Recomendamos cambiar el alternador. La batería se puede salvar con una carga.',
          amount: 6200,
          clientName: 'Lucía Martínez',
          status: 'aprobada',
          decidedAt: hoursAgo(20),
        },
      ],
      history: [
        { status: 'recibido', at: hoursAgo(48), actor: 'Don Ramiro' },
        { status: 'diagnostico', at: hoursAgo(46), note: 'Alternador dañado.', actor: 'Miguel' },
        { status: 'esperando_aprobacion', at: hoursAgo(30), note: 'Cotización enviada.', actor: 'Miguel' },
        { status: 'reparacion_adicional', at: hoursAgo(19), note: 'Aprobada por la cliente. Alternador cambiado.', actor: 'Miguel' },
        { status: 'listo_para_recoger', at: hoursAgo(4), note: 'Prueba realizada. Enciende perfecto.', actor: 'Miguel' },
      ],
    },
  ],
};
