import middy from '@middy/core';
import {
    RequestValidationError,
    ResponseValidationError,
    InvalidUploadFolderError,
    ProductNotAvailableError,
    ProductNotFoundError,
    ArticleNotFoundError,
    NullOrUndefinedError,
} from './errors';
import Log from '@dazn/lambda-powertools-logger';
import {decode} from './utils';
import {Decoder} from 'io-ts';
import assert from 'assert';
import CorrelationIds from '@dazn/lambda-powertools-correlation-ids';

interface ErrorResponse {
    code: string;
    message: string;
    traceId?: string;
}

/**
 * Middleware function to map errors to http response.
 */
export const errorHandlerMiddleware = (): middy.MiddlewareObject<any, any> => {
    return {
        onError: (handler, next) => {
            Log.error('error occurred while processing', {err: handler.error});
            return next();
        },
    };
};

/**
 * Middleware function to map errors to http response.
 */
export const httpErrorHandlerMiddleware = (): middy.MiddlewareObject<any, any> => {
    return {
        onError: (handler, next) => {
            const errorResponse = (statusCode: number, body: ErrorResponse) => {
                const correlationIds = CorrelationIds.get();
                handler.response = {
                    statusCode,
                    body: JSON.stringify({...body, traceId: correlationIds['x-correlation-id']}, null, 2),
                };

                return next();
            };

            const error = handler.error;
            Log.error('error occurred while processing', {err: handler.error});

            if (error instanceof RequestValidationError) {
                return errorResponse(400, {message: `${error.message}`, code: 'BAD_REQUEST'});
            }
            if (error instanceof ResponseValidationError) {
                return errorResponse(502, {message: `${error.message}`, code: 'REMOTE_SERVER_ERROR'});
            }
            if (error instanceof InvalidUploadFolderError) {
                return errorResponse(400, {message: `${error.message}`, code: 'INVALID_UPLOAD_FOLDER'});
            }
            if (error instanceof NullOrUndefinedError || error instanceof ArticleNotFoundError || error instanceof ProductNotFoundError) {
                return errorResponse(404, {message: `${error.message}`, code: 'RESOURCE_UNKNOWN'});
            }
            if (error instanceof ProductNotAvailableError) {
                return errorResponse(412, {message: `${error.message}`, code: 'PRODUCT_NOT_AVAILABLE'});
            }

            Log.error('Unexpected error while handling the request: ', error);
            return errorResponse(500, {message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR'});
        },
    };
};

/**
 * Middleware function to decode input message for a step function handler.
 * @param decoder io-ts decoder
 */
export const decodeInputMiddleware = <A>(decoder: Decoder<unknown, A>): middy.MiddlewareObject<any, any> => {
    return {
        before: (handler, next) => {
            Log.debug(`${handler.context?.functionName} - Input message`, {inputMessage: handler.event.Records[0].body});

            assert.strictEqual(handler.event.Records.length, 1, 'The payload contains multiple events, cannot continue the upload process');
            const body = JSON.parse(handler.event.Records[0].body);
            assert.strictEqual(body.Records.length, 1, 'The event contains multiple files, cannot continue the upload process');

            handler.event = decode(body.Records[0], decoder);

            return next();
        },
    };
};