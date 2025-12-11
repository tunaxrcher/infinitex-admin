import AWS from 'aws-sdk';

interface UploadOptions {
  folder?: string;
  filename?: string;
}

interface UploadResult {
  url: string;
  key: string;
}

class DigitalOceanStorage {
  private s3: AWS.S3;
  private bucketName: string;
  private cdnUrl: string;

  constructor() {
    this.bucketName = 'infinitex-demo';
    this.cdnUrl = `https://${this.bucketName}.sgp1.digitaloceanspaces.com`;

    // Configure DigitalOcean Spaces
    const endpoint =
      process.env.DO_SPACES_ENDPOINT || 'https://sgp1.digitaloceanspaces.com';

    this.s3 = new AWS.S3({
      endpoint,
      accessKeyId: process.env.DO_SPACES_KEY || '',
      secretAccessKey:
        process.env.DO_SPACES_SECRET ||
        '',
      s3ForcePathStyle: true, // Use path-style URLs to avoid subdomain certificate issues
      signatureVersion: 'v4',
      region: 'sgp1',
      maxRetries: 3,
      sslEnabled: endpoint.startsWith('https'),
      httpOptions: {
        timeout: 30000,
        connectTimeout: 10000,
      },
    });
  }

  /**
   * Upload file to DigitalOcean Spaces
   */
  async uploadFile(
    file: Buffer | Uint8Array | string,
    contentType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);

      const folder = options.folder || 'uploads';
      const filename = options.filename || `file_${timestamp}_${randomString}`;
      const key = `${folder}/${filename}`;

      console.log('[Storage] Configuration:', {
        endpoint: this.s3.endpoint?.href,
        bucketName: this.bucketName,
        key,
        contentType,
      });

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read', // Make file publicly accessible
      };

      console.log('[Storage] Starting upload...');
      const result = await this.s3.upload(uploadParams).promise();

      // Use CDN URL instead of the returned Location to avoid certificate issues
      const publicUrl = `${this.cdnUrl}/${key}`;

      console.log('[Storage] Upload successful:', {
        originalUrl: result.Location,
        publicUrl,
        key,
      });

      return {
        url: publicUrl,
        key: result.Key,
      };
    } catch (error) {
      console.error('[Storage] Upload failed:', error);
      console.error('[Storage] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        statusCode: (error as any)?.statusCode,
        hostname: (error as any)?.hostname,
      });
      throw new Error(
        `การอัพโหลดไฟล์ล้มเหลว: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete file from DigitalOcean Spaces
   */
  async deleteFile(key: string): Promise<void> {
    try {
      console.log('[Storage] Deleting file:', key);

      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();

      console.log('[Storage] Delete successful:', key);
    } catch (error) {
      console.error('[Storage] Delete failed:', error);
      throw new Error(
        `การลบไฟล์ล้มเหลว: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });

      return url;
    } catch (error) {
      console.error('[Storage] Get signed URL failed:', error);
      throw new Error(
        `การสร้าง URL ล้มเหลว: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Export singleton instance
export const storage = new DigitalOceanStorage();
