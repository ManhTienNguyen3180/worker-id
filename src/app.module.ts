import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeactiveAccountWorkerModule } from './deactive_account_worker.module';
import { LeaderElectionModule } from './LeaderElectionService.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [DeactiveAccountWorkerModule,ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
