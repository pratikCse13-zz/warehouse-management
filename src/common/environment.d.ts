// Module augmentation. Provide IntelliSense for 'process.env'
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            UPLOAD_BUCKET_NAME: string;
            ARTICLE_TABLE_NAME: string;
            PRODUCT_TABLE_NAME: string;
        }
    }
}

// Convert it into a module
export {};
