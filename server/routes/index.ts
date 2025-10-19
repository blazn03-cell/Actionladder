// Barrel file for all route modules
// This provides clean imports: import { registerAuthRoutes } from './routes'

export { registerAdminRoutes, registerOperatorRoutes, payStaffFromInvoice } from "./admin.routes";
export { registerAuthRoutes } from "./auth.routes";
export { setupChallengeCalendarRoutes } from "./challengeCalendar.routes";
export { setupForgotPasswordRoutes } from "./forgotPassword.routes";
export { registerHallRoutes } from "./hall.routes";
export { createICalRoutes } from "./ical.routes";
export { setupPaymentOnboardingRoutes } from "./paymentOnboarding.routes";
export { createPosterRoutes } from "./poster.routes";
export { registerQuickChallengeRoutes } from "./quickChallenge.routes";
export { registerRevenueAdminRoutes } from "./revenueAdmin.routes";
