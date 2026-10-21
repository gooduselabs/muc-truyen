import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.setGlobalPrefix('api', { exclude: ['uploads/(.*)'] });
  app.enableCors({ origin: true, credentials: true });
  return app;
}

if (require.main === module) {
  createApp().then(async (app) => {
    const port = Number(process.env.PORT || 4000);
    await app.listen(port, '0.0.0.0');
    console.log(`Mực API chạy tại http://localhost:${port}/api`);
  });
}
