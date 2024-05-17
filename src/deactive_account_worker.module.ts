// create module for deactive account worker service and export it to app module to use it
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeactiveAccountWorkerService } from './deactive_account_worker.service';
import { User } from './user.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { LeaderElectionModule } from './LeaderElectionService.service';

@Module({
  imports: [ 
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User]),
    LeaderElectionModule,
    TypeOrmModule.forRoot({
        type: 'postgres',
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "root",
        database: 'onsports-id',
        entities: [User],
    }),
   ],
    providers: [DeactiveAccountWorkerService],
    exports: [DeactiveAccountWorkerService],
})
export class DeactiveAccountWorkerModule {}
