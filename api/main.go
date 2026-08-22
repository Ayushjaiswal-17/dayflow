package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"dayflow/internal/config"
	"dayflow/internal/database"
	"dayflow/internal/handler"
	"dayflow/internal/repository"
	"dayflow/internal/routes"
	"dayflow/internal/service"
)

func main() {
	log.Println("==================================================")
	log.Println("           Dayflow HRMS Backend Starting          ")
	log.Println("==================================================")

	// 1. Load Configuration
	cfg := config.LoadConfig()

	// 2. Connect to PostgreSQL (Supabase)
	db, err := database.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[FATAL] Could not initialize PostgreSQL pool: %v", err)
	}
	defer db.Close()

	// 3. Initialize Repositories
	companyRepo := repository.NewCompanyRepository(db)
	employeeRepo := repository.NewEmployeeRepository(db)
	attendanceRepo := repository.NewAttendanceRepository(db)
	salaryRepo := repository.NewSalaryRepository(db)
	timeOffRepo := repository.NewTimeOffRepository(db)
	auditRepo := repository.NewAuditRepository(db)

	// 4. Initialize Services
	authService := service.NewAuthService(cfg, db, companyRepo, employeeRepo, timeOffRepo, auditRepo)
	employeeService := service.NewEmployeeService(cfg, db, employeeRepo, companyRepo, salaryRepo, timeOffRepo, auditRepo)
	attendanceService := service.NewAttendanceService(attendanceRepo, auditRepo)
	timeOffService := service.NewTimeOffService(timeOffRepo, employeeRepo, auditRepo)
	salaryService := service.NewSalaryService(salaryRepo, auditRepo)
	dashboardService := service.NewDashboardService(employeeRepo, attendanceRepo, timeOffRepo, auditRepo)

	// 5. Initialize Handlers
	authHandler := handler.NewAuthHandler(authService)
	employeeHandler := handler.NewEmployeeHandler(employeeService)
	attendanceHandler := handler.NewAttendanceHandler(attendanceService)
	timeOffHandler := handler.NewTimeOffHandler(timeOffService)
	salaryHandler := handler.NewSalaryHandler(salaryService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)

	// 6. Setup Router & Routes
	router := routes.SetupRouter(&routes.RouterDependencies{
		Config:            cfg,
		AuthHandler:       authHandler,
		EmployeeHandler:   employeeHandler,
		AttendanceHandler: attendanceHandler,
		TimeOffHandler:    timeOffHandler,
		SalaryHandler:     salaryHandler,
		DashboardHandler:  dashboardHandler,
	})

	// 7. Start HTTP Server with Graceful Shutdown
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[Server] Listening on http://localhost:%s\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[FATAL] Server listening error: %v", err)
		}
	}()

	// Graceful shutdown on SIGINT / SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[Server] Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[FATAL] Server forced shutdown: %v", err)
	}

	log.Println("[Server] Dayflow backend stopped cleanly.")
}
