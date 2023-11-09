const {isMainThread, parentPort} = require('node:worker_threads');


function sum(n){
    let result = 0;

    while(n){
        result += n--;
    }

    return result;
}

if (!isMainThread) {
    parentPort.on('message', async (n) => {
        parentPort.postMessage(sum(n));
    });
}
