package routes

import (
	"net/http"

	"dayflow/internal/config"
	"dayflow/internal/domain"
	"dayflow/internal/handler"
	"dayflow/internal/middleware"
	"github.com/gin-gonic/gin"
)

type RouterDependencies struct {
	Config            *config.Config
	AuthHandler       *handler.AuthHandler
	EmployeeHandler   *handler.EmployeeHandler
	AttendanceHandler *handler.AttendanceHandler
	TimeOffHandler    *handler.TimeOffHandler
	SalaryHandler     *handler.SalaryHandler
	DashboardHandler  *handler.DashboardHandler
}

func SetupRouter(deps *RouterDependencies) *gin.Engine {
	if deps.Config.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global Middlewares
	r.Use(middleware.LoggerMiddleware())
	r.Use(middleware.RecoveryMiddleware())
	r.Use(middleware.CORSMiddleware(deps.Config.CORSAllowedOrigins))

	// Health Check / Ping
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"app":     "dayflow-backend",
			"version": "1.0.0",
		})
	})
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	api := r.Group("/api/v1")
	{
		// -------------------------------------------------------------
		// Public Auth Routes
		// -------------------------------------------------------------
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/signup-company", deps.AuthHandler.SignUpCompany)
			authGroup.POST("/login", deps.AuthHandler.Login)
		}

		// Public Utilities
		api.POST("/salary/calculate-preview", deps.SalaryHandler.CalculatePreview)

		// -------------------------------------------------------------
		// Authenticated Routes
		// -------------------------------------------------------------
		authenticated := api.Group("")
		authenticated.Use(middleware.AuthMiddleware(deps.Config.JWTSecret))
		{
			// Auth me & password reset
			authenticated.GET("/auth/me", deps.AuthHandler.GetMe)
			authenticated.POST("/auth/change-password", deps.AuthHandler.ChangePassword)

			// Dashboard Stats
			authenticated.GET("/dashboard/stats", deps.DashboardHandler.GetStats)

			// Employees
			employees := authenticated.Group("/employees")
			{
				// Admin / HR only: list all employees and create new employees
				employees.GET("", middleware.RequireAdminOrHR(), deps.EmployeeHandler.List)
				employees.POST("", middleware.RequireAdminOrHR(), deps.EmployeeHandler.Create)

				// Profiles (Employee can view/edit allowed fields; Admin can view/edit all)
				employees.GET("/:id", deps.EmployeeHandler.GetByID)
				employees.PUT("/:id", deps.EmployeeHandler.Update)

				// Skills
				employees.POST("/:id/skills", deps.EmployeeHandler.AddSkill)
				employees.DELETE("/:id/skills/:skillId", deps.EmployeeHandler.DeleteSkill)

				// Certifications
				employees.POST("/:id/certifications", deps.EmployeeHandler.AddCertification)
				employees.DELETE("/:id/certifications/:certId", deps.EmployeeHandler.DeleteCertification)

				// Documents
				employees.POST("/:id/documents", deps.EmployeeHandler.AddDocument)
			}

			// Attendance
			attendance := authenticated.Group("/attendance")
			{
				attendance.POST("/check-in", deps.AttendanceHandler.CheckIn)
				attendance.POST("/check-out", deps.AttendanceHandler.CheckOut)
				attendance.GET("/my", deps.AttendanceHandler.GetMyAttendance)
				attendance.GET("/summary", deps.AttendanceHandler.GetSummary)
				attendance.GET("", middleware.RequireAdminOrHR(), deps.AttendanceHandler.ListAll)
			}

			// Time Off / Leaves
			timeOff := authenticated.Group("/timeoff")
			{
				timeOff.GET("/types", deps.TimeOffHandler.GetTypes)
				timeOff.GET("/allocations", deps.TimeOffHandler.GetAllocations)
				timeOff.POST("/requests", deps.TimeOffHandler.CreateRequest)
				timeOff.GET("/requests", deps.TimeOffHandler.ListRequests)

				// Admin / HR approval and allocation management
				timeOff.PATCH("/requests/:id/review", middleware.RequireAdminOrHR(), deps.TimeOffHandler.ReviewRequest)
				timeOff.POST("/allocations", middleware.RequireAdminOrHR(), deps.TimeOffHandler.UpsertAllocation)
			}

			// Salary & Payroll
			salary := authenticated.Group("/salary")
			{
				salary.GET("/my", deps.SalaryHandler.GetMySalary)
				salary.GET("/employees/:id", middleware.RequireAdminOrHR(), deps.SalaryHandler.GetEmployeeSalary)
				salary.POST("/employees/:id", middleware.RequireRoles(domain.RoleAdmin), deps.SalaryHandler.UpsertSalaryStructure)
			}
		}
	}

	return r
}
