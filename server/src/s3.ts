import AWS from 'aws-sdk';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function uploadToS3(localFilePath: string, userId: string): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('AWS_S3_BUCKET not set');
  const fileName = path.basename(localFilePath);
  const s3Key = `${userId}/${fileName}`;
  const fileContent = fs.readFileSync(localFilePath);
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'video/mp4',
    ACL: 'public-read',
  };
  await s3.upload(params).promise();
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}
