import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException } from '@nestjs/common'
import { MarkAsReadCommand } from './mark-as-read.command'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import type { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'
import { MESSAGE_REPOSITORY } from '~/domain/repositories/message.repository.interface'
import type { IMessageRepository } from '~/domain/repositories/message.repository.interface'
import { ChatGateway } from '~/infrastructure/websocket/chat.gateway'
import { SenderType } from '~/domain/enums/chat.enum'

@CommandHandler(MarkAsReadCommand)
export class MarkAsReadHandler implements ICommandHandler<MarkAsReadCommand> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepo: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
    private readonly chatGateway: ChatGateway,
  ) {}

  async execute(command: MarkAsReadCommand) {
    const { conversationId, readBy, readByType } = command

    const conversation = await this.conversationRepo.findById(conversationId)
    if (!conversation) throw new NotFoundException('Cuộc trò chuyện không tồn tại')

    // Lấy tin nhắn mới nhất để set lastReadMessageId
    const lastMessage = await this.messageRepo.findLastMessageByConversationId(conversationId)
    if (!lastMessage) return

    if (readByType === SenderType.USER) {
      conversation.markAsReadByUser(lastMessage.id)
    } else {
      conversation.markAsReadByShop(lastMessage.id)
    }

    await this.conversationRepo.update(conversation)

    // Emit socket: thông báo cho cả 2 bên
    this.chatGateway.emitMessagesRead(conversation.userId, conversation.shopId, {
      conversationId,
      readBy,
      readByType,
    })

    // Update unread count tổng cho bên đang đọc
    const totalUnread = await this.conversationRepo.countUnreadConversations(readBy, readByType)
    this.chatGateway.emitUnreadCountUpdate(readBy, readByType, { totalUnread })
  }
}
