import { SenderType } from '~/domain/enums/chat.enum'

export class GetUnreadCountQuery {
  constructor(
    public readonly participantId: string,
    public readonly participantType: SenderType,
  ) {}
}
