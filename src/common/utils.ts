import {NullOrUndefinedError, ResponseValidationError} from './errors';
import {fold} from 'fp-ts/lib/Either';
import {Decoder} from 'io-ts';
import {PathReporter} from 'io-ts/lib/PathReporter';
import {Article, Product, ArticleFileContent, ProductFileContent} from '../data/dto';
import _ from 'lodash';
import Log from '@dazn/lambda-powertools-logger';
import {FailedDataSet, ValidationResult} from '../types';
import {UUID} from 'io-ts-types';

/**
 * Given a value, check that it is not undefined or null and return the value, narrow the type to
 * T in the process. If the value _is_ either undefined or null we throw an error.
 * @param toCheck The value to check.
 * @param message A potential message to pass to the error in case one is thrown.
 */
export function narrowOrThrow<T>(toCheck: T | undefined | null, message?: string): T {
    if (toCheck == null) {
        throw new NullOrUndefinedError(message ?? 'Given argument was null or undefined');
    }

    return toCheck;
}

/**
 * Decode json object based on the provided decoder
 * @param input the input
 * @param decoder the decoder to apply
 */
export function decode<A>(input: unknown, decoder: Decoder<unknown, A>): A {
    const decoded = decoder.decode(input);

    return fold(
        () => {
            throw new ResponseValidationError(`${PathReporter.report(decoded)}`);
        },
        (right: A) => right,
    )(decoded);
}

// tech debt - functional programming
export function validateArticles(fileContent: Record<string, any>): ValidationResult<Article> {
    const articleFileData = decode(fileContent, ArticleFileContent);
    const hash: Record<string, Article> = {};
    const failedData: FailedDataSet<Article>[] = [];

    articleFileData.inventory.forEach(rawDataPoint => {
        let articleData: Article;

        try {
            articleData = decode(rawDataPoint, Article);
        } catch(err) {
            if(err instanceof ResponseValidationError) {
                const reason = 'Record not in proper format';
                failedData.push({
                    record: rawDataPoint,
                    reason,
                });
                Log.warn(`Invalid article record found in file`, {record: rawDataPoint, reason});
            }
            return;
        }

        const hashKey = articleData.id.toString() + articleData.warehouseId.toString();
        if (!hash[hashKey]) {
            hash[hashKey] = articleData;
        } else {
            hash[hashKey].stock += articleData.stock;
            hash[hashKey].damagedStock += articleData.damagedStock;
        }
    });

    return {
        validData: Object.values(hash),
        failedData,
    };
}

// tech debt - functional programming
export function validateProducts(fileContent: Record<string, any>): ValidationResult<Product> {
    const fileData = decode(fileContent, ProductFileContent);
    const hash: Record<UUID, Product> = {};
    const failedData: FailedDataSet<Product>[] = [];

    fileData.products.forEach(rawDataPoint => {
        let productData: Product;

        try {
            productData = decode(rawDataPoint, Product);
        } catch(err) {
            if(err instanceof ResponseValidationError) {
                const reason = 'Record not in proper format';
                failedData.push({
                    record: rawDataPoint,
                    reason,
                });
                Log.warn(`Invalid product record found in file`, {record: rawDataPoint, reason});
            }
            return;
        }

        if(!hash[productData.id]) {
            hash[productData.id] = productData;
        } else {
            const reason = 'duplicate product record present in file';
            failedData.push({
                record: productData,
                reason,
            });
            Log.warn(`Invalid product record found in file`, {record: rawDataPoint, reason});
        }
    });

    return {
        validData: Object.values(hash),
        failedData,
    };
}

/* tslint:disable */
export function getAuthorizerPolicyDocument(methodArn: string) {
    const userId = 'b348e8ae-a297-4ff4-bbd6-0799964d40dc';

    return {
        "principalId": "user",
        "context": {
            "userId": userId
        },
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow",
                    "Resource": methodArn
                }
            ]
        }
    };
}