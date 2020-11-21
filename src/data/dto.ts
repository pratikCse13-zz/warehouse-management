import * as iots from 'io-ts';
import {UUID} from 'io-ts-types';

export const UploadFolder = iots.keyof({
    article: 'articles',
    product: 'products',
});
export type UploadFolder = iots.TypeOf<typeof UploadFolder>;

export const Article = iots.interface({
    id: UUID,
    name: iots.string,
    stock: iots.number,
    damagedStock: iots.number,
    warehouseId: UUID,
});
export type Article = iots.TypeOf<typeof Article>;

export const ArticleSet = iots.array(Article);
export type ArticleSet = iots.TypeOf<typeof ArticleSet>;

export const ArticleFileContent = iots.interface({
    inventory: iots.array(iots.object),
});
export type ArticleFileContent = iots.TypeOf<typeof ArticleFileContent>;

export const ProductArticleMapping = iots.interface({
    articleId: UUID,
    requiredAmount: iots.number,
});
export type ProductArticleMapping = iots.TypeOf<typeof ProductArticleMapping>;

interface ProductArticleMappingSetBrand {
    readonly ProductArticleMappingSet: unique symbol;
}
export const ProductArticleMappingSet = iots.brand(
    iots.array(ProductArticleMapping),
    (s): s is iots.Branded<ProductArticleMapping[], ProductArticleMappingSetBrand> => s.length > 0,
    'ProductArticleMappingSet',
);
export type ProductArticleMappingSet = iots.TypeOf<typeof ProductArticleMappingSet>;

export const Product = iots.interface({
    id: UUID,
    name: iots.string,
    containsArticles: ProductArticleMappingSet,
    assemblyTimeInMs: iots.number,
});
export type Product = iots.TypeOf<typeof Product>;

export const ProductSet = iots.array(Product);
export type ProductSet = iots.TypeOf<typeof ProductSet>;

export const ProductFileContent = iots.interface({
    products: iots.array(iots.object),
});
export type ProductFileContent = iots.TypeOf<typeof ProductFileContent>;

export const GetStockAvailabilityRequest = iots.array(iots.interface({
    articleId: UUID,
    requiredAmount: iots.number,
}));
export type GetStockAvailabilityRequest = iots.TypeOf<typeof GetStockAvailabilityRequest>;

export const StockAvailabilityResponse = iots.interface({
    availability: iots.boolean,
    stock: iots.array(iots.interface({
        articleId: UUID,
        availableAmount: iots.number,
    })),
});
export type StockAvailabilityResponse = iots.TypeOf<typeof StockAvailabilityResponse>;

export const UploadNotificationMessage = iots.type({
    s3: iots.type({
        bucket: iots.type({
            name: iots.string,
        }),
        object: iots.type({
            key: iots.string,
        }),
    }),
});
export type UploadNotificationMessage = iots.TypeOf<typeof UploadNotificationMessage>;

export const GetProductAvailabilityEvent = iots.type({
    pathParameters: iots.type({
        productId: UUID,
    }),
});
export type GetProductAvailabilityEvent = iots.TypeOf<typeof GetProductAvailabilityEvent>;

export const SellProductEvent = iots.type({
    pathParameters: iots.type({
        productId: UUID,
    }),
    body: iots.string,
});
export type SellProductEvent = iots.TypeOf<typeof SellProductEvent>;

interface PageNumberBrand {
    readonly PageNumber: unique symbol;
}
export const PageNumber = iots.brand(
    iots.number,
    (s): s is iots.Branded<number, PageNumberBrand> => s > 0,
    'PageNumber',
);
export type PageNumber = iots.TypeOf<typeof PageNumber>;

export const PaginationDetails = iots.partial({
    page: PageNumber,
});
export type PaginationDetails = iots.TypeOf<typeof PaginationDetails>;

export const ListProductsEvent = iots.intersection([
    iots.partial({
        queryStringParameters: iots.union([
            PaginationDetails,
            iots.null,
        ]),
    }),
    iots.type({
        requestContext: iots.type({
            authorizer: iots.type({
                userId: UUID,
            }),
        }),
    }),
]);
export type ListProductsEvent = iots.TypeOf<typeof ListProductsEvent>;

