import { z } from 'zod';

const schema = z.object({
    DB_NAME: z.string(),
    DB_ADDRESS: z.string(),
    DB_USER: z.string(),
    DB_PASSW: z.string(),
    DB_PORT: z.string(),
    PORT: z.string(),
    IMG_STORAGE: z.string()
});

export const env = schema.parse(process.env);
