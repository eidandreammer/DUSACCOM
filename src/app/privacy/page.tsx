'use client';
import { PageIntro } from '@/components/ui';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

export default function Privacy() {
  const { lang } = useLanguage();
  const firebaseForms = process.env.NEXT_PUBLIC_INQUIRY_BACKEND === 'firestore';

  return (
    <>
      <PageIntro
        eyebrow={{ en: 'DUSACCOM · WEBSITE POLICIES', es: 'DUSACCOM · POLÍTICAS DEL SITIO WEB', pt: 'DUSACCOM · POLÍTICAS DO SITE' }[lang]}
        title={{ en: 'Privacy Policy', es: 'Política de Privacidad', pt: 'Política de Privacidade' }[lang]}
        description={{ en: 'Website privacy notice · October 30, 2026', es: 'Aviso de privacidad del sitio web · 30 de octubre de 2026', pt: 'Aviso de privacidade do site · 30 de outubro de 2026' }[lang]}
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
              {firebaseForms ? <p>
                Inquiries are stored privately in Google Cloud Firestore. When you submit a form, Firebase creates a guest
                identifier stored in your browser, separately from your member account. It links your receipt to your browser
                and limits repeated submissions. Your contact details are not published. Google may process technical request
                metadata under its own policies. Contact the Chamber to request deletion of your inquiry or guest identifier.
              </p> : <p>
                The site uses hosting and database services to deliver the website and store inquiries. To reduce automated
                abuse, a short-lived, hashed network identifier and a request count may be stored for rate limiting. Raw IP
                addresses are not written to the inquiry database or application logs. The hosting provider may process
                technical request metadata under its own policies.
              </p>}
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
          ) : lang === 'es' ? (
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
              {firebaseForms ? <p>
                Las consultas se guardan de forma privada en Google Cloud Firestore. Al enviar un formulario, Firebase crea un
                identificador de invitado almacenado en tu navegador, separado de tu cuenta de miembro. Este identificador
                vincula tu comprobante con el navegador y limita envíos repetidos. Tus datos de contacto no se publican.
                Google puede procesar metadatos técnicos conforme a sus políticas. Contacta a la Cámara para solicitar la
                eliminación de tu consulta o identificador de invitado.
              </p> : <p>
                El sitio utiliza servicios de alojamiento y bases de datos seguras para operar la plataforma y resguardar las
                solicitudes. Para reducir el tráfico automatizado indebido, se puede almacenar un identificador de red cifrado
                temporal y un contador de peticiones para limitación de frecuencia. No se guardan direcciones IP directas en la
                base de datos de consultas ni en los registros de aplicación.
              </p>}
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
          ) : (
            <>
              <h2>Suas solicitações</h2>
              <p>
                Quando você envia uma solicitação, este site coleta o seu nome, o seu e-mail, a sua empresa (se informada), o
                assunto, a mensagem e o seu consentimento. Essas informações são armazenadas no banco de dados de solicitações
                hospedado pela Câmara para que a equipe possa analisar e responder. Solicitações de associação e manifestações
                de interesse em eventos não estabelecem uma associação, não realizam nenhum pagamento nem reservam presença.
              </p>
              <p>Os formulários de inscrição em eventos coletam os mesmos dados de contato para registrar a sua inscrição em um evento programado do capítulo. Um número de referência de confirmação é exibido depois que a inscrição é salva.</p>
              <h2>Sua conta e o calendário</h2>
              <p>As contas usam o Google Firebase Authentication para processar o seu e-mail, a sua senha e o seu nome. O Firebase mantém você conectado usando o armazenamento do navegador. As permissões de administrador e os eventos publicados ficam armazenados no Cloud Firestore. Os detalhes dos eventos são públicos; os registros de administrador só podem ser lidos pelo usuário correspondente. Criar uma conta não estabelece uma associação paga à Câmara. Entre em contato com a Câmara para solicitar a exclusão da conta.</p>
              <h2>Como usamos as suas informações</h2>
              <p>
                As informações que você fornece são usadas para tratar a sua solicitação, conversar sobre opções relevantes de
                associação ou de programas e entrar em contato com você sobre o seu pedido. Não envie dados de pagamento nem
                outras informações pessoais sensíveis. Os dados de contato da DUSACCOM estão abaixo, caso você prefira ligar ou
                escrever.
              </p>
              <h2>Segurança e prevenção de abusos</h2>
              {firebaseForms ? <p>
                As solicitações são armazenadas de forma privada no Google Cloud Firestore. Quando você envia um formulário, o
                Firebase cria um identificador de visitante armazenado no seu navegador, separado da sua conta de membro. Ele
                vincula o seu comprovante ao seu navegador e limita envios repetidos. Seus dados de contato não são
                publicados. O Google pode processar metadados técnicos da requisição conforme as suas próprias políticas.
                Entre em contato com a Câmara para solicitar a exclusão da sua solicitação ou do identificador de visitante.
              </p> : <p>
                O site usa serviços de hospedagem e de banco de dados para entregar as páginas e armazenar as solicitações.
                Para reduzir abusos automatizados, um identificador de rede temporário e criptografado e uma contagem de
                requisições podem ser armazenados para limitar a frequência. Endereços IP brutos não são gravados no banco de
                dados de solicitações nem nos registros do aplicativo. O provedor de hospedagem pode processar metadados
                técnicos da requisição conforme as suas próprias políticas.
              </p>}
              <h2>Preferências e estatísticas opcionais</h2>
              <p>
                A sua preferência sobre cookies é salva no armazenamento local do seu navegador. As estatísticas opcionais
                ficam desativadas, a menos que você selecione &quot;Aceitar todos&quot;. Nenhum ID de medição de estatísticas
                está configurado por padrão. Se for configurado, o Google Analytics e os recursos de conversão só são
                carregados com o seu consentimento. O conteúdo dos formulários não é incluído nos eventos de estatísticas.
                Você pode mudar a sua escolha a qualquer momento em &quot;Configurações de Cookies&quot;, no rodapé.
              </p>
              <h2>Serviços externos</h2>
              <p>
                Os links de e-mail e de telefone abrem os aplicativos do seu dispositivo. As políticas dos respectivos
                provedores se aplicam quando você usa esses serviços. As fotos ilustrativas são servidas por este site, sem
                requisitar imagens de serviços de fotos de terceiros.
              </p>
              <h2>Suas escolhas e pedidos de informação</h2>
              <p>
                Para perguntar sobre as informações que você compartilhou, solicitar uma correção ou exclusão, ou retirar o
                seu consentimento de contato, escreva para <a href={`mailto:${site.email}`}>{site.email}</a> ou ligue para{' '}
                <a href={`tel:${site.phoneHref}`}>{site.phone}</a>. A Câmara pode explicar as práticas aplicáveis de retenção
                e tratamento da sua solicitação.
              </p>
              <h2>Contato</h2>
              <p>
                Câmara de Comércio Dominicano-Americana dos EUA (DUSACCOM)
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
