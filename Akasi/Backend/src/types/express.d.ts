// Create a file src/types/express.d.ts
import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id?: number;
                admin_id?: number;
                client_id?: number;
                role?: string;
            }
        }
    }
}