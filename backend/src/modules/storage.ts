import { BadRequestException, Controller, Injectable, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface StorageDriver { put(key: string, body: Buffer, contentType: string): Promise<string> }

export class LocalStorage implements StorageDriver {
  constructor(private dir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'), private base = process.env.PUBLIC_URL || 'http://localhost:4000') {}
  async put(key: string, body: Buffer) {
    const path = join(this.dir, key);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, body);
    return `${this.base}/uploads/${key}`;
  }
}

/** Any S3-compatible store (AWS S3, Cloudflare R2, MinIO). */
export class S3Storage implements StorageDriver {
  private s3 = new S3Client({
    region: process.env.S3_REGION || 'auto', endpoint: process.env.S3_ENDPOINT, forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY || '', secretAccessKey: process.env.S3_SECRET_KEY || '' },
  });
  async put(key: string, body: Buffer, contentType: string) {
    await this.s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }
}

@Injectable()
export class StorageService {
  driver: StorageDriver = process.env.S3_BUCKET ? new S3Storage() : new LocalStorage();
}

@Controller('uploads')
export class UploadsController {
  constructor(private storage: StorageService) {}
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Thiếu tệp');
    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as any)[file.mimetype];
    if (!ext) throw new BadRequestException('Chỉ nhận ảnh JPG, PNG, WEBP');
    const url = await this.storage.driver.put(`covers/${randomUUID()}.${ext}`, file.buffer, file.mimetype);
    return { url };
  }
}
