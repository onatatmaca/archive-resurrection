/**
 * Storage abstraction layer
 *
 * By default, uses local filesystem storage.
 * Can be swapped to S3 by changing the import.
 */

// Use local storage by default (TrueNAS-friendly)
export * from './local';

// To use S3 instead, comment out above and uncomment below:
// export * from './s3';
