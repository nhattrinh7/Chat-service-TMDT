import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const GetMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100)),
})
export class GetMessagesQueryDto extends createZodDto(GetMessagesQuerySchema) {}
