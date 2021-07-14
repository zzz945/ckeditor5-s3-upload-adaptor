// Load the required clients and packages
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity"
import  {
  fromCognitoIdentityPool,
} from "@aws-sdk/credential-provider-cognito-identity"
import { S3Client, PutObjectCommand, ListObjectsCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage";

let s3;
let bucketName;

export function initS3 ({ region, identityPoolId, bucketName: _bucketName }) {
  bucketName = _bucketName
  s3 = new S3Client({
    region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region }),
      identityPoolId
    }),
  });
}

export function addAsset (file, filePath) {
  const uploadParams = {
    Bucket: bucketName,
    Key: filePath,
    Body: file,
    ContentType: file.type
  };

  return s3.send(new PutObjectCommand(uploadParams))
};

export function addAssetMultipart (file, filePath, progressChange) {  
  const uploadParams = {
    Bucket: bucketName,
    Key: filePath,
    Body: file,
    ContentType: file.type
  };

  const parallelUpload = new Upload({
    client: s3,
    queueSize: 1, // optional concurrency configuration
    // partSize: 5MB, // optional size of each part    
    // leavePartsOnError: false, // optional manually handle dropped parts
    params: uploadParams,
  });

  parallelUpload.on("httpUploadProgress", progress => {
    if (progressChange) {
      progressChange(progress)
    }
  });

  return parallelUpload.done();
};