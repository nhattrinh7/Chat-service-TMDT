export interface IMessagePublisher {
  publish<T>(pattern: string, event: T): void
  sendToUserService<T, R = any>(pattern: string, data: T): Promise<R>
  sendToShopService<T, R = any>(pattern: string, data: T): Promise<R>
}
export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER')
