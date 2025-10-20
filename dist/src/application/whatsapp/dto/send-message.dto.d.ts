export declare class SendMessageDto {
    to: string;
    message: string;
    type?: 'text' | 'image' | 'document';
    mediaUrl?: string;
    filename?: string;
}
