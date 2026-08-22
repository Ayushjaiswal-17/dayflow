package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	Env                string
	DatabaseURL        string
	JWTSecret          string
	JWTExpiryHours     int
	DefaultCompanyCode string
	CORSAllowedOrigins []string
}

func LoadConfig() *Config {
	// Attempt to load .env file if it exists, ignore error if missing (e.g. production env vars)
	if err := godotenv.Load(".env"); err != nil {
		// Also try loading from api/.env if run from root
		_ = godotenv.Load("api/.env")
	}

	port := getEnv("PORT", "8080")
	env := getEnv("ENV", "development")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable")
	jwtSecret := getEnv("JWT_SECRET", "super-secret-dayflow-jwt-token-key-change-in-production-2026")
	defaultCompanyCode := getEnv("DEFAULT_COMPANY_CODE", "DF")

	jwtExpiryHoursStr := getEnv("JWT_EXPIRY_HOURS", "72")
	jwtExpiryHours, err := strconv.Atoi(jwtExpiryHoursStr)
	if err != nil || jwtExpiryHours <= 0 {
		jwtExpiryHours = 72
	}

	corsOriginsStr := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
	var corsOrigins []string
	for _, origin := range strings.Split(corsOriginsStr, ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			corsOrigins = append(corsOrigins, trimmed)
		}
	}

	cfg := &Config{
		Port:               port,
		Env:                env,
		DatabaseURL:        dbURL,
		JWTSecret:          jwtSecret,
		JWTExpiryHours:     jwtExpiryHours,
		DefaultCompanyCode: defaultCompanyCode,
		CORSAllowedOrigins: corsOrigins,
	}

	log.Printf("[Config] Loaded configuration for env: %s on port: %s", cfg.Env, cfg.Port)
	return cfg
}

func getEnv(key, fallback string) string {
	if val, exists := os.LookupEnv(key); exists && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return fallback
}
