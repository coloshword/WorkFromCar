include .env
export

PG_CONTAINER=pg
PG_IMAGE=postgres:16
PG_VOLUME=pgdata

.PHONY: up down psql reset

# FULL RESET every time: container + volume (DESTROYS ALL DATA)
up: down reset
	docker run -d \
	  --name $(PG_CONTAINER) \
	  -p $(POSTGRES_PORT):5432 \
	  -e POSTGRES_USER=$(POSTGRES_USER) \
	  -e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
	  -e POSTGRES_DB=$(POSTGRES_DB) \
	  -v $(PG_VOLUME):/var/lib/postgresql/data \
	  -v $(PWD)/initdb:/docker-entrypoint-initdb.d:ro \
	  $(PG_IMAGE)
	
	@echo "DB is now running! 💰"

down:
	-docker rm -f $(PG_CONTAINER)

reset:
	-docker volume rm $(PG_VOLUME)

psql:
	docker exec -it $(PG_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)
