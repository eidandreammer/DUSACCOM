'use client';
import { PageIntro } from '@/components/ui';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

export default function Terms() {
  const { lang } = useLanguage();

  return (
    <>
      <PageIntro
        eyebrow={{ en: 'DUSACCOM · WEBSITE POLICIES', es: 'DUSACCOM · POLÍTICAS DEL SITIO WEB', pt: 'DUSACCOM · POLÍTICAS DO SITE' }[lang]}
        title={{ en: 'Terms of Service', es: 'Términos de Servicio', pt: 'Termos de Serviço' }[lang]}
        description={{ en: 'Website terms · October 23, 2026', es: 'Términos del sitio web · 23 de octubre de 2026', pt: 'Termos do site · 23 de outubro de 2026' }[lang]}
      />
      <article className="section">
        <div className="container max-w-3xl! editorial-content">
          {lang === 'en' ? (
            <>
              <h2>Using this website</h2>
              <p>
                This website introduces the Dominican USA Chamber of Commerce and its business community. Please use the
                website lawfully and respectfully. Do not attempt to disrupt the site, bypass its controls, or misuse its
                inquiry forms.
              </p>
              <h2>Membership and programs</h2>
              <p>
                Membership pathways and listed benefits are proposed introductory information. Approved benefits, dues,
                eligibility, services, and availability must be confirmed directly with DUSACCOM. Submitting an inquiry does
                not establish membership or a partnership.
              </p>
              <h2>Events and expressions of interest</h2>
              <p>
                Unless explicitly marked as confirmed, initiatives are proposed concepts. Dates, locations, admission
                requirements, and registration details are confirmed separately. An inquiry receipt confirms that the website
                received your message; it does not reserve a place or constitute event registration.
                A form labeled Event Registration records your registration for a confirmed chapter event and provides a
                reference after it is saved.
              </p>
              <h2>No online payments</h2>
              <p>
                This website does not collect payments, request card details, or enter visitors into a paid agreement. Any
                future membership or payment agreement must be reviewed and accepted separately.
              </p>
              <h2>Business resources</h2>
              <p>
                Website resources provide general business information. They are not individualized professional advice or a
                guarantee of business results. Confirm details and seek appropriate professional support for your
                circumstances.
              </p>
              <h2>Contact</h2>
              <p>
                For questions or to confirm current details, contact{' '}
                <a href={`mailto:${site.email}`}>{site.email}</a> or call{' '}
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>.
              </p>
            </>
          ) : lang === 'es' ? (
            <>
              <h2>Uso de este sitio web</h2>
              <p>
                Este sitio web presenta la Cámara de Comercio Dominico-Estadounidense y su comunidad empresarial. Por favor,
                utiliza el sitio web de manera legal y respetuosa. No intentes alterar la plataforma, eludir sus mecanismos de
                control ni hacer un uso indebido de los formularios de contacto.
              </p>
              <h2>Membresía y programas</h2>
              <p>
                Las alternativas de membresía y beneficios descritos son información introductoria y propuesta. Los beneficios
                aprobados, cuotas, elegibilidad, servicios y disponibilidad deben confirmarse directamente con DUSACCOM. El
                envío de una consulta o registro no formaliza automáticamente una membresía o alianza.
              </p>
              <h2>Eventos y expresiones de interés</h2>
              <p>
                A menos que se señale explícitamente como confirmado, las iniciativas son conceptos propuestos. Las fechas,
                sedes, requisitos de admisión y detalles de registro se coordinan por separado. El acuse de recibo confirma que
                el sitio recibió tu mensaje, pero no garantiza un cupo ni sustituye la inscripción formal a un evento.
                Un formulario identificado como Registro para Eventos guarda tu inscripción en un evento confirmado del
                capítulo y proporciona un número de referencia después de guardarla.
              </p>
              <h2>Sin pagos en línea</h2>
              <p>
                Este sitio web no realiza cobros, no solicita números de tarjeta de crédito ni formaliza contratos comerciales
                de pago. Todo acuerdo de membresía o cuotas se tramita y acepta de forma independiente con la Cámara.
              </p>
              <h2>Recursos empresariales</h2>
              <p>
                Los recursos y artículos de este sitio web ofrecen orientación general sobre negocios. No constituyen asesoría
                profesional personalizada ni garantizan resultados económicos específicos. Recomendamos verificar los
                requerimientos y buscar asesoría profesional acorde a la situación particular de tu empresa.
              </p>
              <h2>Contacto</h2>
              <p>
                Para cualquier consulta o para verificar información vigente, comunícate a{' '}
                <a href={`mailto:${site.email}`}>{site.email}</a> o llama al{' '}
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>.
              </p>
            </>
          ) : (
            <>
              <h2>Uso deste site</h2>
              <p>
                Este site apresenta a Câmara de Comércio Dominicano-Americana dos EUA e a sua comunidade de negócios. Use o
                site de forma legal e respeitosa. Não tente atrapalhar o funcionamento do site, contornar os seus controles
                nem usar indevidamente os formulários de solicitação.
              </p>
              <h2>Associação e programas</h2>
              <p>
                Os tipos de associação e os benefícios listados são informações introdutórias e propostas. Os benefícios
                aprovados, as anuidades, a elegibilidade, os serviços e a disponibilidade devem ser confirmados diretamente
                com a DUSACCOM. Enviar uma solicitação não estabelece uma associação nem uma parceria.
              </p>
              <h2>Eventos e manifestações de interesse</h2>
              <p>
                A menos que estejam marcadas explicitamente como confirmadas, as iniciativas são conceitos propostos. Datas,
                locais, requisitos de entrada e detalhes de inscrição são confirmados separadamente. O recibo da solicitação
                confirma que o site recebeu a sua mensagem; ele não reserva uma vaga nem constitui inscrição em um evento.
                Um formulário identificado como Inscrição no Evento registra a sua inscrição em um evento confirmado do
                capítulo e fornece um número de referência depois de salvo.
              </p>
              <h2>Sem pagamentos online</h2>
              <p>
                Este site não cobra pagamentos, não solicita dados de cartão nem inclui os visitantes em nenhum contrato pago.
                Qualquer futuro acordo de associação ou de pagamento deve ser analisado e aceito separadamente.
              </p>
              <h2>Recursos para negócios</h2>
              <p>
                Os recursos do site oferecem informações gerais sobre negócios. Eles não são aconselhamento profissional
                individualizado nem garantia de resultados. Confirme os detalhes e procure o apoio profissional adequado à sua
                situação.
              </p>
              <h2>Contato</h2>
              <p>
                Para dúvidas ou para confirmar informações atuais, entre em contato pelo e-mail{' '}
                <a href={`mailto:${site.email}`}>{site.email}</a> ou ligue para{' '}
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>.
              </p>
            </>
          )}
        </div>
      </article>
    </>
  );
}
