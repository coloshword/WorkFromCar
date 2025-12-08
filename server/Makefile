include .env
export $(shell sed 's/=.*//' .env)

PROJECT_NAME ?= $(PROJECT_NAME)
DB_IMAGE     := $(PROJECT_NAME)-postgres
DB_CONTAINER := $(PROJECT_NAME)-postgres-1
DB_DATA_DIR  := db/data

.PHONY: db-build db-run db-stop db-logs db-reset db-psql

db-build:
	docker build -t $(DB_IMAGE) .

db-run: db-build
	mkdir -p $(DB_DATA_DIR)
	docker run --name $(DB_CONTAINER) \
		--env-file .env \
		-p $(DB_PORT):5432 \
		-v $(PWD)/$(DB_DATA_DIR):/var/lib/postgresql/data \
		-d $(DB_IMAGE)

db-stop:
	- docker stop $(DB_CONTAINER)
	- docker rm $(DB_CONTAINER)

db-logs:
	docker logs -f $(DB_CONTAINER)

db-reset: db-stop
	rm -rf $(DB_DATA_DIR)

db-psql:
	docker exec -it $(DB_CONTAINER) psql \
	  -U $(POSTGRES_USER) -d $(POSTGRES_DB)