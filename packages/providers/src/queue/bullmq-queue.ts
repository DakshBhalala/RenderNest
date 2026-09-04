import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { IQueueProvider, QueueJob, QueueJobOptions } from './queue-provider';

export class BullMQQueueProvider implements IQueueProvider {
  private connection: IORedis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    this.connection = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(
        name,
        new Queue(name, {
          connection: this.connection,
        })
      );
    }
    return this.queues.get(name)!;
  }

  async addJob<T = any>(
    queueName: string,
    name: string,
    data: T,
    options?: QueueJobOptions
  ): Promise<{ id: string }> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(name, data, {
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential',
        delay: 2000,
      },
    });
    return { id: job.id || String(Date.now()) };
  }

  async processJobs<T = any>(
    queueName: string,
    handler: (job: QueueJob<T>) => Promise<any>,
    concurrency: number = 5
  ): Promise<void> {
    const worker = new Worker(
      queueName,
      async (bullJob) => {
        return await handler({
          id: bullJob.id || 'unknown',
          data: bullJob.data,
          attemptsMade: bullJob.attemptsMade,
        });
      },
      {
        connection: this.connection,
        concurrency,
      }
    );

    this.workers.set(queueName, worker);
  }

  async close(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connection.quit();
  }
}
