const LEVELS = [
  {
    date: '2022-02-05',
    title: 'El día de los 3 gatos',
    description: '',
    goal: 5,
    shootingStarSpeed: 2,
    shootingStarInterval: 2000,
    maxActiveStars: 2,
  },
  {
    date: '2025-09-06',
    title: 'El día de la boda',
    description: '',
    goal: 6,
    shootingStarSpeed: 2.3,
    shootingStarInterval: 1800,
    maxActiveStars: 2,
  },
  {
    date: '2026-01-03',
    title: 'El día del cumpleaños',
    description: '',
    goal: 7,
    shootingStarSpeed: 2.6,
    shootingStarInterval: 1700,
    maxActiveStars: 3,
  },
  {
    date: '2026-01-10',
    title: 'El día del violín',
    description: '',
    goal: 8,
    shootingStarSpeed: 2.8,
    shootingStarInterval: 1600,
    maxActiveStars: 3,
  },
  {
    date: '2026-01-11',
    title: 'El día cósmico',
    description: '',
    goal: 9,
    shootingStarSpeed: 3.0,
    shootingStarInterval: 1500,
    maxActiveStars: 3,
  },
  {
    date: '2026-01-31',
    title: 'El día del robo',
    description: '',
    goal: 10,
    shootingStarSpeed: 3.2,
    shootingStarInterval: 1400,
    maxActiveStars: 3,
  },
  {
    date: '2026-02-14',
    title: 'El día de la memoria',
    description: '',
    goal: 11,
    shootingStarSpeed: 3.5,
    shootingStarInterval: 1300,
    maxActiveStars: 4,
  },
  {
    date: '2026-03-15',
    title: 'El día del bloqueo',
    description: '',
    goal: 12,
    shootingStarSpeed: 3.7,
    shootingStarInterval: 1200,
    maxActiveStars: 4,
  },
  {
    date: '2026-03-28',
    title: 'El día de la tv',
    description: '',
    goal: 13,
    shootingStarSpeed: 4.0,
    shootingStarInterval: 1100,
    maxActiveStars: 4,
  },
  {
    date: '2026-04-03',
    title: 'El día de la aventura',
    description: '',
    goal: 14,
    shootingStarSpeed: 3.5,
    shootingStarInterval: 1300,
    maxActiveStars: 3,
    isFinalLevel: true,
  },
];

function formatDateSpanish(dateStr) {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} de ${months[month - 1]} de ${year}`;
}
