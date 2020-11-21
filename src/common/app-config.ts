import {narrowOrThrow} from './utils';

export interface AppProperties {
    uploadBucketName: string;
    productTableName: string;
    articleTableName: string;
}

// tslint:disable-next-line:no-empty-interface
export interface AppConfig extends AppProperties {
}

// Using declaration merging to avoid declaring the properties again in the class when implementing the interface
export class AppConfig {

    public static getInstance() {
        const envs = process.env;
        const uploadBucketName = narrowOrThrow(envs.UPLOAD_BUCKET_NAME, 'Expected environment variable: UPLOAD_BUCKET_NAME');
        const productTableName = narrowOrThrow(envs.PRODUCT_TABLE_NAME, 'Expected environment variable: PRODUCT_TABLE_NAME');
        const articleTableName = narrowOrThrow(envs.ARTICLE_TABLE_NAME, 'Expected environment variable: ARTICLE_TABLE_NAME');

        return new AppConfig({
            uploadBucketName,
            productTableName,
            articleTableName,
        });
    }

    constructor(properties: AppProperties) {
        this.uploadBucketName = properties.uploadBucketName;
        this.productTableName = properties.productTableName;
        this.articleTableName = properties.articleTableName;
    }
}
