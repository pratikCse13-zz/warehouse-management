import {DynamoStore} from '@shiftcoders/dynamo-easy';
import {ProductModel} from '../data/models';
import {AppConfig} from '../common/app-config';
import {UUID} from 'io-ts-types';
import {Product} from '../data/dto';
import {ProductNotFoundError} from '../common/errors';
import Log from '@dazn/lambda-powertools-logger';
import {ScanResult} from '../types';

export class ProductRepository {

    private readonly scanLimit: number;
    private readonly productStore: DynamoStore<ProductModel>;
    private readonly appConfig: AppConfig;

    constructor(productStore: DynamoStore<ProductModel> = new DynamoStore(ProductModel), appConfig: AppConfig = AppConfig.getInstance()) {
        this.productStore = productStore;
        this.appConfig = appConfig;
        this.scanLimit = 12;
    }

    public async createOrUpdateRecord(product: Product): Promise<void> {
        return this.productStore
            .update(product.id)
            .updateAttribute('name').set(product.name)
            .updateAttribute('containsArticles').set(product.containsArticles)
            .updateAttribute('assemblyTimeInMs').set(product.assemblyTimeInMs)
            .updateAttribute('updatedAt').set(new Date())
            .exec();
    }

    /**
     * Try to locate the product by the given id. If there is no such record, `null` will be returned.
     *
     * @param id the product identifier.
     */
    public async findById(id: UUID): Promise<ProductModel | null> {
        return this.productStore
            .get(id)
            .consistentRead(true)
            .exec();
    }

    public async scan(exclusiveStartKey?: Record<string, any>): Promise<ScanResult<ProductModel>> {
        const query = this.productStore
            .scan()
            .limit(this.scanLimit);
        const queryWithOrWithoutExclusiveStartKey = exclusiveStartKey ? query.exclusiveStartKey(exclusiveStartKey) : query;

        const startTime = process.hrtime();
        const scanResult = await queryWithOrWithoutExclusiveStartKey.consistentRead().execFullResponse();
        const queryTime = process.hrtime(startTime);

        Log.info(`finished scan query in ${queryTime} seconds`, {result: scanResult});

        return {
            records: scanResult.Items,
            newExclusiveStartKey: scanResult.LastEvaluatedKey,
        };
    }

    /**
     * This method will expect the referenced product to exist and will assert on that. Will throw a ProductNotFoundError
     * if the product cannot be found for the given id. Use #findById() if you expect a
     * `ProductModel | null` type of response instead.
     *
     * @param id the product identifier
     * @throws a {@link ProductNotFoundError} if the product for this identifier could not be found
     */
    public async getById(id: UUID): Promise<ProductModel> {
        const foundProduct = await this.findById(id);

        if(foundProduct == null) {
            Log.warn(`Product record not found in the database for [id=${id}]`);
            throw new ProductNotFoundError();
        }

        return foundProduct;
    }
}
