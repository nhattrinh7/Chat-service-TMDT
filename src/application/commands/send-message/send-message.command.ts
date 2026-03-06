import { SenderType, MessageType } from '~/domain/enums/chat.enum'

export class SendMessageCommand {
  constructor(
    public readonly userId: string,
    public readonly shopId: string,
    public readonly senderId: string,
    public readonly senderType: SenderType,
    public readonly messageType: MessageType,
    public readonly message: string | null,
    public readonly replyToMessageId: string | null,
    public readonly file: Express.Multer.File | null,
  ) {}
}
