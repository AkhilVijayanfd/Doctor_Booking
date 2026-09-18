import { rateLimit } from "express-rate-limit";

const rateLimitOptions = (max) => ({
  windowMs: 15 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
});

const authenticationRateLimiter = rateLimit(rateLimitOptions(10));
const bookingRateLimiter = rateLimit(rateLimitOptions(30));
const sensitiveMutationRateLimiter = rateLimit(rateLimitOptions(60));

export { authenticationRateLimiter, bookingRateLimiter, sensitiveMutationRateLimiter };
