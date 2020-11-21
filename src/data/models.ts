import {
    CollectionProperty,
    DateProperty,
    Model,
    PartitionKey,
    SortKey,
    Property,
} from '@shiftcoders/dynamo-easy';
import {uuidMapper} from './ddb-mappers';
import {AppConfig} from '../common/app-config';
import {UUID} from 'io-ts-types/lib/UUID';

const appConfig = AppConfig.getInstance();

@Model({tableName: appConfig.articleTableName})
export class ArticleModel {
    @PartitionKey()
    @Property({mapper: uuidMapper})
    id!: UUID;
    name!: string;
    stock!: number;
    damagedStock: number = 0;
    @SortKey()
    @Property({mapper: uuidMapper})
    warehouseId!: UUID;
    @DateProperty()
    createdAt: Date = new Date();
    @DateProperty()
    updatedAt!: Date;
}

@Model()
export class ProductArticleMappingModel {
    @Property({mapper: uuidMapper})
    articleId!: UUID;
    requiredAmount!: number;
}

@Model({tableName: appConfig.productTableName})
export class ProductModel {
    @PartitionKey()
    @Property({mapper: uuidMapper})
    id!: UUID;
    name!: string;
    @CollectionProperty({itemType: ProductArticleMappingModel})
    containsArticles!: ProductArticleMappingModel[];
    assemblyTimeInMs!: number;
    @DateProperty()
    createdAt: Date = new Date();
    @DateProperty()
    updatedAt!: Date;
}
