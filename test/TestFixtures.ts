import {UploadNotificationMessage} from '../src/data/dto';
import {UUID} from 'io-ts-types/UUID';
import {ProductModel, ArticleModel} from '../src/data/models';
import {Availability} from '../src/types';

export class TestFixtures {
    public static getUploadNotifiactionMessage(uploadFolder: string): UploadNotificationMessage {
        return {
            s3: {
                bucket: {
                    name: 'demo',
                },
                object: {
                    key: uploadFolder,
                },
            },
        };
    }

    public static getValidArticleSet() {
        return {
            inventory: [
                {
                    'id': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                    'name': 'leg',
                    'stock': 1234,
                    'damagedStock': 3,
                    'warehouseId': 'eed9ffe0-c254-4538-82f0-13e8c7990211',
                },
                {
                    'id': '000459a0-7377-401b-9878-a975085b87f3',
                    'name': 'screw',
                    'stock': 12000,
                    'damagedStock': 12,
                    'warehouseId': '1098d638-c0d2-4e50-863b-e7d5f121a5da',
                },
                {
                    'id': '331b662a-2a42-44d7-9325-0bc7bd3ab8fe',
                    'name': 'seat',
                    'stock': 567,
                    'damagedStock': 123,
                    'warehouseId': '683d5836-be70-49a4-92d7-8703d323f658',
                },
            ],
        };
    }

    public static getArticleSetWithDuplicates() {
        return {
            inventory: [
                {
                    'id': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                    'name': 'leg',
                    'stock': 1234,
                    'damagedStock': 3,
                    'warehouseId': 'eed9ffe0-c254-4538-82f0-13e8c7990211',
                },
                {
                    'id': '000459a0-7377-401b-9878-a975085b87f3',
                    'name': 'screw',
                    'stock': 12000,
                    'damagedStock': 12,
                    'warehouseId': '1098d638-c0d2-4e50-863b-e7d5f121a5da',
                },
                {
                    'id': '000459a0-7377-401b-9878-a975085b87f3',
                    'name': 'screw',
                    'stock': 12000,
                    'damagedStock': 12,
                    'warehouseId': '1098d638-c0d2-4e50-863b-e7d5f121a5da',
                },
            ],
        };
    }

    public static getInvalidArticleSet() {
        return {
            inventory: [
                {
                    'id': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                    'name': 'leg',
                    'stock': 1234,
                    'damagedStock': '3',
                    'warehouseId': 'asdasd',
                },
                {
                    'id': '000459a0-7377-401b-9878-a975085b87f3',
                    'name': 'screw',
                    'stock': 12000,
                    'damagedStock': 12,
                    'warehouseId': '1098d638-c0d2-4e50-863b-e7d5f121a5da',
                },
            ],
        };
    }

    public static getValidProductSet() {
        return {
            'products': [
                {
                    'id': '4591ebc8-3164-4de5-ae65-e81dd4a4a62a',
                    'name': 'Dining Chair',
                    'assemblyTimeInMs': 3600000,
                    'containsArticles': [
                        {
                            'articleId': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                            'requiredAmount': 4,
                        },
                        {
                            'articleId': '000459a0-7377-401b-9878-a975085b87f3',
                            'requiredAmount': 8,
                        },
                        {
                            'articleId': '331b662a-2a42-44d7-9325-0bc7bd3ab8fe',
                            'requiredAmount': 1,
                        },
                    ],
                },
                {
                    'id': '203f47c2-7807-4e06-8c97-9149a6d12c53',
                    'name': 'Dinning Table',
                    'assemblyTimeInMs': 7200000,
                    'containsArticles': [
                        {
                            'articleId': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                            'requiredAmount': 4,
                        },
                        {
                            'articleId': '000459a0-7377-401b-9878-a975085b87f3',
                            'requiredAmount': 16,
                        },
                        {
                            'articleId': 'a6142067-2cb3-4e19-9dc4-706790f2e0f1',
                            'requiredAmount': 1,
                        },
                        {
                            'articleId': '203f47c2-7807-4e06-8c97-9149a6d12c53',
                            'requiredAmount': 4,
                        },
                        {
                            'articleId': '67d50c1d-e2e2-45a1-bd45-4ff014d542fd',
                            'requiredAmount': 1,
                        },
                    ],
                },
                {
                    'id': 'e1d3fd3e-0dad-424b-9634-5f63da94db38',
                    'name': 'door knob',
                    'assemblyTimeInMs': 3000000,
                    'containsArticles': [
                        {
                            'articleId': '0d846d21-2c43-4f8a-8657-86db7db735f0',
                            'requiredAmount': 2,
                        },
                        {
                            'articleId': '4591ebc8-3164-4de5-ae65-e81dd4a4a62a',
                            'requiredAmount': 1,
                        },
                        {
                            'articleId': 'a676147f-ec71-4bf8-8eed-36c587238da5',
                            'requiredAmount': 2,
                        },
                    ],
                },
            ],
        };
    }

    public static getInvalidProductSet() {
        return {
            'products': [
                {
                    'id': '4591ebc8-3164-4de5-ae65-e81dd4a4a62a',
                    'name': 'Dining Chair',
                    'assemblyTimeInMs': 3600000,
                    'containsArticles': [
                        {
                            'articleId': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                            'requiredAmount': 4,
                        },
                        {
                            'articleId': '000459a0-7377-401b-9878-a975085b87f3',
                            'requiredAmount': 8,
                        },
                        {
                            'articleId': '331b662a-2a42-44d7-9325-0bc7bd3ab8fe',
                            'requiredAmount': 1,
                        },
                    ],
                },
                {
                    'id': '203f47c2-7807-4e06-8c97-9149a6d12c53',
                    'name': 'Dinning Table',
                    'assemblyTimeInMs': 7200000,
                    'containsArticles': [],
                },
            ],
        };
    }

    public static getArticleRecord(id: UUID, warehouseId: UUID): ArticleModel {
        return {
            id,
            name: 'leg',
            stock: 1234,
            damagedStock: 3,
            warehouseId,
            createdAt: new Date('2020-11-20T12:00:44.823Z'),
            updatedAt: new Date('2020-11-22T12:00:44.823Z'),
        };
    }

    public static getProductRecord(id: UUID, articleIdSet: UUID[]): ProductModel {
        return {
            id,
            'name': 'Dining Chair',
            'assemblyTimeInMs': 3600000,
            'containsArticles': [
                {
                    'articleId': articleIdSet[0],
                    'requiredAmount': 4,
                },
                {
                    'articleId': articleIdSet[1],
                    'requiredAmount': 8,
                },
                {
                    'articleId': articleIdSet[2],
                    'requiredAmount': 1,
                },
            ],
            'createdAt': new Date('2020-11-20T12:00:44.823Z'),
            'updatedAt': new Date('2020-11-22T12:00:44.823Z'),
        };
    }

    public static getProductList() {
        return [
            {
                'containsArticles': [
                    {
                        'articleId': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                        'requiredAmount': 4,
                    },
                    {
                        'articleId': '000459a0-7377-401b-9878-a975085b87f3',
                        'requiredAmount': 8,
                    },
                    {
                        'articleId': '331b662a-2a42-44d7-9325-0bc7bd3ab8fe',
                        'requiredAmount': 1,
                    },
                ],
                'id': '4591ebc8-3164-4de5-ae65-e81dd4a4a62a',
                'assemblyTimeInMs': 3600000,
                'name': 'Dining Chair',
                'updatedAt': '2020-11-19T18:45:02.045Z',
                'availability': {
                    'bestWarehouseAvailability': 3969,
                    'universalAvailability': 2159,
                    'perWarehouseAvailability': {
                        '683d5836-be70-49a4-92d7-8703d323f658': 3969,
                    },
                },
            },
            {
                'containsArticles': [
                    {
                        'articleId': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                        'requiredAmount': 4,
                    },
                    {
                        'articleId': '000459a0-7377-401b-9878-a975085b87f3',
                        'requiredAmount': 16,
                    },
                    {
                        'articleId': 'a6142067-2cb3-4e19-9dc4-706790f2e0f1',
                        'requiredAmount': 1,
                    },
                    {
                        'articleId': '203f47c2-7807-4e06-8c97-9149a6d12c53',
                        'requiredAmount': 4,
                    },
                ],
                'id': '203f47c2-7807-4e06-8c97-9149a6d12c53',
                'assemblyTimeInMs': 7200000,
                'name': 'Dinning Table',
                'updatedAt': '2020-11-19T18:45:02.046Z',
                'availability': {
                    'bestWarehouseAvailability': null,
                    'universalAvailability': 2159,
                    'perWarehouseAvailability': {},
                },
            },
            {
                'containsArticles': [
                    {
                        'articleId': '0d846d21-2c43-4f8a-8657-86db7db735f0',
                        'requiredAmount': 2,
                    },
                    {
                        'articleId': '4591ebc8-3164-4de5-ae65-e81dd4a4a62a',
                        'requiredAmount': 1,
                    },
                    {
                        'articleId': 'a676147f-ec71-4bf8-8eed-36c587238da5',
                        'requiredAmount': 2,
                    },
                ],
                'id': 'e1d3fd3e-0dad-424b-9634-5f63da94db38',
                'assemblyTimeInMs': 3000000,
                'name': 'door knob',
                'updatedAt': '2020-11-19T18:45:02.046Z',
                'availability': {
                    'bestWarehouseAvailability': 22672676,
                    'universalAvailability': 22672676,
                    'perWarehouseAvailability': {
                        'eed9ffe0-c254-4538-82f0-13e8c7990211': 22672676,
                    },
                },
            },
        ];
    }

    public static getCachedProductAvailability(productId: UUID, warehouseId: UUID): Record<string, Availability> {
        const cachedAvailability: Record<string, Availability> = {};
        cachedAvailability[productId] = {
            bestWarehouseAvailability: 200,
            universalAvailability: 200,
            perWarehouseAvailability: {},
        };
        cachedAvailability[productId].perWarehouseAvailability[warehouseId] = 200;
        return cachedAvailability;
    }

    public static getArticleSetAvailability(articleIds: UUID[], warehouseIds: UUID[]): Record<string, Availability> {
        const totalAvailability = 100 * warehouseIds.length;
        const availability = {};

        articleIds.forEach(articleId => {
            const currentArticleAvailability = {
                bestWarehouseAvailability: 100,
                universalAvailability: totalAvailability,
                perWarehouseAvailability: {},
            };

            warehouseIds.forEach(warehouseId => {
                currentArticleAvailability.perWarehouseAvailability[warehouseId] = 100;
            });

            availability[articleId] = currentArticleAvailability;
        });

        return availability;
    }
}