'use client';
import { PageIntro } from '@/components/ui';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

export default function Terms() {
  const { lang } = useLanguage();

  return (
    <>
      <PageIntro
        eyebrow={lang === 'en' ? 'DUSACCOM · WEBSITE POLICIES' : 'DUSACCOM · POLÍTICAS DEL SITIO WEB'}
        title={lang === 'en' ? 'Terms of Service' : 'Términos de Servicio'}
        description={
          lang === 'en'
            ? 'Website terms · October 23, 2026'
            : 'Términos del sitio web · 23 de octubre de 2026'
        }
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
          ) : (
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
          )}
        </div>
      </article>
    </>
  );
}
