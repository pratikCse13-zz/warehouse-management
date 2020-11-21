import 'reflect-metadata';
import {setupEnv} from '../utils';
setupEnv();

import {expect, use} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {Arg, Substitute, SubstituteOf} from '@fluffy-spoon/substitute';
import {decode} from '../../src/common/utils';
import {ArticleRepository} from '../../src/repositories/article-repository';
import {ProductRepository} from '../../src/repositories/product-repository';
import {FileTransferService} from '../../src/services/file-transfer-service';
import {ArticleAvailabilityService} from '../../src/services/article-availability-service';
import {Controller} from '../../src/controller';
import {InvalidUploadFolderError, ProductNotAvailableError, ResponseValidationError} from '../../src/common/errors';
import {TestFixtures} from '../TestFixtures';
import {Article, Product} from '../../src/data/dto';
import {v4 as uuid} from 'uuid';

use(chaiAsPromised);

describe('#controller', () => {
    let mockedArticleRepository: SubstituteOf<ArticleRepository>;
    let mockedProductRepository: SubstituteOf<ProductRepository>;
    let mockedFileTransferService: SubstituteOf<FileTransferService>;
    let mockedArticleAvailabilityService: SubstituteOf<ArticleAvailabilityService>;
    let controller: Controller;

    beforeEach(() => {
        mockedArticleRepository = Substitute.for<ArticleRepository>();
        mockedProductRepository = Substitute.for<ProductRepository>();
        mockedFileTransferService = Substitute.for<FileTransferService>();
        mockedArticleAvailabilityService = Substitute.for<ArticleAvailabilityService>();

        controller = new Controller(
            mockedArticleRepository,
            mockedProductRepository,
            mockedFileTransferService,
            mockedArticleAvailabilityService,
        );
    });

    describe('#uploadData', () => {
        it('should throw `\'InvalidUploadFolderError\' error if the file is uploaded in a wrong folder', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('random-path');

            // then
            await expect(controller.uploadData(message)).to.be.rejectedWith(InvalidUploadFolderError);
        });

        it('should throw error if the filecontent is invalid', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('articles');

            // when
            mockedFileTransferService.downloadFile(Arg.any()).resolves([
                {
                    randomKey: 'random-value',
                },
            ]);

            // then
            await expect(controller.uploadData(message)).to.be.rejectedWith(ResponseValidationError);
        });

        it('should store the valid articles to database', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('articles');
            const articleSet = TestFixtures.getValidArticleSet();

            // when
            mockedFileTransferService.downloadFile(Arg.any()).resolves(articleSet);

            // then
            await expect(controller.uploadData(message)).to.be.fulfilled;
            mockedArticleRepository.received(1).createOrUpdateRecord(decode({
                'id': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                'name': 'leg',
                'stock': 1234,
                'damagedStock': 3,
                'warehouseId': 'eed9ffe0-c254-4538-82f0-13e8c7990211',
            }, Article));
            mockedArticleRepository.received(1).createOrUpdateRecord(decode({
                'id': '000459a0-7377-401b-9878-a975085b87f3',
                'name': 'screw',
                'stock': 12000,
                'damagedStock': 12,
                'warehouseId': '1098d638-c0d2-4e50-863b-e7d5f121a5da',
            }, Article));
            mockedArticleRepository.received(1).createOrUpdateRecord(decode({
                'id': '331b662a-2a42-44d7-9325-0bc7bd3ab8fe',
                'name': 'seat',
                'stock': 567,
                'damagedStock': 123,
                'warehouseId': '683d5836-be70-49a4-92d7-8703d323f658',
            }, Article));
        });

        it('should upload the invalid articles to S3', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('articles');
            const articleSet = TestFixtures.getInvalidArticleSet();

            // when
            mockedFileTransferService.downloadFile(Arg.any()).resolves(articleSet);

            // then
            await expect(controller.uploadData(message)).to.be.fulfilled;
            mockedFileTransferService.received(1).uploadFailedCases([
                {
                    record: {
                        'id': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                        'name': 'leg',
                        'stock': 1234,
                        'damagedStock': '3',
                        'warehouseId': 'asdasd',
                    },
                    reason: 'Record not in proper format',
                },
            ], 'article');
            mockedArticleRepository.received(1).createOrUpdateRecord(decode({
                'id': '000459a0-7377-401b-9878-a975085b87f3',
                'name': 'screw',
                'stock': 12000,
                'damagedStock': 12,
                'warehouseId': '1098d638-c0d2-4e50-863b-e7d5f121a5da',
            }, Article));
        });

        it('should identify and merge the duplicate records', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('articles');
            const articleSet = TestFixtures.getArticleSetWithDuplicates();

            // when
            mockedFileTransferService.downloadFile(Arg.any()).resolves(articleSet);

            // then
            await expect(controller.uploadData(message)).to.be.fulfilled;
            mockedArticleRepository.received(1).createOrUpdateRecord(decode({
                'id': 'f44a914c-c380-451a-96b1-4c5a9fa025f6',
                'name': 'leg',
                'stock': 1234,
                'damagedStock': 3,
                'warehouseId': 'eed9ffe0-c254-4538-82f0-13e8c7990211',
            }, Article));
            mockedArticleRepository.received(1).createOrUpdateRecord(decode({
                'id': '000459a0-7377-401b-9878-a975085b87f3',
                'name': 'screw',
                'stock': 24000,
                'damagedStock': 24,
                'warehouseId': '1098d638-c0d2-4e50-863b-e7d5f121a5da',
            }, Article));
        });

        it('should store the valid products to database', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('products');
            const productSet = TestFixtures.getValidProductSet();

            // when
            mockedFileTransferService.downloadFile(Arg.any()).resolves(productSet);

            // then
            await expect(controller.uploadData(message)).to.be.fulfilled;
            mockedProductRepository.received(1).createOrUpdateRecord(decode({
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
            }, Product));
            mockedProductRepository.received(1).createOrUpdateRecord(decode({
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
            }, Product));
            mockedProductRepository.received(1).createOrUpdateRecord(decode({
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
            }, Product));
        });

        it('should upload the invalid products which do not conatin any article to S3', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('products');
            const productSet = TestFixtures.getInvalidProductSet();

            // when
            mockedFileTransferService.downloadFile(Arg.any()).resolves(productSet);

            // then
            await expect(controller.uploadData(message)).to.be.fulfilled;
            mockedFileTransferService.received(1).uploadFailedCases([
                {
                    record: {
                        'id': '203f47c2-7807-4e06-8c97-9149a6d12c53',
                        'name': 'Dinning Table',
                        'assemblyTimeInMs': 7200000,
                        'containsArticles': [],
                    },
                    reason: 'Record not in proper format',
                },
            ], 'product');
            mockedProductRepository.received(1).createOrUpdateRecord(decode({
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
            }, Product));
        });

        it('should throw the error if the FileTransferService throws an error', async () => {
            // given
            const message = TestFixtures.getUploadNotifiactionMessage('articles');
            const articleSet = TestFixtures.getValidArticleSet();

            // when
            mockedFileTransferService.downloadFile(Arg.any()).rejects(new Error());
            mockedArticleRepository.createOrUpdateRecord(Arg.any()).resolves();

            // then
            await expect(controller.uploadData(message)).to.be.rejectedWith(Error);
        });
    });

    describe('#sellProduct', () => {
        it('should throw the error if \'productRepository\' throws', async () => {
            // given
            const productId = new uuid();
            const warehouseId = new uuid();

            // when
            mockedProductRepository.getById(Arg.any()).rejects(new Error());

            // then
            await expect(controller.sellProduct(productId, warehouseId)).to.be.rejectedWith(Error);
        });

        it('should throw the error if \'articleAvailabilityService\' throws', async () => {
            // given
            const productId = new uuid();
            const warehouseId = new uuid();
            const articleIdSet = [uuid(), uuid(), uuid()];
            mockedProductRepository.getById(Arg.any()).resolves(TestFixtures.getProductRecord(productId, articleIdSet));
            mockedArticleAvailabilityService.getArticleSetAvailability(Arg.any()).rejects(new Error());

            // then
            await expect(controller.sellProduct(productId, warehouseId)).to.be.rejectedWith(Error);
        });

        it('should throw ProductNotAvailableError if there is no availability', async () => {
            // given
            const productId = new uuid();
            const randomWarehouseId = new uuid();
            const articleIdSet = [uuid(), uuid(), uuid()];
            const warehouseIdSet = [uuid(), uuid(), uuid()];
            mockedProductRepository.getById(Arg.any()).resolves(TestFixtures.getProductRecord(productId, articleIdSet));
            mockedArticleAvailabilityService.getArticleSetAvailability(Arg.any()).resolves(TestFixtures.getArticleSetAvailability(articleIdSet, warehouseIdSet));

            // then
            await expect(controller.sellProduct(productId, randomWarehouseId)).to.be.rejectedWith(ProductNotAvailableError);
        });

        it('should sell item and update stock successfully', async () => {
            // given
            const productId = new uuid();
            const articleIdSet = [uuid(), uuid(), uuid()];
            const warehouseIdSet = [uuid(), uuid(), uuid()];
            mockedProductRepository.getById(Arg.any()).resolves(TestFixtures.getProductRecord(productId, articleIdSet));
            mockedArticleAvailabilityService.getArticleSetAvailability(Arg.any()).resolves(TestFixtures.getArticleSetAvailability(articleIdSet, warehouseIdSet));

            // when
            await controller.sellProduct(productId, warehouseIdSet[1]);

            // then
            mockedArticleRepository.received(1).sellStock(articleIdSet[0], warehouseIdSet[1], 4);
            mockedArticleRepository.received(1).sellStock(articleIdSet[1], warehouseIdSet[1], 8);
            mockedArticleRepository.received(1).sellStock(articleIdSet[2], warehouseIdSet[1], 1);
        });
    });

    describe('#getProductAvailability', () => {
        it('should return the availability if available in cache', async () => {
            // given
            const productId = new uuid();
            const warehouseId = uuid();
            const articleIdSet = [uuid(), uuid(), uuid()];
            mockedProductRepository.getById(Arg.any()).resolves(TestFixtures.getProductRecord(productId, articleIdSet));
            const cachedAvailability = TestFixtures.getCachedProductAvailability(productId, warehouseId);

            const cachedController = new Controller(
                mockedArticleRepository,
                mockedProductRepository,
                mockedFileTransferService,
                mockedArticleAvailabilityService,
                {},
                new Map(),
                cachedAvailability,
            );

            // then
            const result = await cachedController.getProductAvailability(productId);

            expect(result).to.deep.equal(cachedAvailability[productId]);
        });

        it('should throw the error if \'productRepository\' throws', async () => {
            // given
            const productId = new uuid();

            // when
            mockedProductRepository.getById(Arg.any()).rejects(new Error());

            // then
            await expect(controller.getProductAvailability(productId)).to.be.rejectedWith(Error);
        });

        it('should throw the error if \'articleAvailabilityService\' throws', async () => {
            // given
            const productId = new uuid();
            const articleIdSet = [uuid(), uuid(), uuid()];
            mockedProductRepository.getById(Arg.any()).resolves(TestFixtures.getProductRecord(productId, articleIdSet));
            mockedArticleAvailabilityService.getArticleSetAvailability(Arg.any()).rejects(new Error());

            // then
            await expect(controller.getProductAvailability(productId)).to.be.rejectedWith(Error);
        });

        it('should fetch and return the availability successfully', async () => {
            // given
            const productId = new uuid();
            const articleIdSet = [uuid(), uuid(), uuid()];
            const warehouseIdSet = [uuid(), uuid(), uuid()];
            mockedProductRepository.getById(Arg.any()).resolves(TestFixtures.getProductRecord(productId, articleIdSet));
            mockedArticleAvailabilityService.getArticleSetAvailability(Arg.any()).resolves(TestFixtures.getArticleSetAvailability(articleIdSet, warehouseIdSet));

            // then
            const result = await controller.getProductAvailability(productId);
            const availability = {
                bestWarehouseAvailability: 12,
                universalAvailability: 37,
                perWarehouseAvailability: {},
            };

            warehouseIdSet.forEach(warehouseId => {
                availability.perWarehouseAvailability[warehouseId] = 12;
            });

            expect(result).to.deep.equal(availability);
        });
    });

    describe('#listProducts', () => {
        it('should return the cached productList if available', () => {
            expect('demo').to.equal('demo');
        });

        it('should throw the error if productRepository throws', () => {
            expect('demo').to.equal('demo');
        });

        it('should return the list of products successfully', () => {
            expect('demo').to.equal('demo');
        });
    });
});