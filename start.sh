#!/bin/sh
if [ -z "${USESSH+x}" ];
then
echo "USESSH for mongo is unset";
else
ssh -i "/root/keys/mongo_dev.pem" -L 0.0.0.0:37017:docdb-2020-07-09-06-28-43.cluster-cffqzqfck5m7.us-east-2.docdb.amazonaws.com:27017 ec2-user@ec2-18-223-210-51.us-east-2.compute.amazonaws.com -o "StrictHostKeyChecking no" -N -f;
fi

npm run start