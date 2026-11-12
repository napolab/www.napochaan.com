import { getCloudflareContext } from '@opennextjs/cloudflare';

import { ContactForm } from '../../_components/contact-form';

const ContactFormLoader = async () => {
  const { env } = await getCloudflareContext({ async: true });

  return <ContactForm turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
};

export { ContactFormLoader };
