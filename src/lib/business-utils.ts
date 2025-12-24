import { Business } from "./types";
import { generateShortUrlCode } from "./qr-utils";

/**
 * Get business by review code
 */
export function getBusinessByCode(code: string, businesses: Business[]): Business | undefined {
  return businesses.find((business) => {
    const businessCode = generateShortUrlCode(business.id);
    return businessCode === code;
  });
}

