import { SenderType } from '~/domain/enums/chat.enum'

export class MarkAsReadCommand {
  constructor(
    public readonly conversationId: string,
    public readonly readById: string,
    public readonly readByType: SenderType,
  ) {}
}
