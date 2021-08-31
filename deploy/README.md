# Deployment

## Deploy

> Due to the complexities of the deployment with having to initialise the data and
> no solid deployment plan as yet that won't crash my server, this will be empty

To run a demo of the local service run

```bash
bash ./deploy/deployment
```

## Requirements

> Elasticsearch might be moved to a separate vm for the future to save space
> and be used by different projects and via a docker swarm to save CPU/RAM
> which we run out of on the server

- elasticsearch@`docker.elastic.co/elasticsearch/elasticsearch:7.14.0`
