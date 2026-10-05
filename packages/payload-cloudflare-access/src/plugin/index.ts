import type { Config, Plugin } from 'payload';

export const ACCESS_LOGOUT_BUTTON_PATH = '@napolab/payload-cloudflare-access/client/logout-button#LogoutButton';

export type CloudflareAccessPluginOptions = {
  teamDomain: string | undefined;
  aud: string | undefined;
  collection?: string;
};

export const cloudflareAccessPlugin =
  (_options: CloudflareAccessPluginOptions): Plugin =>
  (config: Config): Config => ({
    ...config,
    admin: {
      ...config.admin,
      components: {
        ...config.admin?.components,
        logout: {
          ...config.admin?.components?.logout,
          Button: {
            path: ACCESS_LOGOUT_BUTTON_PATH,
            clientProps: { accessLogout: false },
          },
        },
      },
    },
  });
