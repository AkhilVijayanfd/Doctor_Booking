const errorResponses = {
  BadRequest: {
    description: "Validation failed",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
      },
    },
  },
  Unauthorized: {
    description: "Authentication token is missing, invalid, or expired",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  },
  Forbidden: {
    description: "The authenticated user does not have the required role",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  },
  NotFound: {
    description: "The requested record was not found",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  },
  Conflict: {
    description: "The request conflicts with an existing record or booking",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  },
};

const response = (description, dataSchema, message = true) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          ...(message ? { message: { type: "string" } } : {}),
          data: dataSchema,
        },
      },
    },
  },
});

const mutationBody = (schema, required = true) => ({
  required,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const adminSecurity = [{ bearerAuth: [] }];
const userSecurity = [{ bearerAuth: [] }];

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Doctor Booking API",
    version: "1.0.0",
    description: "REST API for clinic configuration, doctor scheduling, available slots, and user appointments.",
  },
  servers: [{ url: "http://localhost:5000", description: "Local development server" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Clinic", description: "ADMIN clinic configuration" },
    { name: "Doctors", description: "Public doctor lookup and ADMIN management" },
    { name: "Availability", description: "ADMIN recurring availability and unavailability" },
    { name: "Slots", description: "Public available-slot lookup" },
    { name: "Appointments", description: "USER appointment booking and lookup" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: { 200: { description: "API is running" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a USER account",
        requestBody: mutationBody("RegisterRequest"),
        responses: {
          201: response("User registered successfully", { $ref: "#/components/schemas/User" }),
          400: errorResponses.BadRequest,
          409: errorResponses.Conflict,
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: mutationBody("LoginRequest"),
        responses: {
          200: response("Login successful", { $ref: "#/components/schemas/LoginData" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the authenticated user",
        security: userSecurity,
        responses: {
          200: response("Current user", { $ref: "#/components/schemas/User" }, false),
          401: errorResponses.Unauthorized,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/admin/clinic": {
      post: {
        tags: ["Clinic"],
        summary: "Create the clinic",
        description: "ADMIN only.",
        security: adminSecurity,
        requestBody: mutationBody("ClinicRequest"),
        responses: {
          201: response("Clinic created successfully", { $ref: "#/components/schemas/Clinic" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          409: errorResponses.Conflict,
        },
      },
      get: {
        tags: ["Clinic"],
        summary: "Get the clinic",
        description: "ADMIN only.",
        security: adminSecurity,
        responses: {
          200: response("Clinic retrieved successfully", { $ref: "#/components/schemas/Clinic" }),
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
        },
      },
      put: {
        tags: ["Clinic"],
        summary: "Update the clinic",
        description: "ADMIN only. The current validator requires both name and timezone.",
        security: adminSecurity,
        requestBody: mutationBody("ClinicRequest"),
        responses: {
          200: response("Clinic updated successfully", { $ref: "#/components/schemas/Clinic" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/doctors": {
      get: {
        tags: ["Doctors"],
        summary: "List active doctors",
        responses: {
          200: response("Doctors retrieved successfully", { type: "array", items: { $ref: "#/components/schemas/Doctor" } }),
        },
      },
    },
    "/api/doctors/{id}": {
      get: {
        tags: ["Doctors"],
        summary: "Get an active doctor",
        parameters: [{ $ref: "#/components/parameters/DoctorId" }],
        responses: {
          200: response("Doctor retrieved successfully", { $ref: "#/components/schemas/Doctor" }),
          400: errorResponses.BadRequest,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/admin/doctors/{id}": {
      put: {
        tags: ["Doctors"],
        summary: "Update a doctor",
        description: "ADMIN only. At least one doctor field must be supplied.",
        security: adminSecurity,
        parameters: [{ $ref: "#/components/parameters/DoctorId" }],
        requestBody: mutationBody("DoctorUpdateRequest"),
        responses: {
          200: response("Doctor updated successfully", { $ref: "#/components/schemas/Doctor" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
          409: errorResponses.Conflict,
        },
      },
    },
    "/api/admin/doctors": {
      post: {
        tags: ["Doctors"],
        summary: "Create a doctor",
        description: "ADMIN only.",
        security: adminSecurity,
        requestBody: mutationBody("DoctorRequest"),
        responses: {
          201: response("Doctor created successfully", { $ref: "#/components/schemas/Doctor" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          409: errorResponses.Conflict,
        },
      },
    },
    "/api/admin/doctors/{doctorId}/availability": {
      post: {
        tags: ["Availability"],
        summary: "Create recurring doctor availability",
        description: "ADMIN only. dayOfWeek uses 0 for Sunday through 6 for Saturday.",
        security: adminSecurity,
        parameters: [{ $ref: "#/components/parameters/DoctorId" }],
        requestBody: mutationBody("AvailabilityRequest"),
        responses: {
          201: response("Doctor availability created successfully", { $ref: "#/components/schemas/Availability" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
          409: errorResponses.Conflict,
        },
      },
      get: {
        tags: ["Availability"],
        summary: "List recurring doctor availability",
        description: "ADMIN only.",
        security: adminSecurity,
        parameters: [{ $ref: "#/components/parameters/DoctorId" }],
        responses: {
          200: response("Doctor availability retrieved successfully", { type: "array", items: { $ref: "#/components/schemas/Availability" } }),
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/admin/doctors/{doctorId}/availability/{availabilityId}": {
      put: {
        tags: ["Availability"],
        summary: "Update recurring doctor availability",
        description: "ADMIN only. At least one availability field must be supplied.",
        security: adminSecurity,
        parameters: [
          { $ref: "#/components/parameters/DoctorId" },
          { $ref: "#/components/parameters/AvailabilityId" },
        ],
        requestBody: mutationBody("AvailabilityUpdateRequest"),
        responses: {
          200: response("Doctor availability updated successfully", { $ref: "#/components/schemas/Availability" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
          409: errorResponses.Conflict,
        },
      },
      delete: {
        tags: ["Availability"],
        summary: "Delete recurring doctor availability",
        description: "ADMIN only.",
        security: adminSecurity,
        parameters: [
          { $ref: "#/components/parameters/DoctorId" },
          { $ref: "#/components/parameters/AvailabilityId" },
        ],
        responses: {
          200: response("Doctor availability deleted successfully", { type: "object", additionalProperties: false }, true),
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/admin/doctors/{doctorId}/unavailability": {
      post: {
        tags: ["Availability"],
        summary: "Create doctor unavailability",
        description: "ADMIN only. Datetimes are clinic-local and must not include an offset.",
        security: adminSecurity,
        parameters: [{ $ref: "#/components/parameters/DoctorId" }],
        requestBody: mutationBody("UnavailabilityRequest"),
        responses: {
          201: response("Doctor unavailability created successfully", { $ref: "#/components/schemas/Unavailability" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
          409: errorResponses.Conflict,
        },
      },
      get: {
        tags: ["Availability"],
        summary: "List doctor unavailability",
        description: "ADMIN only.",
        security: adminSecurity,
        parameters: [{ $ref: "#/components/parameters/DoctorId" }],
        responses: {
          200: response("Doctor unavailability retrieved successfully", { type: "array", items: { $ref: "#/components/schemas/Unavailability" } }),
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/admin/doctors/{doctorId}/unavailability/{unavailabilityId}": {
      put: {
        tags: ["Availability"],
        summary: "Update doctor unavailability",
        description: "ADMIN only. At least one unavailability field must be supplied.",
        security: adminSecurity,
        parameters: [
          { $ref: "#/components/parameters/DoctorId" },
          { $ref: "#/components/parameters/UnavailabilityId" },
        ],
        requestBody: mutationBody("UnavailabilityUpdateRequest"),
        responses: {
          200: response("Doctor unavailability updated successfully", { $ref: "#/components/schemas/Unavailability" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
          409: errorResponses.Conflict,
        },
      },
      delete: {
        tags: ["Availability"],
        summary: "Delete doctor unavailability",
        description: "ADMIN only.",
        security: adminSecurity,
        parameters: [
          { $ref: "#/components/parameters/DoctorId" },
          { $ref: "#/components/parameters/UnavailabilityId" },
        ],
        responses: {
          200: response("Doctor unavailability deleted successfully", { type: "object", additionalProperties: false }, true),
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/doctors/{doctorId}/slots": {
      get: {
        tags: ["Slots"],
        summary: "Get available slots for a doctor and date",
        parameters: [
          { $ref: "#/components/parameters/DoctorId" },
          {
            name: "date",
            in: "query",
            required: true,
            schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", example: "2026-09-20" },
            description: "Clinic-local date in YYYY-MM-DD format.",
          },
        ],
        responses: {
          200: response("Available slots fetched successfully", { $ref: "#/components/schemas/SlotsResponse" }),
          400: errorResponses.BadRequest,
          404: errorResponses.NotFound,
        },
      },
    },
    "/api/appointments": {
      post: {
        tags: ["Appointments"],
        summary: "Book an appointment",
        description: "USER only. startAt is a clinic-local datetime without a timezone offset.",
        security: userSecurity,
        requestBody: mutationBody("AppointmentRequest"),
        responses: {
          201: response("Appointment booked successfully", { $ref: "#/components/schemas/Appointment" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
          409: errorResponses.Conflict,
        },
      },
      get: {
        tags: ["Appointments"],
        summary: "List the authenticated user's appointments",
        description: "USER only.",
        security: userSecurity,
        responses: {
          200: response("Appointments retrieved successfully", { type: "array", items: { $ref: "#/components/schemas/Appointment" } }),
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
        },
      },
    },
    "/api/appointments/{id}": {
      get: {
        tags: ["Appointments"],
        summary: "Get one of the authenticated user's appointments",
        description: "USER only.",
        security: userSecurity,
        parameters: [{ $ref: "#/components/parameters/AppointmentId" }],
        responses: {
          200: response("Appointment retrieved successfully", { $ref: "#/components/schemas/Appointment" }),
          400: errorResponses.BadRequest,
          401: errorResponses.Unauthorized,
          403: errorResponses.Forbidden,
          404: errorResponses.NotFound,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter the JWT returned by POST /api/auth/login. Swagger UI adds the Bearer prefix.",
      },
    },
    parameters: {
      DoctorId: { name: "doctorId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      AvailabilityId: { name: "availabilityId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      UnavailabilityId: { name: "unavailabilityId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      AppointmentId: { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["success", "message"],
        properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
      },
      ValidationError: {
        allOf: [
          { $ref: "#/components/schemas/Error" },
          {
            type: "object",
            required: ["errors"],
            properties: {
              errors: {
                type: "array",
                items: {
                  type: "object",
                  required: ["field", "message"],
                  properties: { field: { type: "string" }, message: { type: "string" } },
                },
              },
            },
          },
        ],
      },
      User: {
        type: "object",
        required: ["id", "name", "email", "role"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "USER"] },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", maxLength: 120 },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 8, example: "Password@123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string", format: "password" } },
      },
      LoginData: {
        type: "object",
        required: ["token", "user"],
        properties: { token: { type: "string" }, user: { $ref: "#/components/schemas/User" } },
      },
      Clinic: {
        type: "object",
        required: ["id", "name", "timezone"],
        properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, timezone: { type: "string", example: "Asia/Kolkata" } },
      },
      ClinicRequest: {
        type: "object",
        required: ["name", "timezone"],
        properties: { name: { type: "string", maxLength: 160 }, timezone: { type: "string", example: "Asia/Kolkata" } },
      },
      Doctor: {
        type: "object",
        required: ["id", "name", "specialization", "email", "is_active"],
        properties: {
          id: { type: "string", format: "uuid" }, name: { type: "string" }, specialization: { type: "string" },
          email: { type: "string", format: "email" }, phone: { type: "string", nullable: true }, is_active: { type: "boolean" },
        },
      },
      DoctorRequest: {
        type: "object",
        required: ["name", "specialization", "email"],
        properties: { name: { type: "string" }, specialization: { type: "string" }, email: { type: "string", format: "email" }, phone: { type: "string", nullable: true } },
      },
      DoctorUpdateRequest: {
        type: "object",
        minProperties: 1,
        properties: { name: { type: "string" }, specialization: { type: "string" }, email: { type: "string", format: "email" }, phone: { type: "string", nullable: true }, is_active: { type: "boolean" } },
      },
      Availability: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" }, doctorId: { type: "string", format: "uuid" }, dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
          startTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "09:00" }, endTime: { type: "string", example: "13:00" }, slotDurationMinutes: { type: "integer", minimum: 1, example: 30 },
        },
      },
      AvailabilityRequest: {
        type: "object",
        required: ["dayOfWeek", "startTime", "endTime", "slotDurationMinutes"],
        properties: { dayOfWeek: { type: "integer", minimum: 0, maximum: 6 }, startTime: { type: "string", example: "09:00" }, endTime: { type: "string", example: "13:00" }, slotDurationMinutes: { type: "integer", minimum: 1, example: 30 } },
      },
      AvailabilityUpdateRequest: {
        type: "object",
        minProperties: 1,
        properties: { dayOfWeek: { type: "integer", minimum: 0, maximum: 6 }, startTime: { type: "string" }, endTime: { type: "string" }, slotDurationMinutes: { type: "integer", minimum: 1 } },
      },
      Unavailability: {
        type: "object",
        properties: { id: { type: "string", format: "uuid" }, doctorId: { type: "string", format: "uuid" }, type: { type: "string", enum: ["BREAK", "LEAVE", "OTHER"] }, startAt: { type: "string", format: "date-time" }, endAt: { type: "string", format: "date-time" }, reason: { type: "string", nullable: true } },
      },
      UnavailabilityRequest: {
        type: "object",
        required: ["type", "startAt", "endAt"],
        properties: { type: { type: "string", enum: ["BREAK", "LEAVE", "OTHER"] }, startAt: { type: "string", example: "2026-09-20T13:00:00" }, endAt: { type: "string", example: "2026-09-20T14:00:00" }, reason: { type: "string", nullable: true, maxLength: 500 } },
      },
      UnavailabilityUpdateRequest: {
        type: "object",
        minProperties: 1,
        properties: { type: { type: "string", enum: ["BREAK", "LEAVE", "OTHER"] }, startAt: { type: "string" }, endAt: { type: "string" }, reason: { type: "string", nullable: true, maxLength: 500 } },
      },
      Slot: {
        type: "object",
        required: ["startAt", "endAt"],
        properties: { startAt: { type: "string", format: "date-time" }, endAt: { type: "string", format: "date-time" } },
      },
      SlotsResponse: {
        type: "object",
        required: ["doctor", "date", "timezone", "slots"],
        properties: { doctor: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, specialization: { type: "string" } } }, date: { type: "string", example: "2026-09-20" }, timezone: { type: "string", example: "Asia/Kolkata" }, slots: { type: "array", items: { $ref: "#/components/schemas/Slot" } } },
      },
      AppointmentRequest: {
        type: "object",
        required: ["doctorId", "startAt"],
        properties: { doctorId: { type: "string", format: "uuid" }, startAt: { type: "string", example: "2026-09-20T09:00:00" } },
      },
      Appointment: {
        type: "object",
        required: ["id", "doctor", "startAt", "endAt", "status"],
        properties: { id: { type: "string", format: "uuid" }, doctor: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" }, specialization: { type: "string" } } }, startAt: { type: "string", format: "date-time" }, endAt: { type: "string", format: "date-time" }, status: { type: "string", example: "BOOKED" } },
      },
    },
  },
};

export default swaggerSpec;
