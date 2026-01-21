import 'express-session';

declare module 'express-session' {
    interface SessionData {
        user?: {
            hospital_code: number;
            hospital_id: string;
            hospital_name: string;
        };
    }
}
