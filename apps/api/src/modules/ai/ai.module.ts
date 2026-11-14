import { Global, Module } from '@nestjs/common';
import { AppConfig } from '../../config/app-config.service';
import { AI_PROVIDER, type AiProvider } from './ai-provider';
import { AnthropicProvider } from './anthropic.provider';

/** Menyediakan penyedia AI sesuai `AI_PROVIDER`; `null` bila AI tidak dikonfigurasi. */
@Global()
@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): AiProvider | null => {
        if (!config.aiEnabled) return null;
        switch (config.get('AI_PROVIDER')) {
          case 'anthropic':
            return new AnthropicProvider({
              apiKey: config.get('AI_API_KEY')!,
              model: config.get('AI_MODEL'),
            });
          default:
            return null;
        }
      },
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiModule {}
