/**
 * Cursor utility cho cursor-based pagination
 * Encode/Decode compound cursor (timestamp + id) dưới dạng Base64 JSON
 */

export function encodeCursor(timestamp: Date, id: string): string {
  const payload = JSON.stringify({ t: timestamp.toISOString(), i: id })
  return Buffer.from(payload).toString('base64')
}

export function decodeCursor(cursor: string): { timestamp: Date; id: string } {
  const payload = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
  return { timestamp: new Date(payload.t), id: payload.i }
}
