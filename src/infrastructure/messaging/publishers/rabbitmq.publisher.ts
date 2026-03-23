import { Injectable, Inject, Logger } from '@nestjs/common'
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs/internal/lastValueFrom'
import { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { getKongRequestId } from '~/common/context/request-context'

@Injectable()
export class RabbitMQPublisher implements IMessagePublisher {
  private readonly logger = new Logger(RabbitMQPublisher.name)

  constructor(
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationClient: ClientProxy,
    @Inject('USER_CLIENT')
    private readonly userClient: ClientProxy,
    @Inject('SHOP_CLIENT')
    private readonly shopClient: ClientProxy,
  ) {}

  private buildRecord<T>(event: T) {
    return new RmqRecordBuilder(event)
      .setOptions({
        headers: { 'kong-request-id': getKongRequestId() },
      })
      .build()
  }

  publish<T>(pattern: string, event: T): void {
    this.logger.debug(`[${getKongRequestId()}] Emit ${pattern} ? notification-service`)
    this.notificationClient.emit(pattern, this.buildRecord(event))
  }

  async sendToUserService<T, R = any>(pattern: string, data: T): Promise<R> {
    const response$ = this.userClient.send<R, T>(pattern, this.buildRecord(data) as any)
    return lastValueFrom(response$)
  }

  async sendToShopService<T, R = any>(pattern: string, data: T): Promise<R> {
    const response$ = this.shopClient.send<R, T>(pattern, this.buildRecord(data) as any)
    return lastValueFrom(response$)
  }
}
