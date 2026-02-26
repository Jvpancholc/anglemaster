import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export function getS3Client() {
    return new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });
}

export async function uploadImageToS3(buffer: Buffer, fileName: string, contentType: string = "image/png"): Promise<string> {
    const s3Client = getS3Client();
    const bucket = process.env.AWS_BUCKET_NAME!;

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: `creatives/${fileName}`,
        Body: buffer,
        ContentType: contentType,
        // Asume que el bucket S3 tiene una Bucket Policy que permite publica lectura si no usa URLs firmadas.
    });

    await s3Client.send(command);

    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/creatives/${fileName}`;
}

export async function deleteImageFromS3(fileUrl: string): Promise<boolean> {
    const s3Client = getS3Client();
    const bucket = process.env.AWS_BUCKET_NAME!;

    try {
        // Extract key from URL
        const urlObj = new URL(fileUrl);
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;

        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        await s3Client.send(command);
        return true;
    } catch (e) {
        console.error("Failed to delete image from S3:", e);
        return false;
    }
}
