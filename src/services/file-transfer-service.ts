import {narrowOrThrow} from '../common/utils';
import {AppConfig} from '../common/app-config';
import S3 from 'aws-sdk/clients/s3';
import Log from '@dazn/lambda-powertools-logger';
import {FailedDataSet} from '../types';
import {UploadFolder} from '../data/dto';

export class FileTransferService {

    private readonly timeout = 15000;
    private readonly appConfig: AppConfig;
    private readonly s3Sdk: S3;

    constructor(
        appConfig: AppConfig = AppConfig.getInstance(),
        s3Sdk: S3 = new S3({apiVersion: '2010-12-01'}),
    ) {
        this.appConfig = appConfig;
        this.s3Sdk = s3Sdk;
    }

    public async downloadFile(key: string): Promise<Record<string, any>> {
        Log.info(`downloading file at path - ${key}`);
        let response: S3.Types.GetObjectOutput;
        let data: Record<string, any>;
        try {
            response = await this.s3Sdk.getObject({
                Bucket: this.appConfig.uploadBucketName,
                Key: key,
            }).promise();
            data = JSON.parse(narrowOrThrow(response?.Body?.toString()));
            Log.info(`downloaded file at path - ${key}`);
        } catch(err) {
            Log.error(`error occurred while downloading file at path - ${key}`, err);
            throw err;
        }

        return data;
    }

    public async uploadFailedCases<T>(failedDataSet: FailedDataSet<T>[], uploadFolder: UploadFolder) {
        const filepath = this.getFailedCasesFilePath(uploadFolder);
        Log.info(`uploading failed cases to path - ${filepath}`);
        try {
            await this.s3Sdk.putObject({
                Body: JSON.stringify(failedDataSet),
                Bucket: this.appConfig.uploadBucketName,
                Key: filepath,
            }).promise();
        } catch(err) {
            Log.error(`error occurred while uploading errors file at path - ${filepath}`, err);
            throw err;
        }
        Log.info(`uploaded failed cases at path - ${filepath}`);
    }

    private getFailedCasesFilePath(uploadFolder: UploadFolder): string {
        return `errors/${UploadFolder.keys[uploadFolder]}/errors-${(new Date()).getTime()}.json`;
    }
}
