import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap(): Promise<void> {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const server = app.listen(env.PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║       OPSPILOT AI Backend              ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`🚀 Server:      http://localhost:${env.PORT}`);
      console.log(`❤️  Health:      http://localhost:${env.PORT}/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🤖 AI Provider: ${env.AI_PROVIDER}`);
      console.log(`🔗 Client URL:  ${env.CLIENT_URL}`);
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[${signal}] Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
