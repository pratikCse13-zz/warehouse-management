export class NullOrUndefinedError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, NullOrUndefinedError.prototype);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class RequestValidationError extends Error {
    constructor(message = 'Request validation error') {
        super(message);
        Object.setPrototypeOf(this, RequestValidationError.prototype);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ResponseValidationError extends Error {
    constructor(message = 'Response validation error') {
        super(message);
        Object.setPrototypeOf(this, ResponseValidationError.prototype);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ArticleNotFoundError extends Error {
    constructor(message = 'Article record not found in the database') {
        super(message);
        Object.setPrototypeOf(this, ArticleNotFoundError.prototype);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ProductNotFoundError extends Error {
    constructor(message = 'Product is not yet offered, sorry') {
        super(message);
        Object.setPrototypeOf(this, ProductNotFoundError.prototype);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ProductNotAvailableError extends Error {
    constructor(message = 'Product is not in stock, sorry') {
        super(message);
        Object.setPrototypeOf(this, ProductNotAvailableError.prototype);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class InvalidUploadFolderError extends Error {
    constructor(message = 'The file was uploaded in an invalid folder, the upload process cannot be continued') {
        super(message);
        Object.setPrototypeOf(this, InvalidUploadFolderError.prototype);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}