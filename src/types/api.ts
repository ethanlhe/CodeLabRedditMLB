interface SuccessResponse {
    success: true;
    data: any;
    status: number;
    debugInfo: {
        url: string;
        responseStatus: number;
        responseStatusText: string;
        timestamp: string;
    };
}

interface ErrorResponse {
    success: false;
    error: string;
    details: string;
    debugInfo: {
        timestamp: string;
        errorType: string;
    };
}

export type APIResponse = SuccessResponse | ErrorResponse; 