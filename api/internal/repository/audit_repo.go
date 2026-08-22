package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"dayflow/internal/database"
	"dayflow/internal/domain"
	"github.com/google/uuid"
)

type AuditRepository struct {
	db *database.DB
}

func NewAuditRepository(db *database.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) Log(ctx context.Context, actorID *uuid.UUID, action, entityTable string, entityID *uuid.UUID, metadata any) error {
	var metaBytes []byte
	var err error
	if metadata != nil {
		metaBytes, err = json.Marshal(metadata)
		if err != nil {
			metaBytes = []byte("{}")
		}
	} else {
		metaBytes = []byte("{}")
	}

	query := `
		INSERT INTO audit_logs (id, actor_id, action, entity_table, entity_id, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`
	_, err = r.db.Pool.Exec(ctx, query, uuid.New(), actorID, action, entityTable, entityID, metaBytes)
	if err != nil {
		return fmt.Errorf("failed to write audit log: %w", err)
	}
	return nil
}

func (r *AuditRepository) GetRecent(ctx context.Context, limit int) ([]domain.AuditLog, error) {
	if limit <= 0 {
		limit = 20
	}
	query := `
		SELECT id, actor_id, action, entity_table, entity_id, metadata, created_at
		FROM audit_logs
		ORDER BY created_at DESC
		LIMIT $1
	`
	rows, err := r.db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit logs: %w", err)
	}
	defer rows.Close()

	var logs []domain.AuditLog
	for rows.Next() {
		var l domain.AuditLog
		if err := rows.Scan(&l.ID, &l.ActorID, &l.Action, &l.EntityTable, &l.EntityID, &l.Metadata, &l.CreatedAt); err == nil {
			logs = append(logs, l)
		}
	}
	return logs, nil
}
