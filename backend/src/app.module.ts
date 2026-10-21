import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaService } from './common/prisma.service';
import { AuthGuard } from './common/auth';
import { AuthController, AuthService } from './modules/auth';
import { FeedController, UsersController } from './modules/users';
import { StoriesController, StoriesService, StudioController } from './modules/stories';
import { LibraryController, ReadsController, SocialController } from './modules/reader';
import { DiscoveryController } from './modules/discovery';
import { WalletController, WalletService } from './modules/wallet';
import { AnalyticsController } from './modules/analytics';
import { NotificationsController, NotificationsService } from './modules/notifications';
import { AdminController } from './modules/admin';
import { StorageService, UploadsController } from './modules/storage';
import { HealthController } from './modules/health';

@Module({
  imports: [
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret-change-me', signOptions: { expiresIn: '30d' } }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({ rootPath: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'), serveRoot: '/uploads' }),
  ],
  controllers: [
    HealthController, AuthController, UsersController, FeedController, StoriesController, StudioController, LibraryController,
    ReadsController, SocialController, DiscoveryController, WalletController, AnalyticsController, NotificationsController,
    AdminController, UploadsController,
  ],
  providers: [PrismaService, AuthService, StoriesService, WalletService, NotificationsService, StorageService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
