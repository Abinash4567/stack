import OAuth2Server from "@node-oauth/oauth2-server";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { StackAssertionError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { OAuthModel } from "./model";
import { OAuthBaseProvider } from "./providers/base";
import { FacebookProvider } from "./providers/facebook";
import { GithubProvider } from "./providers/github";
import { GoogleProvider } from "./providers/google";
import { MicrosoftProvider } from "./providers/microsoft";
import { SpotifyProvider } from "./providers/spotify";
import { MockProvider } from "./providers/mock";
import { DiscordProvider } from "@/oauth/providers/discord";

const _providers = {
  github: GithubProvider,
  google: GoogleProvider,
  facebook: FacebookProvider,
  microsoft: MicrosoftProvider,
  spotify: SpotifyProvider,
  discord: DiscordProvider,
} as const;

const mockProvider = MockProvider;

const _getEnvForProvider = (provider: keyof typeof _providers) => {
  return {
    clientId: getEnvVariable(`STACK_${provider.toUpperCase()}_CLIENT_ID`),
    clientSecret: getEnvVariable(`STACK_${provider.toUpperCase()}_CLIENT_SECRET`),
  };
};

export async function getProvider(provider: ProjectsCrud['Admin']['Read']['config']['oauth_providers'][number]): Promise<OAuthBaseProvider> {
  if (provider.type === 'shared') {
    const clientId = _getEnvForProvider(provider.id).clientId;
    const clientSecret = _getEnvForProvider(provider.id).clientSecret;
    if (clientId === "MOCK") {
      if (clientSecret !== "MOCK") {
        throw new StackAssertionError("If OAuth provider client ID is set to MOCK, then client secret must also be set to MOCK");
      }
      return await mockProvider.create(provider.id);
    } else {
      return await _providers[provider.id].create({
        clientId,
        clientSecret,
      });
    }
  } else {
    return await _providers[provider.id].create({
      clientId: provider.client_id || throwErr("Client ID is required for standard providers"),
      clientSecret: provider.client_secret || throwErr("Client secret is required for standard providers"),
      facebookConfigId: provider.facebook_config_id
    });
  }
}

export const oauthServer = new OAuth2Server({
  model: new OAuthModel(),
  allowExtendedTokenAttributes: true,
});
