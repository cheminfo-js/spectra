var cluster = require('cluster');

if (cluster.isMaster) {
    var numWorkers = require('os').cpus().length;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');
    let workers = [];
    for (var i = 0; i < numWorkers; i++) {
        let worker = cluster.fork();
        workers.push(worker);
    }
    var responses = [];
    cluster.on('message', (worker, message, handle) => {
        responses.push(message);
        console.log('Master ' + process.pid +
         ' received message from worker ' + worker.process.pid + " " + message.worker + '.', message);
    });

    cluster.on('online', function (worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function (worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });

    // Be notified when worker processes die.
    cluster.on('death', function(worker) {
        console.log('Worker ' + worker.process.pid + ' died.');
    });

    for(let j = 0; j < 2; j++) {
        for (var i = 0; i < numWorkers; i++) {
            let worker = workers[i];
            // Send a message from the master process to the worker.
            worker.send( { master: process.pid, i, j });
        }

        Promise.all(responses);
    }
}
if (cluster.isWorker) {

    

    // Receive messages from the master process.
    process.on('message', function (msg) {
        console.log('Worker ' + process.pid + ' received message from master.', msg);
        // Send message to master process.
        process.send({ worker: process.pid, x: msg.i + "_" +msg.j});
    });

}