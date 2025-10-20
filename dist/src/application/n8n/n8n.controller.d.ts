import { N8nService } from './n8n.service';
export declare class N8nController {
    private readonly n8nService;
    constructor(n8nService: N8nService);
    testWebhook(): Promise<{
        success: boolean;
        message: string;
    }>;
    getStatus(): Promise<{
        status: string;
        url: string;
        lastTest?: Date;
    }>;
    getWebhookUrl(): Promise<{
        webhookUrl: string;
        message: string;
    }>;
}
