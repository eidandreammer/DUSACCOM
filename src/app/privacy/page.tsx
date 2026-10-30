'use client';
import { PageIntro } from '@/components/ui';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

export default function Privacy() {
  const { lang } = useLanguage();

  return (
    <>
      <PageIntro
        eyebrow={lang === 'en' ? 'DUSACCOM · WEBSITE POLICIES' : 'DUSACCOM · POLÍTICAS DEL SITIO WEB'}
        title={lang === 'en' ? 'Privacy Policy' : 'Política de Privacidad'}
        description={
          lang === 'en'
            ? 'Website privacy notice · October 30, 2026'
            : 'Aviso de privacidad del sitio web · 30 de octubre de 2026'
        }
      />
      <article className="section">
        <div className="container max-w-3xl! editorial-content">
          {lang === 'en' ? (
            <>
              <h2>Your inquiries</h2>
              <p>
                When you submit an inquiry, this website collects your name, email address, company if provided, topic,
                message, and consent. This information is stored in the Chamber’s hosted inquiry database so the team can
                review and respond. Membership inquiries and event expressions of interest do not establish membership, make
                a payment, or reserve attendance.
              </p>
              <p>Event registration forms collect the same contact details to record your registration for a scheduled chapter event. A confirmation reference is shown after the registration is saved.</p>
              <h2>Your account and the calendar</h2>
              <p>Accounts use Google Firebase Authentication to process your email, password, and name. Firebase keeps you signed in using browser storage. Administrator permissions and published events are stored in Cloud Firestore. Event details are public; administrator records can only be read by the corresponding user. Creating an account does not establish paid Chamber membership. Contact the Chamber to request account deletion.</p>
              <h2>How we use your information</h2>
              <p>
                Information you provide is used to handle your inquiry, discuss relevant membership or program options, and
                communicate with you about your request. Please do not submit payment details or other sensitive personal
                information. DUSACCOM’s contact details are provided below if you prefer to call or email.
              </p>
              <h2>Security and abuse prevention</h2>
              <p>
                The site uses hosting and database services to deliver the website and store inquiries. To reduce automated
                abuse, a short-lived, hashed network identifier and a request count may be stored for rate limiting. Raw IP
                addresses are not written to the inquiry database or application logs. The hosting provider may process
                technical request metadata under its own policies.
              </p>
              <h2>Preferences and optional analytics</h2>
              <p>
                Your cookie preference is saved in your browser’s local storage. Optional analytics are disabled unless you
                select “Accept all.” No analytics measurement ID is configured by default. If configured, Google Analytics
                and conversion hooks load only with consent. Form contents are not included in analytics events. You can change
                your choice through “Cookie Settings” in the footer.
              </p>
              <h2>External services</h2>
              <p>
                Email and telephone links open your device’s applications. Their providers’ policies apply when you use those
                services. Illustrative photos are served from this website rather than requesting images from third-party photo
                services.
              </p>
              <h2>Your choices and information requests</h2>
              <p>
                To ask about information you have shared, request a correction or deletion, or withdraw consent to contact,
                email <a href={`mailto:${site.email}`}>{site.email}</a> or call{' '}
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>. The Chamber can explain applicable retention and handling
                practices for your inquiry.
              </p>
              <h2>Contact</h2>
              <p>
                Dominican USA Chamber of Commerce (DUSACCOM)
                <br />
                <a href={`mailto:${site.email}`}>{site.email}</a>
                <br />
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
              </p>
            </>
          ) : (
            <>
              <h2>Tus consultas</h2>
              <p>
                Cuando envías una consulta, este sitio web recopila tu nombre, dirección de correo electrónico, empresa si la
                proporcionas, tema, mensaje y consentimiento. Esta información se almacena en la base de datos de consultas de
                la Cámara para que el equipo pueda revisar y responder. Las consultas de membresía y expresiones de interés en
                eventos no establecen una membresía, no realizan ningún pago ni garantizan reserva de asistencia.
              </p>
              <p>Los formularios de inscripción a eventos recopilan los mismos datos de contacto para guardar tu registro en un evento programado del capítulo. Se muestra un número de referencia después de guardar la inscripción.</p>
              <h2>Tu cuenta y el calendario</h2>
              <p>Las cuentas utilizan Google Firebase Authentication para procesar tu correo, contraseña y nombre. Firebase mantiene tu sesión mediante el almacenamiento del navegador. Los permisos de administrador y los eventos publicados se almacenan en Cloud Firestore. Los detalles de los eventos son públicos; cada usuario solo puede consultar su propio registro de administrador. Crear una cuenta no establece una membresía de pago en la Cámara. Contacta a la Cámara para solicitar la eliminación de tu cuenta.</p>
              <h2>Cómo usamos tu información</h2>
              <p>
                La información facilitada se utiliza exclusivamente para atender tu consulta, dialogar sobre opciones de
                membresía o programas relevantes y comunicarnos contigo con respecto a tu solicitud. Por favor, no envíes
                información bancaria, datos de pago ni datos personales confidenciales. Los datos de contacto de DUSACCOM se
                detallan a continuación si prefieres llamarnos o escribirnos directamente.
              </p>
              <h2>Seguridad y prevención de abuso</h2>
              <p>
                El sitio utiliza servicios de alojamiento y bases de datos seguras para operar la plataforma y resguardar las
                solicitudes. Para reducir el tráfico automatizado indebido, se puede almacenar un identificador de red cifrado
                temporal y un contador de peticiones para limitación de frecuencia. No se guardan direcciones IP directas en la
                base de datos de consultas ni en los registros de aplicación.
              </p>
              <h2>Preferencias y estadísticas opcionales</h2>
              <p>
                Tu preferencia sobre cookies se almacena localmente en tu navegador. Las estadísticas opcionales están
                desactivadas de manera predeterminada a menos que selecciones &quot;Aceptar todo&quot;. Los contenidos de los
                formularios nunca se incluyen en eventos de análisis. Puedes modificar tu elección en cualquier momento a
                través del enlace &quot;Configuración de Cookies&quot; en el pie de página.
              </p>
              <h2>Servicios externos</h2>
              <p>
                Los enlaces de correo electrónico y teléfono abren las aplicaciones nativas de tu dispositivo. Las políticas de
                dichos proveedores rigen al utilizar tales servicios. Las fotografías ilustrativas se sirven directamente desde
                este sitio web sin invocar servicios de imágenes de terceros.
              </p>
              <h2>Tus derechos y solicitudes de información</h2>
              <p>
                Para consultar sobre los datos que has compartido, solicitar una rectificación, eliminación o retirar tu
                consentimiento de contacto, escribe a <a href={`mailto:${site.email}`}>{site.email}</a> o llama al{' '}
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>. La Cámara te informará sobre los procesos aplicables de
                retención y gestión de datos.
              </p>
              <h2>Contacto</h2>
              <p>
                Cámara de Comercio Dominico-Estadounidense (DUSACCOM)
                <br />
                <a href={`mailto:${site.email}`}>{site.email}</a>
                <br />
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
              </p>
            </>
          )}
        </div>
      </article>
    </>
  );
}
