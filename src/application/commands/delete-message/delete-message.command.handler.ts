import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common'
import { DeleteMessageCommand } from './delete-message.command'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import type { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'
import { MESSAGE_REPOSITORY } from '~/domain/repositories/message.repository.interface'
import type { IMessageRepository } from '~/domain/repositories/message.repository.interface'
import { ChatGateway } from '~/infrastructure/websocket/chat.gateway'
import { SenderType, MessageType } from '~/domain/enums/chat.enum'

@CommandHandler(DeleteMessageCommand)
export class DeleteMessageHandler implements ICommandHandler<DeleteMessageCommand> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepo: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
    private readonly chatGateway: ChatGateway,
  ) {}

  async execute(command: DeleteMessageCommand) {
    const { messageId, requesterId, requesterType } = command

    const message = await this.messageRepo.findById(messageId)
    if (!message) throw new NotFoundException('Tin nhắn không tồn tại')
    if (message.isDeleted) throw new NotFoundException('Tin nhắn đã bị xóa trước đó')

    // Chỉ người gửi mới được xóa tin nhắn
    if (message.senderId !== requesterId || message.senderType !== requesterType) {
      throw new ForbiddenException('Bạn chỉ có thể xóa tin nhắn của mình')
    }

    // Soft delete
    await this.messageRepo.softDelete(messageId)

    // Nếu tin nhắn bị xóa là lastMessage của conversation → update lại cho tin nhắn gần nhất chưa bị xóa làm lastMessage mới
    const conversation = await this.conversationRepo.findById(message.conversationId)
    if (conversation && conversation.lastMessageId === messageId) {
      const newLastMessage = await this.messageRepo.findLastMessageByConversationId(message.conversationId)

      if (newLastMessage) {
        conversation.updateLastMessage(
          newLastMessage.id,
          newLastMessage.messageType === MessageType.IMAGE ? '[Hình ảnh]' : newLastMessage.message,
          newLastMessage.messageType,
          newLastMessage.senderId,
          newLastMessage.senderType,
        )
      }

      await this.conversationRepo.update(conversation)

      // Emit conversation updated
      this.chatGateway.emitConversationUpdated(conversation.userId, conversation.shopId, {
        id: conversation.id,
        lastMessageContent: conversation.lastMessageContent,
        lastMessageType: conversation.lastMessageType,
        lastMessageAt: conversation.lastMessageAt,
        lastMessageSenderId: conversation.lastMessageSenderId,
        lastMessageSenderType: conversation.lastMessageSenderType,
      })
    }

    // Emit message deleted realtime
    if (conversation) {
      this.chatGateway.emitMessageDeleted(conversation.userId, conversation.shopId, {
        messageId, // đây là id của message bị xóa
        conversationId: message.conversationId,
      })
    }
  }
}
