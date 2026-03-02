.PHONY: help backup restore test-restore test-restore-postgres health-check init build verify

help:
	@echo "Omega Infrastructure Backup System"
	@echo ""
	@echo "Commands:"
	@echo "  make build              - Build backup container"
	@echo "  make init              - Initialize restic repository"
	@echo "  make backup            - Run manual backup"
	@echo "  make restore           - Restore from backup (requires COMPONENT arg)"
	@echo "  make test-restore      - Test restore (dry-run)"
	@echo "  make test-restore-postgres - Postgres restore smoke test"
	@echo "  make health-check      - Check backup system health"
	@echo "  make verify            - Run full verification checklist"
	@echo "  make logs              - View backup logs"
	@echo "  make snapshots         - List backup snapshots"

build:
	docker compose -f compose/backup.yml build

init:
	docker compose -f compose/backup.yml run --rm backup restic init

backup:
	docker compose -f compose/backup.yml run --rm backup /backups/backup.sh

restore:
	@if [ -z "$(COMPONENT)" ]; then \
		echo "Usage: make restore COMPONENT=<postgres|redis|volumes|configs|all> [SNAPSHOT=<id>]"; \
		exit 1; \
	fi
	./scripts/restore.sh $(COMPONENT) $(SNAPSHOT)

test-restore:
	@if [ -z "$(COMPONENT)" ]; then \
		./scripts/test-restore.sh all; \
	else \
		./scripts/test-restore.sh $(COMPONENT); \
	fi

test-restore-postgres:
	./scripts/test-restore-postgres.sh

health-check:
	./scripts/health-check.sh

logs:
	docker compose -f compose/backup.yml logs -f backup

snapshots:
	docker compose -f compose/backup.yml exec backup restic snapshots

check:
	docker compose -f compose/backup.yml exec backup restic check

stats:
	docker compose -f compose/backup.yml exec backup restic stats

verify:
	./scripts/verify.sh
