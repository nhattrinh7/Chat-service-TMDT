import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ChatGateway } from '~/infrastructure/websocket/chat.gateway'

@Module({
  imports: [
    JwtModule.register({}),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class WebsocketModule {}
