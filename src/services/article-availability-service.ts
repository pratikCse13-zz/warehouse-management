import {ArticleRepository} from '../repositories/article-repository';
import {Availability} from '../types';
import Log from '@dazn/lambda-powertools-logger';
import {UUID} from 'io-ts-types';
import _ from 'lodash';
import {ArticleModel} from '../data/models';
import { ArticleNotFoundError } from '../common/errors';

export class ArticleAvailabilityService {
    private articleRepository: ArticleRepository;

    constructor(articleRepository: ArticleRepository = new ArticleRepository()) {
        this.articleRepository = articleRepository;
    }

    public async getArticleAvailability(articleId: UUID): Promise<Availability> {
        const articleRecords: ArticleModel[] = await this.articleRepository.query(articleId);

        if (articleRecords.length === 0) {
            Log.error(`No article records found for id - ${articleId}`);
            throw new ArticleNotFoundError();
        }

        let bestWarehouseAvailability: number = 0;
        let universalAvailability: number = 0;
        const perWarehouseAvailability: Record<string, number> = {};

        articleRecords.forEach(record => {
            const currentAvailability = record.stock;
            const warehouseId = record.warehouseId;

            bestWarehouseAvailability = Math.max(bestWarehouseAvailability, currentAvailability);
            perWarehouseAvailability[warehouseId] = currentAvailability;
            universalAvailability += currentAvailability;
        });

        return {
            bestWarehouseAvailability,
            universalAvailability,
            perWarehouseAvailability,
        };
    }

    public async getArticleSetAvailability(articleIdSet: UUID[]): Promise<Record<string, Availability>> {
        const promiseArray: Promise<Availability>[] = articleIdSet.map(articleId => this.getArticleAvailability(articleId));
        const availability: Record<string, Availability> = {};

        const results = await Promise.all(promiseArray);

        articleIdSet.forEach((articleId, index) => {
            availability[articleId] = results[index];
        });

        return availability;
    }
}