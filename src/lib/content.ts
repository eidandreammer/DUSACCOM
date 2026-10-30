export type Program = { id: string; number: string; title: string; label: string; description: string; features: readonly string[]; icon: 'growth' | 'users' | 'globe' | 'heart' };
export const programs: readonly Program[] = [
  { id: 'business-development', number: '01', title: 'Build your business.', label: 'Business development', description: 'Practical guidance, useful resources, and connections to help you start stronger and grow with confidence.', features: ['Business planning and growth conversations', 'Introductions to relevant resources', 'Learning opportunities for entrepreneurs'], icon: 'growth' },
  { id: 'networking', number: '02', title: 'Expand your circle.', label: 'Networking & connections', description: 'Build relationships that go beyond a business card. Meet people who understand your ambition and open new doors.', features: ['Business-to-business introductions', 'Community networking opportunities', 'Conversations with fellow business owners'], icon: 'users' },
  { id: 'trade', number: '03', title: 'Think beyond borders.', label: 'Trade & market access', description: 'Explore possibilities between Dominican and U.S. markets with a community that understands both worlds.', features: ['Cross-border business conversations', 'Dominican–American business connections', 'Resources for exploring new markets'], icon: 'globe' },
  { id: 'community', number: '04', title: 'Make a lasting impact.', label: 'Community & advocacy', description: 'Support local businesses, empower emerging entrepreneurs, and help shape a more connected community.', features: ['Local business community initiatives', 'Entrepreneur engagement', 'Collaborations for shared growth'], icon: 'heart' }
];
export type Initiative = { id: string; title: string; titleEs?: string; category: 'Networking' | 'Workshop' | 'Cross-border'; description: string; descriptionEs?: string; art: 'navy' | 'light' | 'red'; tagline: readonly [string, string]; status: 'proposed' | 'confirmed'; date?: string; location?: string; schedule?: { startsAt: string; timeZone: string; registration: 'open' | 'closed' } };
export const initiatives: readonly Initiative[] = [
  { id: 'business-connection', title: 'The Business Connection', titleEs: 'La Conexión Empresarial', category: 'Networking', description: 'Introductions, shared ideas, and meaningful conversations with fellow business owners.', descriptionEs: 'Presentaciones, ideas compartidas y conversaciones significativas con otros empresarios.', art: 'navy', tagline: ['Stronger connections.', 'Bigger possibilities.'], status: 'proposed' },
  { id: 'next-chapter', title: 'Ready for Your Next Chapter', titleEs: 'Listos para Tu Próximo Capítulo', category: 'Workshop', description: 'Practical conversations for entrepreneurs ready to move their business forward.', descriptionEs: 'Conversaciones prácticas para emprendedores listos para impulsar su negocio.', art: 'light', tagline: ['Small steps.', 'Big ambitions.'], status: 'proposed' },
  { id: 'beyond-borders', title: 'Business Beyond Borders', titleEs: 'Negocios Más Allá de las Fronteras', category: 'Cross-border', description: 'Explore doing business between the Dominican Republic and the United States.', descriptionEs: 'Explora hacer negocios entre la República Dominicana y los Estados Unidos.', art: 'red', tagline: ['Two markets.', 'One conversation.'], status: 'proposed' }
];
export type Tier = { id: 'startup' | 'small-business' | 'corporate' | 'nonprofit'; name: string; eyebrow: string; description: string; benefits: readonly string[]; featured?: boolean };
export const tiers: readonly Tier[] = [
  { id: 'startup', name: 'Startup', eyebrow: 'FOR THE NEXT BIG IDEA', description: 'Turn ambition into momentum with a community in your corner.', benefits: ['Entrepreneur community connections', 'Business learning opportunities', 'Guidance for your next steps'] },
  { id: 'small-business', name: 'Small Business', eyebrow: 'FOR GROWING AMBITIONS', description: 'Make valuable connections and put your business in a stronger position to grow.', benefits: ['Business-to-business introductions', 'Networking and development resources', 'Community visibility opportunities'], featured: true },
  { id: 'corporate', name: 'Corporate Partner', eyebrow: 'FOR A GREATER IMPACT', description: 'Connect across markets and empower the next generation of business leaders.', benefits: ['Strategic partnership conversations', 'Cross-border business connections', 'Community engagement opportunities'] },
  { id: 'nonprofit', name: 'Nonprofit', eyebrow: 'FOR A STRONGER COMMUNITY', description: 'Connect your mission with a community of businesses and organizations working toward a shared future.', benefits: ['Connections with businesses and community organizations', 'Mission-focused collaboration opportunities', 'Community visibility and engagement opportunities'] }
];
export type ApprovedMilestone = { title: string; business: string; summary: string };
export type BoardMember = { name: string; title: string; bio: string };
export type Testimonial = { quote: string; name: string; role: string };
export type Partner = { name: string; logo: string; url: string };
// Add only Chamber-approved content and assets with permission.
export const memberMilestones: readonly ApprovedMilestone[] = [];
export const board: readonly BoardMember[] = [];
export const testimonials: readonly Testimonial[] = [];
export const partners: readonly Partner[] = [];
export const resources = [
  { slug: 'better-business-networking', category: 'BUILDING CONNECTIONS', title: 'A better approach to business networking', description: 'Start with curiosity, build on shared interests, and make the follow-up count.', sections: [
    { heading: 'Start with curiosity', body: 'Ask what someone is building, what they are learning, and what a useful connection would look like for them. Listen before introducing your own business.' },
    { heading: 'Make your introduction clear', body: 'Explain who you help and how in a sentence or two. A concrete example helps someone understand your work and remember you later.' },
    { heading: 'Follow up with purpose', body: 'Refer to something specific you discussed. Offer a useful resource or suggest a short conversation. Ask permission before sharing anyone’s contact details.' },
    { heading: 'Build over time', body: 'Stay in touch, celebrate others’ progress, and look for ways to be useful. Strong relationships grow through consistent, thoughtful actions.' }
  ] },
  { slug: 'preparing-for-a-new-market', category: 'BUSINESS DEVELOPMENT', title: 'Preparing your business for a new market', description: 'Five questions to ask before taking your next step across borders.', sections: [
    { heading: 'Who is your customer?', body: 'Identify the specific people or organizations you hope to serve. Speak with potential customers rather than assuming demand transfers unchanged between markets.' },
    { heading: 'What needs to adapt?', body: 'Consider language, expectations, service delivery, and how you will support customers locally.' },
    { heading: 'How will you deliver?', body: 'Map the practical steps of fulfilling an order or providing a service. Identify dependencies, partners, and costs that need more research.' },
    { heading: 'Who can verify requirements?', body: 'Identify qualified local advisers who can confirm the requirements that apply to your business.' },
    { heading: 'What is a manageable first step?', body: 'Set a research or pilot goal before making a large commitment. Use what you learn to decide your next step.' }
  ] },
  { slug: 'a-community-in-your-corner', category: 'COMMUNITY', title: 'The value of a community in your corner', description: 'How shared knowledge and meaningful introductions can move a business forward.', sections: [
    { heading: 'A place to ask', body: 'Conversations with fellow entrepreneurs can reveal questions you had not considered and point you toward resources worth exploring.' },
    { heading: 'Introductions with context', body: 'A thoughtful introduction explains why a conversation might be useful. Be clear about what you are looking for, and respect everyone’s time.' },
    { heading: 'A chance to contribute', body: 'Share an experience, welcome a new business owner, or offer an introduction with permission. A strong community creates room for everyone to contribute.' },
    { heading: 'Shared roots, new possibilities', body: 'For Dominican and American business leaders, cultural understanding can be a starting point for relationships across markets and generations.' }
  ] }
] as const;
