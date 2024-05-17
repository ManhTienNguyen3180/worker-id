import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import Redis from 'ioredis';
import * as os from 'os';

@Injectable()
export class LeaderElectionService implements OnModuleInit {
  private redis: Redis;
  private leaderKey: string = 'leader';
  private isLeader: boolean = false;
  private instanceId: string;
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      db: 1,
    });
    this.instanceId = os.hostname();
  }

  async onModuleInit() {
    await this.electLeader();
  }

  async electLeader() {
    try {
      await this.redis.set(this.leaderKey, this.instanceId);
      await this.redis.expire(this.leaderKey, 10);
      this.isLeader = true;
      console.log(`Node ${this.instanceId} is the leader`);
      setTimeout(() => this.extendLeadership(), 9000); // Extend leadership before it expires
    } catch (error) {
      console.log(`Node ${this.instanceId} failed to become the leader`);
      this.isLeader = false;
      setTimeout(() => this.electLeader(), 5000); // Retry after 5 seconds
    }
  }

  async extendLeadership() {
    if (this.isLeader) {
      try {
        const currentLeader = await this.redis.get(this.leaderKey);
        if (currentLeader === this.instanceId) {
          await this.redis.set(this.leaderKey, this.instanceId);
          await this.redis.expire(this.leaderKey, 10);
          setTimeout(() => this.extendLeadership(), 9000); // Extend leadership before it expires
        } else {
          this.isLeader = false;
          this.electLeader();
        }
      } catch (error) {
        this.isLeader = false;
        this.electLeader();
      }
    }else {
      // If this node is not the leader, check if the leader has failed
      const currentLeader = await this.redis.get(this.leaderKey);
      if (currentLeader === null) {
        // If the leader key is null, it means the timeout has expired and the leader has failed
        this.electLeader();
      }
    }
  }

  isLeaderNode() {
    return this.isLeader;
  }
}
@Module({
  providers: [LeaderElectionService],
  exports: [LeaderElectionService],
})
export class LeaderElectionModule {}
