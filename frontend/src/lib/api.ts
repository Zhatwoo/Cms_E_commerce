/**
 * Public API barrel.
 *
 * The api client is split by resource under `lib/api/`:
 *   - _core   : fetch primitives, types (User/AuthResponse/ApiError/ApiMessage),
 *               token + active-project state, getApiUrl
 *   - auth    : login/register/verify, getMe, profile, password,
 *               billing links, avatar, admin user creation,
 *               published-site (storefront) auth
 *   - projects: project CRUD + trash/restore + storage,
 *               media upload/delete, publish/unpublish/schedule,
 *               custom domains
 *   - products: product CRUD + image upload + admin moderation
 *   - inventory: stock summary, movements, adjustments, CSV import
 *   - orders  : dashboard + storefront orders, payment intents
 *   - admin   : domain management, client admin, platform analytics,
 *               shared notifications, messages, chat
 *
 * Existing imports `from "@/lib/api"` continue to work; this barrel
 * re-exports every public symbol from the modules above.
 */

export * from "./api/_core";
export * from "./api/auth";
export * from "./api/projects";
export * from "./api/products";
export * from "./api/inventory";
export * from "./api/orders";
export * from "./api/admin";

import { getMe, updateProfile } from "./api/auth";

const api = { getMe, updateProfile };
export default api;
