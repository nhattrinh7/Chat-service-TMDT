import { Injectable, Inject, Logger } from '@nestjs/common'
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices'
import { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { getKongRequestId } from '~/common/context/request-context'

@Injectable()
export class RabbitMQPublisher implements IMessagePublisher {
  private readonly logger = new Logger(RabbitMQPublisher.name)

  constructor(
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationClient: ClientProxy,
  ) {}

  private buildRecord<T>(event: T) {
    return new RmqRecordBuilder(event)
      .setOptions({
        headers: { 'kong-request-id': getKongRequestId() },
      })
      .build()
  }

  publish<T>(pattern: string, event: T): void {
    this.logger.debug(`[${getKongRequestId()}] Emit ${pattern} → notification-service`)
    this.notificationClient.emit(pattern, this.buildRecord(event))
  }
}