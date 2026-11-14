import { z } from "zod"

export const PostCheckSchema = z.object({
  title: z.string().trim().min(3, "Name the place").max(80, "Keep the name under 80 characters"),
  lat: z.coerce.number().min(-90, "Enter a valid latitude").max(90, "Enter a valid latitude"),
  lng: z.coerce.number().min(-180, "Enter a valid longitude").max(180, "Enter a valid longitude"),
  radius_m: z.coerce.number().int().min(25).max(2000),
  instructions: z.string().trim().min(10, "Say what to photograph").max(600, "Keep it under 600 characters"),
  expected_text: z.string().trim().max(60, "Keep the sign text under 60 characters"),
  duration_mins: z.coerce.number().int().min(30).max(1440),
  pay: z.coerce.number().min(0.5, "Pay at least 0.50 USDC").max(25, "Pay at most 25.00 USDC"),
})

export type PostCheckInput = z.input<typeof PostCheckSchema>
