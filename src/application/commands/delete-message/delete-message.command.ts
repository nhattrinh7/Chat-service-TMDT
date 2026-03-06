import { SenderType } from '~/domain/enums/chat.enum'

export class DeleteMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly requesterId: string,
    public readonly requesterType: SenderType,
  ) {}
}
