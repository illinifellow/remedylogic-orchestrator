#!/usr/bin/env bash
docker container rm remedylogic-orchestrator
docker image prune -f
docker build --tag remedylogic-orchestrator .
#docker run --network="host" --publish 4000:4000 --detach --name remedylogic-orchestrator remedylogic-orchestrator
