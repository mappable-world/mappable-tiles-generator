import {Worker} from 'node:worker_threads';
import os from 'node:os';

interface Task {
    getData: () => any;
    callback: (err?: Error, result?: any) => void;
}

export class WorkerPool {
    private _tasks: Task[] = [];
    private _allWorkers: Worker[] = [];
    private _freeWorkers: Worker[] = [];

    public constructor(
        workerPath: string,
        workerData?: any,
        count: number = os.availableParallelism?.() || os.cpus().length || 1
    ) {
        if (count < 1) return;

        for (let i = 0; i < count; i++) {
            const worker = new Worker(workerPath, {workerData});

            this._allWorkers.push(worker);
            this._freeWorkers.push(worker)
        }
    }

    public destructor() {
        this._allWorkers.forEach((worker) => {
            worker.terminate();
        })
    }

    public run(getData: () => any) {
        return new Promise((resolve, reject) => {
            const worker = this.getFreeWorker();

            const task: Task = {
                getData,
                callback: (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                }
            };

            if (!worker) {
                this._tasks.push(task);

                return;
            }

            this.runTask(task, worker);
        });
    }

    private getFreeWorker(): Worker {
        return this._freeWorkers.pop();
    }

    private async runTask(task: Task, worker: Worker) {
        const finish = () => {
            worker.removeAllListeners('message');
            worker.removeAllListeners('error');


            if (!this._tasks.length) {
                this._freeWorkers.push(worker);

                return;
            }

            this.runTask(this._tasks.pop(), worker);
        };

        worker.once('message', (result) => {
            task.callback(null, result);

            finish();
        });
        worker.once('error', (error) => {
            task.callback(error);

            finish();
        });

        worker.postMessage(await task.getData());
    }
}
