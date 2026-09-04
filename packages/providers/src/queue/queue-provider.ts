export interface QueueJob<T = any> {
  id: string;
  data: T;
  attemptsMade?: number;
}

export interface QueueJobOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

export interface IQueueProvider {
  addJob<T = any>(queueName: string, name: string, data: T, options?: QueueJobOptions): Promise<{ id: string }>;
  processJobs<T = any>(
    queueName: string,
    handler: (job: QueueJob<T>) => Promise<any>,
    concurrency?: number
  ): Promise<void>;
  close(): Promise<void>;
}
