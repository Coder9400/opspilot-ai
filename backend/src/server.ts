import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { supabase } from './config/supabase';

async function bootstrap(): Promise<void> {
  try {
    // Verify Supabase connectivity
    const { error } = await supabase.from('enquiries').select('id').limit(1);
    if (error && error.code !== '42P01') {
      // 42P01 = table doesn't exist yet (OK — tables may not be created)
      console.warn(`[Supabase] Warning: ${error.message}`);
    } else {
      console.log('✅ Supabase connected successfully');
    }

    const server = app.listen(env.PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║       OPSPILOT AI Backend              ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`🚀 Server:      http://localhost:${env.PORT}`);
      console.log(`❤️  Health:      http://localhost:${env.PORT}/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🤖 AI Provider: ${env.AI_PROVIDER}`);
      console.log(`🔗 Supabase: ${env.SUPABASE_URL}`);
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`[${signal}] Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
