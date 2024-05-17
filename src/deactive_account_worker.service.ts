import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {  LessThan, Repository } from 'typeorm';
import { User } from './user.entity';
import Redis from 'ioredis';
import { LeaderElectionService } from './LeaderElectionService.service';
import * as Queue from 'bull';

@Injectable()
export class DeactiveAccountWorkerService {
  private redis: Redis;
  private deactivationQueue: Queue.Queue;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly leaderElectionService: LeaderElectionService,
  ) {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      password: '',
      db: 1,
    });
    this.deactivationQueue = new Queue('deactivationQueue',{
      redis: {
        host: 'localhost',
        port: 6379,
        password: '',
        db: 1,
      },
    
    });
  }
  async onModuleInit() {
    // Start processing deactivation jobs when the module initializes
    this.processDeactivationJobs();
  }
  @Cron('*/10 * * * * *')
  async handleCron() {
    try {
      if (this.leaderElectionService.isLeaderNode()) {
        console.log('======Running DeactiveAccount Worker======');
        await this.deactiveAccount();
      } else {
        console.log('This node is not the leader, skipping task execution.');
      }
    } catch (error) {
      console.error('Error running deactiveAccount:', error);
    }
  }
  async deactiveAccount() {
    const fifteenDaysAgo = new Date();
    const current = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const usersToDeactivate = await this.userRepository.find({
      where: {
        deactivation_time: LessThan(fifteenDaysAgo),
        deactivation: 1,
      },
    });

    // Add users to the deactivation queue
    usersToDeactivate.forEach((user: User) => {
      this.deactivationQueue.add({
        userId: user.user_id,
        deactivation: 2,
        initial_time: current,
      });
    });
  }
  // Process jobs in the deactivation queue
  async processDeactivationJobs() {
    this.deactivationQueue.process(5,async (job) => {
      const { userId, deactivation, initial_time } = job.data;

      // Update the user in the database
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ deactivation, initial_time })
        .where('user_id = :userId', { userId })
        .execute();

      // Update the user in Redis
      const user = await this.userRepository.findOne({ where: { user_id: userId } });
      const pipeline = this.redis.pipeline();
      pipeline.set(`user_deactivation:${userId}`, JSON.stringify(user));
      await pipeline.exec();
    });
  }
}
