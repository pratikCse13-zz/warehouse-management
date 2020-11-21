import {DynamoStore} from '@shiftcoders/dynamo-easy';
import {ArticleModel} from '../data/models';
import {AppConfig} from '../common/app-config';
import {UUID} from 'io-ts-types';
import {Article, GetStockAvailabilityRequest, StockAvailabilityResponse} from '../data/dto';
import {ArticleNotFoundError} from '../common/errors';
import Log from '@dazn/lambda-powertools-logger';

export class ArticleRepository {

    private readonly articleStore: DynamoStore<ArticleModel>;
    private readonly appConfig: AppConfig;

    constructor(articleStore: DynamoStore<ArticleModel> = new DynamoStore(ArticleModel), appConfig: AppConfig = AppConfig.getInstance()) {
        this.articleStore = articleStore;
        this.appConfig = appConfig;
    }

    public async createOrUpdateRecord(article: Article): Promise<void> {
        return this.articleStore
            .update(article.id, article.warehouseId)
            .updateAttribute('name').set(article.name)
            .updateAttribute('stock').incrementBy(article.stock)
            .updateAttribute('damagedStock').incrementBy(article.damagedStock)
            .updateAttribute('updatedAt').set(new Date())
            .exec();
    }

    /**
     * Try to locate the article by the given id. If there is no such record, `null` will be returned.
     *
     * @param id the article identifier.
     */
    public async findById(id: UUID): Promise<ArticleModel | null> {
        return this.articleStore
            .get(id)
            .consistentRead(true)
            .exec();
    }

    /**
     * Try to query the articles table by the given id.
     *
     * @param id the article identifier.
     */
    public async query(id: UUID): Promise<ArticleModel[]> {
        return this.articleStore
            .query()
            .wherePartitionKey(id)
            .consistentRead(true)
            .exec();
    }

    /**
     * This method will expect the referenced article to exist and will assert on that. Will throw a ArticleNotFoundError
     * if the article cannot be found for the given id. Use #findById() if you expect a
     * `ArticleModel | null` type of response instead.
     *
     * @param id the article identifier
     * @throws a {@link ArticleNotFoundError} if the article for this identifier could not be found
     */
    public async getById(id: UUID): Promise<ArticleModel> {
        const foundArticle = await this.findById(id);

        if(foundArticle == null) {
            Log.warn(`Article not found in the database for [id=${id}]`);
            throw new ArticleNotFoundError();
        }

        return foundArticle;
    }

    public async sellStock(articleId: UUID, warehouseId: UUID, stock: number): Promise<void> {
        Log.info('sell stock request received for details', {articleId, warehouseId, stock});
        return this.articleStore
            .update(articleId, warehouseId)
            .onlyIfAttribute(articleId).attributeExists()
            .onlyIfAttribute(warehouseId).attributeExists()
            .updateAttribute('stock').decrementBy(stock)
            .updateAttribute('updatedAt').set(new Date())
            .exec();
    }

    public async getStockAvailability(availabilityRequests: GetStockAvailabilityRequest): Promise<StockAvailabilityResponse> {
        const promises = availabilityRequests.map(request => {
            return this.getById(request.articleId);
        });

        const results = await Promise.all(promises);

        let availability: boolean = true;
        const stock = results.map((article: ArticleModel, index: number) => {
            if(article.stock < availabilityRequests[index].requiredAmount) {
                availability = false;
            }

            return {
                articleId: article.id,
                availableAmount: article.stock,
            };
        });

        return {
            availability,
            stock,
        };
    }
}
