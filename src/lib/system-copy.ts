import type { Lang } from './translations';

type SystemCopy = {
  notFound: { eyebrow: string; title: string; body: string; button: string };
  error: { eyebrow: string; title: string; body: string; retry: string; contact: string; reference: string };
  globalError: { title: string; bodyBefore: string; bodyAfter: string; retry: string };
  loading: string;
};

// Record<Lang, …> enforces en/es/pt parity at compile time.
export const systemCopy: Record<Lang, SystemCopy> = {
  en: {
    notFound: { eyebrow: '404 · A NEW DIRECTION', title: 'Let’s get you connected.', body: 'We couldn’t find this page. Explore the Chamber or get in touch with our team.', button: 'Back to the Chamber' },
    error: { eyebrow: 'LET’S TRY AGAIN', title: 'We couldn’t load this page.', body: 'Please try again, or contact the Chamber if you need help. Your next connection is still within reach.', retry: 'Try again', contact: 'Contact the Chamber', reference: 'Reference' },
    globalError: { title: 'Let’s get you connected again.', bodyBefore: 'This page couldn’t load. Please try again or contact the Chamber at', bodyAfter: '.', retry: 'Try again' },
    loading: 'Connecting you to what’s next…',
  },
  es: {
    notFound: { eyebrow: '404 · UN NUEVO RUMBO', title: 'Vamos a conectarte.', body: 'No encontramos esta página. Explora la Cámara o comunícate con nuestro equipo.', button: 'Volver a la Cámara' },
    error: { eyebrow: 'VOLVAMOS A INTENTARLO', title: 'No pudimos cargar esta página.', body: 'Inténtalo de nuevo o comunícate con la Cámara si necesitas ayuda. Tu próxima conexión sigue al alcance.', retry: 'Intentar de nuevo', contact: 'Contactar a la Cámara', reference: 'Referencia' },
    globalError: { title: 'Volvamos a conectarte.', bodyBefore: 'No se pudo cargar esta página. Inténtalo de nuevo o comunícate con la Cámara en', bodyAfter: '.', retry: 'Intentar de nuevo' },
    loading: 'Conectándote con lo que sigue…',
  },
  pt: {
    notFound: { eyebrow: '404 · UM NOVO RUMO', title: 'Vamos conectar você.', body: 'Não encontramos esta página. Conheça a Câmara ou fale com a nossa equipe.', button: 'Voltar para a Câmara' },
    error: { eyebrow: 'VAMOS TENTAR DE NOVO', title: 'Não conseguimos carregar esta página.', body: 'Tente novamente ou fale com a Câmara se precisar de ajuda. Sua próxima conexão continua ao seu alcance.', retry: 'Tentar novamente', contact: 'Falar com a Câmara', reference: 'Referência' },
    globalError: { title: 'Vamos conectar você de novo.', bodyBefore: 'Não foi possível carregar esta página. Tente novamente ou fale com a Câmara pelo e-mail', bodyAfter: '.', retry: 'Tentar novamente' },
    loading: 'Conectando você ao que vem a seguir…',
  },
};
