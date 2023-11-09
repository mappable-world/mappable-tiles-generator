import {WorkerPool} from './worker-pool';
import path from 'node:path';

describe('WorkerPool class', () => {
    const pool = new WorkerPool(path.join(__dirname, '__mocks__', 'worker.js'));
    const checks = [] as {a: number, sum: number}[];

    let sum = 0;
    const N = 5 * 10e3;
    for (let i = 0; i < N; i++) {
        sum += i;
        checks.push({a: i, sum});
    }

    describe('check run', () => {
        it(`should calculate factorial correctly`, async () => {
            return Promise.all(checks.map(async ({a, sum}) => {
                expect(await pool.run(() => a)).toBe(sum);
            })).finally(() => {
                pool.destructor();
            })
        });
    });
});
