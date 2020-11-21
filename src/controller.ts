import Log from '@dazn/lambda-powertools-logger';
import {ArticleRepository} from './repositories/article-repository';
import {ProductRepository} from './repositories/product-repository';
import {FileTransferService} from './services/file-transfer-service';
import {validateArticles, validateProducts} from './common/utils';
import {UploadNotificationMessage, UploadFolder, Article, Product} from './data/dto';
import '@js-joda/timezone';
import {ArticleAvailabilityService} from './services/article-availability-service';
import {InvalidUploadFolderError, NullOrUndefinedError, ResponseValidationError, ProductNotAvailableError} from './common/errors';
import {Availability, ValidationResult, ExclusiveStartKeyCache, ScanResult, ProductWithAvailability, ListProductResponse} from './types';
import {UUID} from 'io-ts-types';
import {ProductArticleMappingModel} from './data/models';
import {Key} from 'aws-sdk/clients/dynamodb';
import {ProductModel} from './data/models';

export class Controller {
    private readonly articleRepository: ArticleRepository = new ArticleRepository();
    private readonly productRepository: ProductRepository = new ProductRepository();
    private readonly fileTransferService: FileTransferService = new FileTransferService();
    private readonly articleAvailabilityService: ArticleAvailabilityService = new ArticleAvailabilityService();
    private exclusiveStartKeyCache: ExclusiveStartKeyCache;
    private productListCache: Map<Key, ProductModel[]>;
    private productAvailabilityCache: Record<UUID, Availability>;

    constructor(
        articleRepository: ArticleRepository = new ArticleRepository(),
        productRepository: ProductRepository = new ProductRepository(),
        fileTransferService: FileTransferService = new FileTransferService(),
        articleAvailabilityService: ArticleAvailabilityService = new ArticleAvailabilityService(),
        exclusiveStartKeyCache: ExclusiveStartKeyCache = {},
        productListCache: Map<Key, ProductModel[]> = new Map(),
        productAvailabilityCache: Record<UUID, Availability> = {},

    ) {
        this.articleRepository = articleRepository;
        this.productRepository = productRepository;
        this.fileTransferService = fileTransferService;
        this.articleAvailabilityService = articleAvailabilityService;
        this.exclusiveStartKeyCache = exclusiveStartKeyCache;
        this.productListCache = productListCache;
        this.productAvailabilityCache = productAvailabilityCache;
    }

    public async uploadData(message: UploadNotificationMessage): Promise<void> {
        const uploadFolder: string = message.s3.object.key.split('/')[0];
        const fileContent = await this.fileTransferService.downloadFile(message.s3.object.key);
        Log.info(`file downloaded at path - ${message.s3.object.key}`, {fileContent});

        let uploadPromise;
        try {
            if(uploadFolder === UploadFolder.keys.article) {
                uploadPromise = this.uploadArticles(fileContent);
            } else if(uploadFolder === UploadFolder.keys.product) {
                uploadPromise = this.uploadProducts(fileContent);
            } else {
                throw new InvalidUploadFolderError();
            }

            await uploadPromise;
        } catch(err) {
            if(err instanceof ResponseValidationError) {
                Log.error(`The data in the file at path - ${message.s3.object.key} is not in proper format, cannot continue upload process`);
            }
            if(err instanceof NullOrUndefinedError) {
                Log.error(`THe file uploaded at path - ${message.s3.object.key} does not contain any data, could not upload any data`);
            }
            if(err instanceof InvalidUploadFolderError) {
                Log.error(`The file was uploaded at an invalid path - ${message.s3.object.key}, cannot continue upload process`);
            }
            throw err;
        }
    }

    public async sellProduct(productId: UUID, warehouseId: UUID): Promise<void> {
        Log.info(`starting sell process for product with id - ${productId}`);

        const product = await this.productRepository.getById(productId);
        const productAvailability: Availability = await this.getProductAvailability(productId);

        const productInWarehouseAvailability = productAvailability.perWarehouseAvailability;
        if (!productInWarehouseAvailability[warehouseId]) {
            throw new ProductNotAvailableError();
        }

        Log.info(`updating stock for sell of product with id - ${productId}`);
        // update stock
        const promiseArray =
            product.containsArticles.map(
                productArticleMapping => this.articleRepository.sellStock(productArticleMapping.articleId, warehouseId, productArticleMapping.requiredAmount),
            );

        await Promise.all(promiseArray);

        Log.info(`updated stock for sell of product with id - ${productId}`);
        Log.info(`finished sell process for product with id - ${productId}`);
    }

    public async getProductAvailability(productId: UUID): Promise<Availability> {
        Log.info(`fetching product availability for product with id - ${productId}`);

        const cachedAvailability = this.productAvailabilityCache[productId];
        if (cachedAvailability !== undefined) {
            return cachedAvailability;
        }

        const product = await this.productRepository.getById(productId);
        const requiredArticleIdSet: UUID[] = product.containsArticles.map(productArticleMapping => productArticleMapping.articleId);

        Log.info(`fetching article availability for product with id - ${productId}`, {articleIdSet: requiredArticleIdSet});
        const articleAvailabilitySet = await this.articleAvailabilityService.getArticleSetAvailability(requiredArticleIdSet);
        Log.info(`fetched article availability for product with id - ${productId}`, {articleIdSet: requiredArticleIdSet});

        const productAvailability = this.computeProductAvailabilityFromArticleAvailability(product.containsArticles, articleAvailabilitySet);
        Log.info(`fetched product availability for product with id - ${productId}`);

        this.productAvailabilityCache[productId] = productAvailability;

        return productAvailability;
    }

    public async listProducts(userId: string, page: number | undefined): Promise<ListProductResponse> {
        // initialize the key store
        if (!this.exclusiveStartKeyCache[userId]) {
            this.exclusiveStartKeyCache[userId] = [];
        }
        const requestedPage =
            typeof page === 'number' ? Math.min(page, this.exclusiveStartKeyCache[userId].length+1) : 1;
        const exlcusiveStartKeyIndex = requestedPage - 2;
        const exclusiveStartKey: Key | undefined = exlcusiveStartKeyIndex === -1 ? undefined : this.exclusiveStartKeyCache[userId][requestedPage-2];
        let cachedProductList;
        let lastPage: boolean = false;
        let productList: ProductModel[];
        let scanResult: ScanResult<ProductModel>;
        const productListWithAvailability: ProductWithAvailability[] = [];

        Log.info('details to fetch product list', {
            requestedPage,
            exlcusiveStartKeyIndex,
            userId,
            exclusiveStartKeyCacheForUser: this.exclusiveStartKeyCache[userId],
            exclusiveStartKey,
        });

        if (exclusiveStartKey) {
            cachedProductList = this.productListCache.get(exclusiveStartKey);
        }

        if (cachedProductList) {
            productList = cachedProductList;
        } else {
            try {
                scanResult = await this.productRepository.scan(exclusiveStartKey);
            } catch(err) {
                Log.error(`error while scanning products from the database`, {err});
                throw err;
            }

            productList = scanResult.records;

            // set exclusiveStartKey cache
            if (!scanResult.newExclusiveStartKey) {
                lastPage = true;
            } else if (exlcusiveStartKeyIndex === (this.exclusiveStartKeyCache[userId].length - 1)) {
                this.exclusiveStartKeyCache[userId].push(scanResult.newExclusiveStartKey);
            }

            // set product list cache
            if (exclusiveStartKey) {
                this.productListCache.set(exclusiveStartKey, productList);
            }
        }

        const productAvailabilityPromiseArray = productList.map(product => this.getProductAvailability(product.id));
        const productAvailability = await Promise.all(productAvailabilityPromiseArray);

        productList.forEach((product, index) => {
            const currentProductAvailability: Availability = productAvailability[index];
            productListWithAvailability.push({
                ...product,
                availability: currentProductAvailability,
            });
            // set product availability cache
            this.productAvailabilityCache[product.id] = currentProductAvailability;
        });

        return {
            records: productListWithAvailability,
            lastPage,
        };
    }

    private async uploadArticles(fileContent: Record<string, any>): Promise<void> {
        Log.info('uploading articles');
        // validate and remove duplicates
        const dataSet: ValidationResult<Article> = validateArticles(fileContent);

        // valid records
        if (dataSet.validData.length > 0) {
            const promiseArray = dataSet.validData.map(async data => await this.articleRepository.createOrUpdateRecord(data));
            const results = await Promise.allSettled(promiseArray);

            results.forEach((result, index) => {
                if(result.status === 'rejected') {
                    const record = dataSet.validData[index];
                    const reason = this.getFailureReasonMessage(result.reason);

                    Log.warn('article record failed to be created or updated', {record, reason, err: result.reason});

                    dataSet.failedData.push({
                        record,
                        reason,
                    });
                }
            });
        } else {
            Log.warn('found no valid data in file', {fileContent});
        }

        // failed records
        if (dataSet.failedData.length > 0){
            await this.fileTransferService.uploadFailedCases<Article>(dataSet.failedData, 'article');
        } else {
            Log.info('found no failed data in file', {fileContent});
        }

        Log.info('uploaded articles');
    }

    private async uploadProducts(fileContent: Record<string, any>): Promise<void> {
        Log.info('uploading products');
        // validate and remove duplicates
        const dataSet: ValidationResult<Product> = validateProducts(fileContent);

        // valid records
        if (dataSet.validData.length > 0) {
            const promiseArray = dataSet.validData.map(async data => await this.productRepository.createOrUpdateRecord(data));
            const results = await Promise.allSettled(promiseArray);
            results.forEach((result, index) => {
                if(result.status === 'rejected') {
                    const record = dataSet.validData[index];
                    const reason = this.getFailureReasonMessage(result.reason);

                    Log.warn('product record failed to be created or updated', {record, reason, err: result.reason});

                    dataSet.failedData.push({
                        record,
                        reason,
                    });
                }
            });
        }

        // failed records
        if (dataSet.failedData.length > 0){
            await this.fileTransferService.uploadFailedCases<Product>(dataSet.failedData, 'product');
        } else {
            Log.info('found no failed data in file', {fileContent});
        }

        Log.info('uploaded products');
    }

    private getFailureReasonMessage(reason): string {
        if(typeof reason === 'string') {
            return reason;
        } else if(reason instanceof Error) {
            return reason.message;
        } else {
            return 'unknown reason';
        }
    }

    private computeProductAvailabilityFromArticleAvailability(conatinsArticles: ProductArticleMappingModel[], articleAvailabilitySet: Record<string, Availability>): Availability {
        const productAvailability: Availability = {
            bestWarehouseAvailability: 0,
            universalAvailability: 0,
            perWarehouseAvailability: {},
        };

        conatinsArticles.forEach((productArticleMapping, index) => {
            const articleId = productArticleMapping.articleId;
            const numberOfArticlesRequired = productArticleMapping.requiredAmount;
            const currentArticleAvailability = articleAvailabilitySet[articleId];

            // universal availability
            const currentUniversalProductAvailability = Math.floor(currentArticleAvailability.universalAvailability/numberOfArticlesRequired);
            if (index === 0) {
                productAvailability.universalAvailability = currentUniversalProductAvailability;
            } else {
                productAvailability.universalAvailability = Math.min(productAvailability.universalAvailability, currentUniversalProductAvailability);
            }

            // per warehouse availability
            const currentInWarehouseArticleAvailability = currentArticleAvailability.perWarehouseAvailability;
            const warehouseIdsToConsider =
                Object.keys(productAvailability.perWarehouseAvailability).length !== 0 ?
                Object.keys(productAvailability.perWarehouseAvailability) : Object.keys(currentInWarehouseArticleAvailability);

            warehouseIdsToConsider.forEach(warehouseId => {
                if (!currentInWarehouseArticleAvailability[warehouseId]) {
                    delete productAvailability.perWarehouseAvailability[warehouseId];
                } else {
                    const currentInWarehouseProductAvailability = Math.floor(currentInWarehouseArticleAvailability[warehouseId]/numberOfArticlesRequired);

                    if (productAvailability.perWarehouseAvailability.hasOwnProperty(warehouseId)) {
                        productAvailability.perWarehouseAvailability[warehouseId] =
                            Math.min(
                                productAvailability.perWarehouseAvailability[warehouseId],
                                currentInWarehouseProductAvailability,
                            );
                    } else {
                        productAvailability.perWarehouseAvailability[warehouseId] = currentInWarehouseProductAvailability;
                    }
                }
            });
        });

        // best warehouse availability
        productAvailability.bestWarehouseAvailability = Math.max(...Object.values(productAvailability.perWarehouseAvailability));

        return productAvailability;
    }
}
