export interface Message {
  message_id: number; // API から返されるメッセージ ID
  user: string;
  message: string;
}
