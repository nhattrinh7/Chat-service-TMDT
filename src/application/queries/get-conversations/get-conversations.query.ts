import { SenderType } from '~/domain/enums/chat.enum'

export class GetConversationsQuery {
  constructor(
    public readonly participantId: string,
    public readonly participantType: SenderType,
    public readonly cursor?: string,
    public readonly limit?: number,
  ) {}
}
