/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
}

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { Router } from "worktop";
import { listen } from "worktop/cache";
import { Stream } from "stream";
// import fs from "firebase-admin";
// const serviceAccount = "./firebase-credentials.json";
// fs.initializeApp({
//   credential: fs.credential.cert(serviceAccount),
//   storageBucket: "fir-10be7.appspot.com",
// });
// import { Stream } from "stream";
// import path from "path";
dotenv.config();
const bucketName = "multer0786";
const region = "ap-south-1";

const s3 = new S3Client({
  region: region,
  credentials: {
    accessKeyId: "AKIATQB42VFIKBG4VGSO",
    secretAccessKey: "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",
  },
});

// const KEYPATH = "./credentials.json";
// const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new GoogleAuth({
  keyFile: "./credentials.json",
  scopes: '"https://www.googleapis.com/auth/drive"',
});

// export default {
//   async fetch(
//     request: Request,
//     env: Env,
//     ctx: ExecutionContext
//   ): Promise<Response> {
//     const contentType = request.headers.get("content-type");
//     if (contentType.includes("form")) {
//       const formData = await request.formData();
//       const body = {};
//       for (const entry of formData.entries()) {
//         body[entry[0]] = entry[1];
//         console.log("Entries", entry);
//       }
//       console.log("body", body);

//       const file = body["file"];
//       console.log("file", file);

//       const hash = await sha1(file);
//       console.log("hash", hash);

//       const params = {
//         Bucket: bucketName,
//         Key: file.name,
//         Body: file,
//       };

//       try {
//         const command = new PutObjectCommand(params);
//         const response = await s3.send(command);

//         console.log("Response", response);
//       } catch (error) {
//         console.log(error);
//         return new Response(
//           JSON.stringify({ message: "Something went wrong", error: error })
//         );
//       }

//       return new Response(
//         JSON.stringify({
//           name: file.name,
//           type: file.type,
//           size: file.size,
//           hash,
//         })
//       );
//     } else return new Response("Hello World!");
//   },
// };

// async function sha1(file) {
//   const fileData = await file.arrayBuffer();
//   const digest = await crypto.subtle.digest("SHA-1", fileData);
//   const array = Array.from(new Uint8Array(digest));
//   const sha1 = array.map((b) => b.toString(16).padStart(2, "0")).join("");
//   return sha1;
// }

// @ts-nocheck
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

// import { Storage } from "@google-cloud/storage";

// const storage = new Storage({
//   keyFilename: "firebase-credentials.json",
// });

const api = new Router();

api.add("POST", "/uploadToS3", async (req, res) => {
  try {
    const body = req.body;

    const formData = await body.formData();
    const files = formData.getAll("files");
    console.log("files", files);

    const results = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            message: "File size exceeded maximum limit of 100MB",
            fileName: file.name,
          })
        );
      }
      const hash = await sha1(file);
      console.log("hash", hash);

      const params = {
        Bucket: bucketName,
        Key: file.name,
        Body: file,
      };

      try {
        const command = new PutObjectCommand(params);
        const response = await s3.send(command);
        results.push({
          name: file.name,
          type: file.type,
          size: file.size,
          hash,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ message: "Something went wrong", error: error })
        );
      }
    }

    return new Response(JSON.stringify(results));
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Something went wrong", error: error })
    );
  }
});

// import firebase from "firebase/app";
// import * as firebase from "firebase/app";

// import "firebase/storage";

// Initialize Firebase with your project's configuration

// const firebaseConfig = {
//   apiKey: "AIzaSyDO4GtPwtDYlmM-i7QSYgtm6zbXpKiUWU0",
//   authDomain: "fir-10be7.firebaseapp.com",
//   projectId: "fir-10be7",
//   storageBucket: "fir-10be7.appspot.com",
// };
// firebase.initializeApp(firebaseConfig);

// Initialize Firebase

// Get a reference to the storage service
// const storage = firebase.storage();
// Access the Firebase Storage service
// const storage = firebase.storage();
// const bucket = storage.ref().child("images");
// let bucket = "fir-10be7.appspot.com";

// const file = "credentials.json";
// api.add("GET", "/uploadToFirebase", async (req, res) => {
//   const body = req.body;
//   const formData = await body.formData();
//   const files = formData.getAll("files");

//   for (const file of files) {
//     const storageRef = storage.ref().child("images/" + file.name);
//     const uploadTask = storageRef.put(file);

//     // Wait for the upload to complete and log the result
//     const snapshot = await uploadTask;
//     console.log("Uploaded a file to Firebase Storage:", snapshot);
//   }

// uploadTask.on(
//   "state_changed",
//   (snapshot) => {
//     // Handle progress updates
//     const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//     console.log(`Upload progress: ${progress}%`);
//   },
//   (error) => {
//     // Handle upload errors
//     console.error("Upload failed:", error);
//     // res.send({ success: false, message: 'Upload failed' });
//   },
//   () => {
//     // Handle successful uploads
//     console.log("Upload completed");
//     //  res.send({ success: true, message: 'Upload completed' });
//   }
// );
// await storage.bucket(bucket).upload(file, {
//   gzip: true,

//   metadata: {
//     cacheControl: "public, max-age=31536000",
//   },
// });
// console.log("after storing the file");

// console.log(`${file} uploaded to ${bucket}.`);
// });

api.add("POST", "/uploadToDrive", async (req, res) => {
  // const token =
  //   "ya29.a0Ael9sCPBpAR7zM12ulQX7JcAcgAYisDnPkC4ecb9JTEsOFU3_ZjgFIOuJcUvkmANYs2SMGxlGsWwoKMLnDA07Q60UJ2HQkprOQBB7WnGS4MmTrtgXCFG7ycUBXAYW8WJnNvqimx6JdoWyLlXYIvGv73YwayYaCgYKAbASARMSFQF4udJhhzXDs1z0zVqWIdKxUDIp3Q0163";
  // const folderId = "1CbyzL3nye_kDzpT62-DJwx60ifLTTAdn";
  // const url =
  //   "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  try {
    const body = req.body;
    const formData = await body.formData();
    const files = formData.getAll("files");
    const results = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            message: "File size exceeded maximum limit of 100MB",
            fileName: file.name,
          })
        );
      }

      // const { data } = await google
      //   .drive({ version: "v3", auth });
      //   .files.create({
      //     media: {
      //       mimeType: file.mimeType,
      //       body: file,
      //     },
      //     requestBody: {
      //       name: file.name,
      //       parents: ["1CbyzL3nye_kDzpT62-DJwx60ifLTTAdn"],
      //     },
      //     fields: "id, name",
      //   });
      // console.log(`Uploaded File ${data.name} ${data.id}`);
      const service = google.drive({ version: "v3", auth });
      const requestBody = {
        name: file.name,
        fields: "id",
      };
      const media = {
        mimeType: file.type,
        body: file,
      };

      try {
        const file = await service.files.create({
          requestBody,
          media: media,
        });

        results.push({
          name: file.name,
          type: file.type,
          size: file.size,
          hash,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ message: "failed to upload files ", error: error })
        );
      }
      // await uploadFiles(file);
    }
    return new Response(JSON.stringify(results));
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Failed to upload files ", error: error })
    );
  }
});

// const uploadFiles = async (fileObject) => {
//   const bufferStream = new Stream.PassThrough();
//   bufferStream.end(fileObject.buffer);

//   const { data } = await google.drive({ version: "v3", auth }).files.create({
//     media: {
//       mimeType: fileObject.mimeType,
//       body: bufferStream,
//     },
//     requestBody: {
//       name: fileObject.originalname,
//       parents: ["1CbyzL3nye_kDzpT62-DJwx60ifLTTAdn"],
//     },
//     fields: "id, name",
//   });
//   console.log(`Uploaded File ${data.name} ${data.id}`);
// };

listen(api.run);

async function sha1(file) {
  const fileData = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-1", fileData);
  const array = Array.from(new Uint8Array(digest));
  const sha1 = array.map((b) => b.toString(16).padStart(2, "0")).join("");
  return sha1;
}
