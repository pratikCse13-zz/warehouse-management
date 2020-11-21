import {Key} from 'aws-sdk/clients/dynamodb';
import {ProductModel} from './data/models';

export interface FailedDataSet<T> {
    record: T | Record<string, any>;
    reason: string;
}

export interface ValidationResult<T> {
    validData: T[];
    failedData: FailedDataSet<T>[];
}

export interface Availability {
    bestWarehouseAvailability: number;  // highest availability in the same warehouse
    universalAvailability: number;
    perWarehouseAvailability: Record<string, number>;
}

export type AvailabilitySet = Record<string, Availability>;

export interface ScanResult<T> {
    records: T[];
    newExclusiveStartKey?: Key;
}

export type ExclusiveStartKeyCache = Record<string, Key[]>;

export interface ProductWithAvailability extends ProductModel{
    availability: Availability;
}

export interface ListProductResponse {
    records: ProductWithAvailability[];
    lastPage: boolean;
}