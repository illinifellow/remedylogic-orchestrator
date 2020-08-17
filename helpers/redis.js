'use strict'
const ioredis = require('ioredis')

// TODO for sessions maybe to use another redis instance

// var cluster = new redis.Cluster([{
//     port: 7000,
//     host: '192.168.1.2'
//   },
//   {
//     port: 7001,
//     host: '192.168.1.2'
//   },
//   {
//     port: 7002,
//     host: '192.168.1.2'
//   }]
// )
//
// gcloud compute instances create redis-forwarder --machine-type=f1-micro --zone=europe-west4-a

//gcloud compute firewall-rules create rule-allow-tcp-6379 --source-ranges 0.0.0.0/0 --target-tags allow-tcp-6379 --allow tcp:6379
//  # Add the 'allow-tcp-6379' tag to a VM named redis-forwarder
//gcloud compute instances add-tags redis-forwarder --tags allow-tcp-6379
//  # If you want to list all the GCE firewall rules
//gcloud compute firewall-rules list

//https://stackoverflow.com/questions/50281492/accessing-gcp-memorystore-from-local-machines

// gcloud compute ssh redis-forwarder -- -N -L 6379:10.0.0.3:6379

//const redis = new ioredis(6379,'192.168.1.2')
const redis = new ioredis(6379, process.env.REDIS)

redis.on("error", function (err) {
  console.error("redis connection error " + err)
})

redis.on('connect', function () {
  console.log('redis connected')
})

const redisPubSub = new ioredis(6379, process.env.REDIS)

redisPubSub.on("error", function (err) {
  console.error("redis connection error " + err)
})

redisPubSub.on('connect', function () {
  console.log('redis connected')
})


module.exports = {
  redis,
  redisPubSub
}

