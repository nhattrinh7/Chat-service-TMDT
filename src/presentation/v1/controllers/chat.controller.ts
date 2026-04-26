import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Headers,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { FileInterceptor } from '@nestjs/platform-express'
import { SendMessageCommand } from '~/application/commands/send-message/send-message.command'
import { MarkAsReadCommand } from '~/application/commands/mark-as-read/mark-as-read.command'
import { DeleteMessageCommand } from '~/application/commands/delete-message/delete-message.command'
import { SenderType, MessageType } from '~/domain/enums/chat.enum'
import { GetConversationsQuery } from '~/application/queries/get-conversations/get-conversations.query'
import { GetMessagesQuery } from '~/application/queries/get-messages/get-messages.query'
import { GetUnreadCountQuery } from '~/application/queries/get-unread-count/get-unread-count.query'
import { CheckConversationQuery } from '~/application/queries/check-conversation/check-conversation.query'
import { GetConversationsQueryDto } from '~/presentation/dtos/conversation.dto'
import { GetMessagesQueryDto } from '~/presentation/dtos/message.dto'

@Controller('v1/chats')
export class ChatController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /v1/chats/conversations/check
   * Kiểm tra xem user và shop đã từng có cuộc hội thoại chưa
   */
  @Get('conversations/check')
  async checkConversation(
    @Headers('x-user-id') userId: string,
    @Query('shopId') shopId: string,
  ) {
    if (!shopId) return { message: 'Thiếu shopId', data: null }
    
    const result = await this.queryBus.execute(
      new CheckConversationQuery(userId, shopId),
    )

    return { message: 'Kiểm tra cuộc trò chuyện có tồn tại hay không thành công', data: result }
  }

  /**
   * GET /v1/chats/conversations
   * List conversations cho user hoặc shop
   * Headers: x-user-id, x-shop-id (optional)
   * Query: cursor, limit, type (user|shop)
   */
  @Get('conversations')
  async getConversations(
    @Headers('x-user-id') userId: string,
    @Query() query: GetConversationsQueryDto,
  ) {
    const { cursor, limit, type, shopId } = query
    const participantType = type === 'shop' ? SenderType.SHOP : SenderType.USER
    const participantId = participantType === SenderType.SHOP ? shopId || '' : userId

    const result = await this.queryBus.execute(
      new GetConversationsQuery(participantId, participantType, cursor, limit),
    )

    return { message: 'Lấy danh sách cuộc trò chuyện thành công', ...result }
  }

  /**
   * GET /v1/chats/conversations/:id/messages
   * Lấy messages trong 1 conversation (cursor-based)
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string, 
    @Query() query: GetMessagesQueryDto
  ) {
    const { cursor, limit } = query
    const result = await this.queryBus.execute(new GetMessagesQuery(conversationId, cursor, limit))

    return { message: 'Lấy tin nhắn thành công', ...result }
  }

  /**
   * POST /v1/chats/conversations/messages
   * Gửi tin nhắn (có thể tạo conversation mới nếu lazy creation)
   * Hỗ trợ multipart/form-data cho upload ảnh
   */
  @Post('conversations/messages')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessage(
    @Headers('x-user-id') headerUserId: string,
    @Body('shopId') shopId: string,
    @Body('senderId') senderId: string,
    @Body('senderType') senderType: SenderType,
    @Body('messageType') messageType: MessageType,
    @Body('message') message: string | null,
    @Body('replyToMessageId') replyToMessageId: string | null,
    @Body('userId') bodyUserId: string | null,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false, // Ảnh không bắt buộc vì có thể là tin nhắn text
      }),
    )
    file: Express.Multer.File | null,
  ) {
    // Khi USER gửi: userId = x-user-id (chính người đó)
    // Khi SHOP gửi: userId = bodyUserId (buyer userId được FE truyền qua body)
    const buyerUserId = senderType === SenderType.SHOP ? bodyUserId || headerUserId : headerUserId

    const result = await this.commandBus.execute(
      new SendMessageCommand(
        buyerUserId,
        shopId,
        senderId,
        senderType,
        messageType || MessageType.TEXT,
        message,
        replyToMessageId || null,
        file || null,
      ),
    )

    return { message: 'Gửi tin nhắn thành công', data: result }
  }

  /**
   * PATCH /v1/chats/conversations/:id/read
   * Đánh dấu đã đọc
   */
  @Patch('conversations/:id/read')
  async markAsRead(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Body('readByType') readByType: SenderType,
    @Body('readById') readById: string,
  ) {
    await this.commandBus.execute(
      new MarkAsReadCommand(conversationId, readById || userId, readByType || SenderType.USER),
    )

    return { message: 'Đã đánh dấu đã đọc' }
  }

  /**
   * DELETE /v1/chats/messages/:id
   * Soft delete tin nhắn
   */
  @Delete('messages/:id')
  async deleteMessage(
    @Param('id') messageId: string,
    @Headers('x-user-id') userId: string,
    @Query('requesterType') requesterType: SenderType,
    @Query('requesterId') requesterId: string,
  ) {
    await this.commandBus.execute(
      new DeleteMessageCommand(messageId, requesterId || userId, requesterType || SenderType.USER),
    )

    return { message: 'Đã xóa tin nhắn' }
  }

  /**
   * GET /v1/chats/unread-count
   * Lấy tổng số conversations chưa đọc
   */
  @Get('unread-count')
  async getUnreadCount(
    @Headers('x-user-id') userId: string,
    @Query('type') type?: string,
    @Query('shopId') shopId?: string,
  ) {
    const participantType = type === 'shop' ? SenderType.SHOP : SenderType.USER
    const participantId = participantType === SenderType.SHOP ? shopId || '' : userId

    const result = await this.queryBus.execute(
      new GetUnreadCountQuery(participantId, participantType),
    )

    return { message: 'Lấy số tin nhắn chưa đọc thành công', data: result }
  }
}
