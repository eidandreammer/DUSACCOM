import { resources } from './content';
import type { Lang } from './translations';

export type ResourceSlug = (typeof resources)[number]['slug'];
type Section = { heading: string; body: string };
type ResourceText = { category: string; title: string; description: string; sections: Section[] };
type Texts = Record<ResourceSlug, ResourceText>;

const en: Texts = Object.fromEntries(resources.map(r => [r.slug, { category: r.category, title: r.title, description: r.description, sections: r.sections.map(s => ({ ...s })) }])) as Texts;

const es: Texts = {
  'better-business-networking': {
    category: 'CREAR CONEXIONES', title: 'Una mejor forma de hacer networking empresarial',
    description: 'Empieza con curiosidad, construye sobre intereses compartidos y haz que el seguimiento cuente.',
    sections: [
      { heading: 'Empieza con curiosidad', body: 'Pregunta qué está construyendo la otra persona, qué está aprendiendo y cómo sería para ella una conexión útil. Escucha antes de presentar tu propio negocio.' },
      { heading: 'Presenta tu negocio con claridad', body: 'Explica a quién ayudas y cómo en una o dos frases. Un ejemplo concreto ayuda a que entiendan tu trabajo y te recuerden después.' },
      { heading: 'Haz un seguimiento con propósito', body: 'Haz referencia a algo concreto de lo que hablaron. Ofrece un recurso útil o propón una conversación breve. Pide permiso antes de compartir los datos de contacto de otra persona.' },
      { heading: 'Construye con el tiempo', body: 'Mantén el contacto, celebra los avances de los demás y busca maneras de ser útil. Las relaciones sólidas crecen con acciones constantes y atentas.' },
    ],
  },
  'preparing-for-a-new-market': {
    category: 'DESARROLLO EMPRESARIAL', title: 'Prepara tu negocio para un nuevo mercado',
    description: 'Cinco preguntas que conviene hacerte antes de dar tu próximo paso al otro lado de la frontera.',
    sections: [
      { heading: '¿Quién es tu cliente?', body: 'Identifica a las personas u organizaciones específicas a las que esperas servir. Habla con posibles clientes en lugar de asumir que la demanda se traslada igual de un mercado a otro.' },
      { heading: '¿Qué debe adaptarse?', body: 'Considera el idioma, las expectativas, la prestación del servicio y cómo atenderás a los clientes en el lugar.' },
      { heading: '¿Cómo vas a entregar?', body: 'Traza los pasos prácticos para cumplir un pedido o prestar un servicio. Identifica las dependencias, los socios y los costos que requieren más investigación.' },
      { heading: '¿Quién puede verificar los requisitos?', body: 'Identifica asesores locales calificados que puedan confirmar los requisitos que aplican a tu negocio.' },
      { heading: '¿Cuál es un primer paso manejable?', body: 'Fija una meta de investigación o de prueba piloto antes de asumir un gran compromiso. Usa lo que aprendas para decidir tu siguiente paso.' },
    ],
  },
  'a-community-in-your-corner': {
    category: 'COMUNIDAD', title: 'El valor de tener una comunidad de tu lado',
    description: 'Cómo el conocimiento compartido y las presentaciones significativas pueden impulsar un negocio.',
    sections: [
      { heading: 'Un lugar para preguntar', body: 'Las conversaciones con otros emprendedores pueden revelar preguntas que no habías considerado y señalarte recursos que vale la pena explorar.' },
      { heading: 'Presentaciones con contexto', body: 'Una presentación bien pensada explica por qué una conversación puede ser útil. Sé claro sobre lo que buscas y respeta el tiempo de todos.' },
      { heading: 'Una oportunidad de contribuir', body: 'Comparte una experiencia, da la bienvenida a un nuevo empresario o haz una presentación con permiso. Una comunidad sólida deja espacio para que todos aporten.' },
      { heading: 'Raíces compartidas, nuevas posibilidades', body: 'Para los líderes empresariales dominicanos y estadounidenses, el entendimiento cultural puede ser el punto de partida de relaciones entre mercados y generaciones.' },
    ],
  },
};

const pt: Texts = {
  'better-business-networking': {
    category: 'CRIANDO CONEXÕES', title: 'Uma forma melhor de fazer networking empresarial',
    description: 'Comece com curiosidade, construa sobre interesses em comum e faça o acompanhamento valer a pena.',
    sections: [
      { heading: 'Comece com curiosidade', body: 'Pergunte o que a outra pessoa está construindo, o que está aprendendo e como seria uma conexão útil para ela. Escute antes de apresentar o seu próprio negócio.' },
      { heading: 'Apresente-se com clareza', body: 'Explique quem você ajuda e como em uma ou duas frases. Um exemplo concreto ajuda a pessoa a entender o seu trabalho e a lembrar de você depois.' },
      { heading: 'Faça o acompanhamento com propósito', body: 'Mencione algo específico sobre o que vocês conversaram. Ofereça um recurso útil ou sugira uma conversa rápida. Peça permissão antes de compartilhar os dados de contato de alguém.' },
      { heading: 'Construa ao longo do tempo', body: 'Mantenha contato, celebre o progresso dos outros e procure formas de ser útil. Relacionamentos sólidos crescem com atitudes constantes e atenciosas.' },
    ],
  },
  'preparing-for-a-new-market': {
    category: 'DESENVOLVIMENTO DE NEGÓCIOS', title: 'Prepare o seu negócio para um novo mercado',
    description: 'Cinco perguntas para se fazer antes de dar o próximo passo além das fronteiras.',
    sections: [
      { heading: 'Quem é o seu cliente?', body: 'Identifique as pessoas ou organizações específicas que você pretende atender. Converse com possíveis clientes em vez de presumir que a demanda se repete igual de um mercado para outro.' },
      { heading: 'O que precisa ser adaptado?', body: 'Considere o idioma, as expectativas, a entrega do serviço e como você vai atender os clientes localmente.' },
      { heading: 'Como você vai entregar?', body: 'Mapeie os passos práticos para cumprir um pedido ou prestar um serviço. Identifique dependências, parceiros e custos que exigem mais pesquisa.' },
      { heading: 'Quem pode confirmar os requisitos?', body: 'Identifique consultores locais qualificados que possam confirmar os requisitos aplicáveis ao seu negócio.' },
      { heading: 'Qual é um primeiro passo viável?', body: 'Defina uma meta de pesquisa ou de projeto piloto antes de assumir um grande compromisso. Use o que você aprender para decidir o próximo passo.' },
    ],
  },
  'a-community-in-your-corner': {
    category: 'COMUNIDADE', title: 'O valor de ter uma comunidade ao seu lado',
    description: 'Como o conhecimento compartilhado e as apresentações significativas podem impulsionar um negócio.',
    sections: [
      { heading: 'Um lugar para perguntar', body: 'Conversas com outros empreendedores podem revelar perguntas em que você não tinha pensado e apontar recursos que valem a pena explorar.' },
      { heading: 'Apresentações com contexto', body: 'Uma apresentação bem pensada explica por que uma conversa pode ser útil. Seja claro sobre o que você procura e respeite o tempo de todos.' },
      { heading: 'Uma chance de contribuir', body: 'Compartilhe uma experiência, dê as boas-vindas a um novo empresário ou faça uma apresentação com permissão. Uma comunidade forte abre espaço para todos contribuírem.' },
      { heading: 'Raízes compartilhadas, novas possibilidades', body: 'Para líderes empresariais dominicanos e americanos, o entendimento cultural pode ser o ponto de partida para relacionamentos entre mercados e gerações.' },
    ],
  },
};

// Record<Lang, …> means every language must define every article (same slugs) or the build fails.
export const resourceCopy: Record<Lang, Texts> = { en, es, pt };

export const resourceUi: Record<Lang, { chamberResource: string; backToAll: string; disclaimer: string }> = {
  en: { chamberResource: 'CHAMBER RESOURCE', backToAll: 'All business resources', disclaimer: 'This resource provides general business information. For guidance specific to your circumstances, seek appropriate professional support.' },
  es: { chamberResource: 'RECURSO DE LA CÁMARA', backToAll: 'Todos los recursos empresariales', disclaimer: 'Este recurso ofrece información empresarial general. Para orientación específica sobre tu situación, busca el apoyo profesional adecuado.' },
  pt: { chamberResource: 'RECURSO DA CÂMARA', backToAll: 'Todos os recursos para negócios', disclaimer: 'Este recurso oferece informações gerais sobre negócios. Para orientação específica sobre a sua situação, procure o apoio profissional adequado.' },
};
