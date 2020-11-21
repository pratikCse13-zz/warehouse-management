export const setupEnv = () => {
    process.env.UPLOAD_BUCKET_NAME = 'fake-bucket';
    process.env.ARTICLE_TABLE_NAME = 'article';
    process.env.PRODUCT_TABLE_NAME = 'product';
};