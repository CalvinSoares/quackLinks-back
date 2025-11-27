import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import { CreateSignedUrlInput } from "./upload.schema";

export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME!;
    this.publicUrl = process.env.R2_PUBLIC_URL!;

    // A URL que você forneceu é o endpoint, mas SEM o nome do bucket no final
    const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async createSignedUrl(userId: string, input: CreateSignedUrlInput) {
    const { fileName, contentType, uploadType } = input;

    // Gerar um nome de arquivo único para evitar conflitos e organizar por usuário/tipo
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const uniqueFileName = `${userId}/${uploadType}/${randomSuffix}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueFileName,
      ContentType: contentType,
    });

    // A URL pré-assinada que o frontend usará para fazer o upload via PUT
    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300, // A URL expira em 5 minutos
    });

    // A URL pública final que será salva no banco de dados
    const finalFileUrl = `${this.publicUrl}/${uniqueFileName}`;

    return { signedUrl, finalFileUrl };
  }
}
