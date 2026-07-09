/**
 * P0.2 - Backend API Contract
 * ============================
 * 
 * StarClaim backend must expose these endpoints returning canonical StarIdentity objects
 * All API responses must conform to the unified star identity schema
 * 
 * Base URL: http://backend.local:8000/api
 */

/**
 * GET /api/stars/{starId}
 * 
 * Retrieve single star by ID
 * 
 * @param {string} starId - Star ID (e.g., "sirius-hip-32349", "hip:32349", or just "32349")
 * 
 * @returns {Object} Response
 * @returns {number} status - HTTP status (200, 404, 500)
 * @returns {StarIdentity} data - Canonical star identity
 * @returns {string} data.id - Unique ID
 * @returns {string} data.canonicalId - Versioned reference
 * @returns {number} data.raDegrees - RA in degrees
 * @returns {number} data.decDegrees - Dec in degrees
 * @returns {number} data.magnitude - Visual magnitude
 * @returns {string} data.spectralType - Spectral classification
 * 
 * @example
 * GET /api/stars/sirius-hip-32349
 * 
 * 200 OK
 * {
 *   "id": "sirius-hip-32349",
 *   "canonicalId": "hip:32349",
 *   "source": "hyg",
 *   "sourceId": "32349",
 *   "hip": "32349",
 *   "hd": "48915",
 *   "raDegrees": 101.2871,
 *   "decDegrees": -16.7161,
 *   "magnitude": -1.46,
 *   "spectralType": "A1V",
 *   "constellation": "CMa",
 *   "displayName": "Sirius",
 *   "slug": "sirius-hip-32349",
 *   "distanceParsec": 2.64,
 *   "status": "available"
 * }
 */

/**
 * GET /api/stars/resolve
 * 
 * Resolve star by multiple possible identifiers
 * One of: starId, hip, hd, gaiaSourceId, starClaimCode, slug, name
 * 
 * @query {string} [starId] - By unique ID
 * @query {string} [hip] - By Hipparcos ID (e.g., "32349")
 * @query {string} [hd] - By Henry Draper ID (e.g., "48915")
 * @query {string} [gaia] - By Gaia DR3 source_id
 * @query {string} [code] - By StarClaim code (e.g., "SIRIUS-001")
 * @query {string} [slug] - By URL slug
 * @query {string} [name] - By name (fuzzy match, case-insensitive)
 * 
 * @returns {Object} Response
 * @returns {number} status - HTTP status (200, 404, 422, 500)
 * @returns {StarIdentity} data - Canonical star identity (if found)
 * @returns {string} [error] - Error message (if not found)
 * @returns {string} [reason] - Why resolution failed
 * 
 * @example
 * GET /api/stars/resolve?hip=32349
 * GET /api/stars/resolve?code=SIRIUS-001
 * GET /api/stars/resolve?name=Sirius
 * 
 * 200 OK - same as GET /api/stars/{starId}
 * 
 * 404 Not Found
 * { "error": "Star not found", "reason": "No star with hip=999999" }
 * 
 * 422 Unprocessable Entity
 * { "error": "No query parameters provided" }
 */

/**
 * GET /api/stars
 * 
 * List/search stars with pagination and filters
 * 
 * @query {string} [search] - Search term (name, code, ID)
 * @query {number} [page] - Page number (default 1)
 * @query {number} [pageSize] - Items per page (default 20, max 100)
 * @query {string} [constellation] - Filter by 3-letter constellation code
 * @query {string} [status] - Filter by status (available, owned, reserved, featured)
 * @query {number} [magMin] - Magnitude filter minimum
 * @query {number} [magMax] - Magnitude filter maximum
 * @query {number} [distMin] - Distance filter minimum (parsecs)
 * @query {number} [distMax] - Distance filter maximum (parsecs)
 * @query {string} [sort] - Sort field (magnitude, distance, name; prefix - for descending)
 * 
 * @returns {Object} Response
 * @returns {number} status - HTTP status (200, 400, 500)
 * @returns {Array<StarIdentity>} data - Array of canonical stars
 * @returns {Object} pagination
 * @returns {number} pagination.page - Current page
 * @returns {number} pagination.pageSize - Items per page
 * @returns {number} pagination.total - Total matching count
 * @returns {number} pagination.totalPages - Calculated pages
 * @returns {Array<string>} [filters] - Applied filters (debug)
 * 
 * @example
 * GET /api/stars?search=sirius&page=1&pageSize=50
 * 
 * 200 OK
 * {
 *   "data": [
 *     { "id": "sirius-hip-32349", ... },
 *     ...
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "pageSize": 50,
 *     "total": 10000,
 *     "totalPages": 200
 *   },
 *   "filters": ["search=sirius"]
 * }
 */

/**
 * GET /api/stars/bulk
 * 
 * Retrieve multiple stars by IDs
 * 
 * @body {Array<string>} ids - Array of star IDs (max 100)
 * 
 * @returns {Object} Response
 * @returns {number} status - HTTP status (200, 400, 500)
 * @returns {Array<StarIdentity>} found - Successfully resolved stars
 * @returns {Array<string>} notFound - IDs that didn't match
 * @returns {Object} stats
 * @returns {number} stats.requested - How many IDs requested
 * @returns {number} stats.found - How many resolved
 * @returns {number} stats.notFound - How many failed
 * 
 * @example
 * POST /api/stars/bulk
 * { "ids": ["sirius-hip-32349", "vega-hip-91262", "unknown-id"] }
 * 
 * 200 OK
 * {
 *   "found": [
 *     { "id": "sirius-hip-32349", ... },
 *     { "id": "vega-hip-91262", ... }
 *   ],
 *   "notFound": ["unknown-id"],
 *   "stats": {
 *     "requested": 3,
 *     "found": 2,
 *     "notFound": 1
 *   }
 * }
 */

/**
 * GET /api/stars/owned
 * 
 * List stars owned by authenticated user
 * Requires: Authorization header with JWT token
 * 
 * @query {number} [page] - Page number (default 1)
 * @query {number} [pageSize] - Items per page (default 20, max 100)
 * @query {string} [sort] - Sort field (purchaseDate, name)
 * 
 * @returns {Object} Response
 * @returns {Array<Object>} data - Array of owned stars with ownership metadata
 * @returns {string} data[].id - Star ID
 * @returns {StarIdentity} data[].star - Full canonical star identity
 * @returns {Object} data[].ownership - Ownership details
 * @returns {string} data[].ownership.orderId - Order/purchase ID
 * @returns {Date} data[].ownership.purchaseDate - When purchased
 * @returns {string} data[].ownership.status - Ownership status
 * 
 * @example
 * GET /api/stars/owned?pageSize=20
 * Authorization: Bearer {jwt_token}
 * 
 * 200 OK
 * {
 *   "data": [
 *     {
 *       "id": "sirius-hip-32349",
 *       "star": { "id": "sirius-hip-32349", ... },
 *       "ownership": {
 *         "orderId": "order_abc123",
 *         "purchaseDate": "2025-06-15T10:30:00Z",
 *         "status": "owned"
 *       }
 *     }
 *   ],
 *   "pagination": { ... }
 * }
 * 
 * 401 Unauthorized
 * { "error": "Authentication required" }
 */

/**
 * Error Response Format (Consistent)
 * 
 * @example
 * 404 Not Found
 * {
 *   "error": "Star not found",
 *   "reason": "No star with id=unknown-id",
 *   "code": "STAR_NOT_FOUND",
 *   "timestamp": "2025-07-06T10:15:30Z"
 * }
 * 
 * 400 Bad Request
 * {
 *   "error": "Invalid request",
 *   "reason": "pageSize must be between 1 and 100",
 *   "code": "VALIDATION_ERROR",
 *   "field": "pageSize"
 * }
 * 
 * 500 Internal Server Error
 * {
 *   "error": "Internal server error",
 *   "code": "SERVER_ERROR",
 *   "requestId": "req_xyz789"
 * }
 */

// Export for reference
export const API_CONTRACT = {
  baseUrl: 'http://backend.local:8000/api',
  endpoints: {
    getStar: {
      method: 'GET',
      path: '/stars/{starId}',
      description: 'Retrieve single star',
    },
    resolveStar: {
      method: 'GET',
      path: '/stars/resolve',
      description: 'Resolve star by multiple identifiers',
    },
    listStars: {
      method: 'GET',
      path: '/stars',
      description: 'List/search stars with pagination',
    },
    bulkStars: {
      method: 'POST',
      path: '/stars/bulk',
      description: 'Retrieve multiple stars',
    },
    ownedStars: {
      method: 'GET',
      path: '/stars/owned',
      description: 'List user owned stars (auth required)',
    },
  },
  schemaVersion: 1,
  canonicalModel: 'StarIdentity',
};

export default API_CONTRACT;
