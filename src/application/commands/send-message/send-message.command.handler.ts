import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, BadRequestException, ForbiddenException } from '@nestjs/common'
import { SendMessageCommand } from './send-message.command'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import type { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'
import { MESSAGE_REPOSITORY } from '~/domain/repositories/message.repository.interface'
import type { IMessageRepository } from '~/domain/repositories/message.repository.interface'
import { Conversation } from '~/domain/entities/conversation.entity'
import { Message } from '~/domain/entities/message.entity'
import { SenderType, MessageType } from '~/domain/enums/chat.enum'
import { CloudinaryService } from '~/common/services/cloudinary.service'
import { ChatGateway } from '~/infrastructure/websocket/chat.gateway'
import { CLOUDINARY_CHAT_IMAGE_FOLDER, IMAGE_MESSAGE_PREVIEW_TEXT } from '~/common/constants/constant'

@CommandHandler(SendMessageCommand)
export class SendMessageHandler implements ICommandHandler<SendMessageCommand> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepo: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async execute(command: SendMessageCommand) {
    const { userId, shopId, senderId, senderType, messageType, replyToMessageId, file } = command
    let { message } = command

    // Validate: Shop chỉ có thể reply, ko thể tạo conversation mới
    // → nếu senderType = SHOP thì conversation phải đã tồn tại
    let conversation = await this.conversationRepo.findByUserAndShop(userId, shopId)

    if (senderType === SenderType.SHOP && !conversation) {
      throw new ForbiddenException('Shop không thể bắt đầu cuộc trò chuyện. Phải đợi người mua nhắn trước.')
    }

    // Upload ảnh nếu messageType là IMAGE
    if (messageType === MessageType.IMAGE) {
      if (!file) throw new BadRequestException('Cần gửi file ảnh khi messageType là IMAGE')
      const uploadResult = await this.cloudinaryService.uploadImageToCloudinary(file, CLOUDINARY_CHAT_IMAGE_FOLDER)
      message = uploadResult.secure_url
    }

    if (messageType === MessageType.TEXT && (!message || message.trim().length === 0)) {
      throw new BadRequestException('Tin nhắn text không được để trống')
    }

    // Lazy creation: tạo conversation nếu chưa có (chỉ user mới có thể tạo)
    if (!conversation) {
      conversation = Conversation.create(userId, shopId)
      conversation = await this.conversationRepo.save(conversation)
    }

    // Xử lý reply: lấy nội dung tin nhắn gốc để denormalize
    let replyToMessageContent: string | null = null
    let replyToSenderType: SenderType | null = null

    if (replyToMessageId) {
      const replyToMessage = await this.messageRepo.findById(replyToMessageId)
      if (replyToMessage && !replyToMessage.isDeleted) {
        replyToMessageContent = replyToMessage.message
        replyToSenderType = replyToMessage.senderType
      }
    }

    // Tạo message
    const newMessage = Message.create({
      conversationId: conversation.id,
      senderId,
      senderType,
      messageType,
      message,
      replyToMessageId,
      replyToMessageContent,
      replyToSenderType,
    })

    const savedMessage = await this.messageRepo.save(newMessage)

    // Update conversation: lastMessage + unreadCount
    conversation.updateLastMessage(
      savedMessage.id,
      savedMessage.messageType === MessageType.IMAGE ? IMAGE_MESSAGE_PREVIEW_TEXT : savedMessage.message,
      savedMessage.messageType,
      senderId,
      senderType,
    )

    // Tăng unread cho bên còn lại
    if (senderType === SenderType.USER) {
      conversation.incrementUnreadForShop()
    } else {
      conversation.incrementUnreadForUser()
    }

    const updatedConversation = await this.conversationRepo.update(conversation)

    // Emit socket events
    const messageData = {
      id: savedMessage.id,
      conversationId: savedMessage.conversationId,
      senderId: savedMessage.senderId,
      senderType: savedMessage.senderType,
      messageType: savedMessage.messageType,
      message: savedMessage.message,
      replyToMessageId: savedMessage.replyToMessageId,
      replyToMessageContent: savedMessage.replyToMessageContent,
      replyToSenderType: savedMessage.replyToSenderType,
      deletedAt: savedMessage.deletedAt,
      createdAt: savedMessage.createdAt,
    }

    this.chatGateway.emitNewMessage(userId, shopId, messageData)

    // Emit conversation updated (cho list conversations cập nhật)
    const conversationData = {
      id: updatedConversation.id,
      userId: updatedConversation.userId,
      shopId: updatedConversation.shopId,
      lastMessageId: updatedConversation.lastMessageId,
      lastMessageContent: updatedConversation.lastMessageContent,
      lastMessageType: updatedConversation.lastMessageType,
      lastMessageAt: updatedConversation.lastMessageAt,
      lastMessageSenderId: updatedConversation.lastMessageSenderId,
      lastMessageSenderType: updatedConversation.lastMessageSenderType,
      unreadCountUser: updatedConversation.unreadCountUser,
      unreadCountShop: updatedConversation.unreadCountShop,
      updatedAt: updatedConversation.updatedAt,
    }

    this.chatGateway.emitConversationUpdated(userId, shopId, conversationData)

    return messageData
  }
}
