/**
 * Zod schemas for API request validation.
 * Use in route handlers with .safeParse(); on failure return 400 with same error shape.
 */
import { z } from "zod";

/** POST /api/qr/validate body */
export const validateQrBodySchema = z.object({
  qr_data: z.string().min(1, "qr_data is required").transform((s) => s.trim()),
});

/** POST /api/gbp/auth-sessions body */
export const gbpAuthSessionBodySchema = z.object({
  business_name: z.string().min(1, "business_name is required"),
  business_phone: z.string().min(1, "business_phone is required"),
  place_id: z.string().optional().nullable(),
});

export type ValidateQrBody = z.infer<typeof validateQrBodySchema>;
export type GbpAuthSessionBody = z.infer<typeof gbpAuthSessionBodySchema>;
