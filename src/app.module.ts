import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ServiceHistoryModule } from './service-history/service-history.module';
import { ExpenseHistoryModule } from './expense-history/expense-history.module';

@Module({
  imports: [
    // Attached config environment variables to the application
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection configuration
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    VehiclesModule,
    ServiceHistoryModule,
    ExpenseHistoryModule,
  ],
})
export class AppModule {}
