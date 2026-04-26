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
    const { conversationId, readById, readByType } = command

    const conversation = await this.conversationRepo.findById(conversationId)
    if (!conversation) throw new NotFoundException('Cuộc trò chuyện không tồn tại')

    // Lấy tin nhắn mới nhất để set lastReadMessageId
    const lastMessage = await this.messageRepo.findLastMessageByConversationId(conversationId)
    if (!lastMessage) return

    // Cập nhật unreadCount và lastReadMessageId
    if (readByType === SenderType.USER) {
      conversation.markAsReadByUser(lastMessage.id)
    } else {
      conversation.markAsReadByShop(lastMessage.id)
    }

    await this.conversationRepo.update(conversation)

    // Emit socket: thông báo cho cả 2 bên, cần thông báo cho cả 2 bên vì:
    // bên gửi cần cập nhật hiển thị chứ 'Đã xem'
    // bên nhận cần reset badge đỏ đỏ hiển thị số tin nhắn chưa đọc về 0
    this.chatGateway.emitMessagesRead(conversation.userId, conversation.shopId, {
      conversationId,
      readById,
      readByType,
      lastReadMessageId: lastMessage.id,
      // lastReadMessageId là tin nhắn cuối của conversation, có thể là tin nhắn của user hoặc shop
    })

    // Update unreadCount tổng cho bên đang đọc:

    // Đếm lại tổng số cuộc trò chuyện chưa đọc của người gọi api này (là tổng số cuộc trò chuyện có tin nhắn chưa đọc)
    const totalUnread = await this.conversationRepo.countUnreadConversations(readById, readByType)
    // Thông báo cho chính mình (người nhận tin nhắn) cập nhật chấm đỏ ở ChatBuble
    this.chatGateway.emitTotalUnreadCountUpdate(readById, readByType, { totalUnread })
  }
}
