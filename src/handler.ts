import 'reflect-metadata';
import middy from '@middy/core';
import {Controller} from './controller';
import Log from '@dazn/lambda-powertools-logger';
import {decodeInputMiddleware, errorHandlerMiddleware, httpErrorHandlerMiddleware} from './common/middleware';
import {APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerHandler} from 'aws-lambda';
import {decode, getAuthorizerPolicyDocument} from './common/utils';
import {UploadNotificationMessage, GetProductAvailabilityEvent, SellProductEvent, ListProductsEvent, PageNumber} from './data/dto';
import {RequestValidationError} from './common/errors';
import {UUID} from 'io-ts-types';
import {ListProductResponse} from './types';

/**
 * Handler class for the the step function related lambda functions.
 */
export class Handler {

    private readonly controller = new Controller();

    public async uploadData(message: UploadNotificationMessage): Promise<void> {
        Log.info(`Upload data handler`, {event: message});
        await this.controller.uploadData(message);
        Log.info(`Upload data handler successfully completed`);
    }

    public async authorizer(event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
        return getAuthorizerPolicyDocument(event.methodArn);
    }

    public async getProductAvailability(event: APIGatewayProxyEvent, context): Promise<APIGatewayProxyResult> {
        Log.info(`Fetch product availability handler`, {event, context});

        let getProductAvailabilityEvent: GetProductAvailabilityEvent;
        let productId: UUID;

        try {
            getProductAvailabilityEvent = decode(event, GetProductAvailabilityEvent);
            productId = getProductAvailabilityEvent.pathParameters.productId;
        } catch(err) {
            Log.warn(`the event is not in proper format`);
            throw new RequestValidationError();
        }

        const productAvailability = await this.controller.getProductAvailability(productId);
        Log.info(`Fetch product availability handler successfully completed`);

        return {
            statusCode: 201,
            body: JSON.stringify({
                availability: productAvailability,
            }, null, 4),
        };
    }

    public async sellProduct(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        Log.info(`Sell product handler`, {event});

        let sellProductEvent: SellProductEvent;
        let productId: UUID;
        let body: Record<string, any>;
        let warehouseId: UUID;

        try {
            sellProductEvent = decode(event, SellProductEvent);
            productId = sellProductEvent.pathParameters.productId;
            body = JSON.parse(sellProductEvent.body);
            warehouseId = decode(body.warehouseId, UUID);
        } catch(err) {
            Log.warn(`the event is not in proper format`);
            throw new RequestValidationError();
        }

        await this.controller.sellProduct(productId, warehouseId);
        Log.info(`Sell product handler successfully completed`);

        return {
            statusCode: 201,
            body: JSON.stringify({messgae: 'stock successfully updated'}, null, 4),
        };
    }

    public async listProducts(event: APIGatewayProxyEvent, context): Promise<APIGatewayProxyResult> {
        Log.info(`List product and availability handler`, {event, context});

        let listProductsEvent: ListProductsEvent;
        let page: PageNumber | undefined;
        let userId: UUID;

        try {
            listProductsEvent = decode(event, ListProductsEvent);
            page = listProductsEvent?.queryStringParameters?.page;
            userId = listProductsEvent.requestContext.authorizer.userId;
        } catch(err) {
            Log.warn(`the event is not in proper format`);
            throw new RequestValidationError();
        }

        const listProductResponse: ListProductResponse = await this.controller.listProducts(userId, page);

        return {
            statusCode: 201,
            body: JSON.stringify(listProductResponse, null, 4),
        };
    }
}

const handler = new Handler();

export const uploadData: middy.Middy<any, void> = middy(handler.uploadData.bind(handler))
    .use(errorHandlerMiddleware())
    .use(decodeInputMiddleware(UploadNotificationMessage));

export const getProductAvailability = middy(handler.getProductAvailability.bind(handler))
    .use(httpErrorHandlerMiddleware());

export const sellProduct = middy(handler.sellProduct.bind(handler))
    .use(httpErrorHandlerMiddleware());

export const listProducts = middy(handler.listProducts.bind(handler))
    .use(httpErrorHandlerMiddleware());

export const authorizer: APIGatewayTokenAuthorizerHandler = handler.authorizer.bind(handler);
