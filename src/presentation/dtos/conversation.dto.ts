import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const GetConversationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(50)),
  type: z.enum(['user', 'shop']).optional(),
  shopId: z.uuid().optional(),
})
export class GetConversationsQueryDto extends createZodDto(GetConversationsQuerySchema) {}
