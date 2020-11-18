import { error, debug } from "./logger";

/**
 * Create success response
 * @param {string} text Response text
 */
async function successResponse(message) {
  await debug("successResponse", message, { message });
  return textResponse(true, message, 200);
}

/**
 * Create error response
 * @param {string} text Error text
 * @param {number} status Status code
 */
async function errorResponse(message, status = 404) {
  await error("errorResponse", message, { message, status });
  return textResponse(false, message, status);
}

/**
 * Create text response
 * @param {Boolean} success Is success?
 * @param {string} text Error text
 * @param {number} status Status code
 */
function textResponse(success, message, status = 404) {
  return new Response(
    JSON.stringify({
      success: success,
      message: message,
      status: status
    }),
    {
      status: status,
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json"
      }
    }
  );
}

export { errorResponse, successResponse };
