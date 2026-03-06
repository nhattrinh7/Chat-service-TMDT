import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(ChatGateway.name)
  private readonly accessTokenSecret: string

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenSecret = this.configService.get<string>('ACCESS_TOKEN_SECRET')!
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token
        || client.handshake.headers?.authorization?.replace('Bearer ', '')

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: no token`)
        client.disconnect()
        return
      }

      const payload = await this.verifyAccessToken(token)
      if (!payload) {
        this.logger.warn(`Client ${client.id} connection rejected: invalid token`)
        client.disconnect()
        return
      }

      // Lưu userId vào client data cho dùng sau
      client.data.userId = payload.userId

      // Join room user:{userId} - để nhận tin nhắn khi user là buyer
      const userRoom = `user:${payload.userId}`
      await client.join(userRoom)

      // Nếu client gửi shopId khi connect (shop owner đang ở shop management)
      // thì join thêm room shop:{shopId}
      const shopId = client.handshake.auth?.shopId
      if (shopId) {
        client.data.shopId = shopId
        const shopRoom = `shop:${shopId}`
        await client.join(shopRoom)
        this.logger.log(`Client ${client.id} joined rooms: ${userRoom}, ${shopRoom}`)
      } else {
        this.logger.log(`Client ${client.id} joined room: ${userRoom}`)
      }
    } catch {
      this.logger.error(`Client ${client.id} connection error`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`)
  }

  // === Emit methods cho Application Layer gọi ===

  /**
   * Emit tin nhắn mới đến cả 2 bên trong conversation
   */
  emitNewMessage(userId: string, shopId: string, message: any) {
    this.server.to(`user:${userId}`).emit('chat:newMessage', message)
    this.server.to(`shop:${shopId}`).emit('chat:newMessage', message)
  }

  /**
   * Emit khi tin nhắn bị xóa
   */
  emitMessageDeleted(userId: string, shopId: string, data: { messageId: string; conversationId: string }) {
    this.server.to(`user:${userId}`).emit('chat:messageDeleted', data)
    this.server.to(`shop:${shopId}`).emit('chat:messageDeleted', data)
  }

  /**
   * Emit khi messages được đọc
   */
  emitMessagesRead(userId: string, shopId: string, data: { conversationId: string; readBy: string; readByType: string }) {
    this.server.to(`user:${userId}`).emit('chat:messagesRead', data)
    this.server.to(`shop:${shopId}`).emit('chat:messagesRead', data)
  }

  /**
   * Emit cập nhật unread count cho 1 user hoặc shop cụ thể
   */
  emitUnreadCountUpdate(targetId: string, targetType: 'USER' | 'SHOP', data: { totalUnread: number }) {
    const roomPrefix = targetType === 'USER' ? 'user' : 'shop'
    this.server.to(`${roomPrefix}:${targetId}`).emit('chat:unreadCountUpdate', data)
  }

  /**
   * Emit cập nhật conversation (lastMessage changed, unread changed)
   */
  emitConversationUpdated(userId: string, shopId: string, conversation: any) {
    this.server.to(`user:${userId}`).emit('chat:conversationUpdated', conversation)
    this.server.to(`shop:${shopId}`).emit('chat:conversationUpdated', conversation)
  }

  private async verifyAccessToken(token: string): Promise<{ userId: string; roleId: string } | null> {
    try {
      const payload = await this.jwtService.verifyAsync<{ userId: string; roleId: string }>(token, {
        secret: this.accessTokenSecret,
      })
      return payload
    } catch {
      return null
    }
  }
}
