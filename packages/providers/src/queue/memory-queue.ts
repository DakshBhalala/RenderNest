import { IQueueProvider, QueueJob, QueueJobOptions } from './queue-provider';

interface MemoryJobItem {
  id: string;
  name: string;
  data: any;
  options?: QueueJobOptions;
  attemptsMade: number;
}

export class MemoryQueueProvider implements IQueueProvider {
  private queueMap: Map<string, MemoryJobItem[]> = new Map();
  private handlers: Map<string, (job: QueueJob) => Promise<any>> = new Map();
  private processing: Set<string> = new Set();
  private isClosed = false;

  async addJob<T = any>(
    queueName: string,
    name: string,
    data: T,
    options?: QueueJobOptions
  ): Promise<{ id: string }> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (!this.queueMap.has(queueName)) {
      this.queueMap.set(queueName, []);
    }

    const jobItem: MemoryJobItem = {
      id,
      name,
      data,
      options,
      attemptsMade: 0,
    };

    this.queueMap.get(queueName)!.push(jobItem);
    this.triggerProcessing(queueName);

    return { id };
  }

  async processJobs<T = any>(
    queueName: string,
    handler: (job: QueueJob<T>) => Promise<any>,
    _concurrency?: number
  ): Promise<void> {
    this.handlers.set(queueName, handler);
    this.triggerProcessing(queueName);
  }

  private async triggerProcessing(queueName: string) {
    if (this.processing.has(queueName) || this.isClosed) return;
    const handler = this.handlers.get(queueName);
    if (!handler) return;

    this.processing.add(queueName);

    setImmediate(async () => {
      try {
        const queue = this.queueMap.get(queueName) || [];
        while (queue.length > 0 && !this.isClosed) {
          const item = queue.shift();
          if (!item) continue;

          item.attemptsMade++;
          try {
            await handler({
              id: item.id,
              data: item.data,
              attemptsMade: item.attemptsMade,
            });
          } catch (err) {
            const maxAttempts = item.options?.attempts || 3;
            if (item.attemptsMade < maxAttempts) {
              const delay = item.options?.backoff?.delay || 1000;
              setTimeout(() => {
                queue.push(item);
                this.triggerProcessing(queueName);
              }, delay * Math.pow(2, item.attemptsMade - 1));
            } else {
              console.error(`Memory queue job ${item.id} failed permanently after ${maxAttempts} attempts:`, err);
            }
          }
        }
      } finally {
        this.processing.delete(queueName);
      }
    });
  }

  async close(): Promise<void> {
    this.isClosed = true;
    this.queueMap.clear();
    this.handlers.clear();
  }
}
