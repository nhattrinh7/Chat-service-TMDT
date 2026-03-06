export interface IMessagePublisher {
  publish<T>(pattern: string, event: T): void
}
export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER')
