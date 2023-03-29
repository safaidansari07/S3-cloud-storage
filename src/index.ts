// @ts-nocheck
export interface Env {}

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Router } from "worktop";
import { listen } from "worktop/cache";

const bucketName = "multer0786";
const region = "ap-south-1";

const s3 = new S3Client({
  region: region,
  credentials: {
    accessKeyId: "AKIATQB42VFIKBG4VGSO",
    secretAccessKey: "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",
  },
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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
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
          JSON.stringify({ message: "Failed to upload files ", error: error })
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

api.add("POST", "/uploadToDrive", async (req, res) => {
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

    try {
      const myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        "Bearer ya29.a0Ael9sCPTfrvQoRyjr9OpFoYW8akFi5uf5h5S-oUgJMDutI1k9ptZmuiJNSY4nGYLRN9U1UtBQF6xazpT-zJ_bmprNRnuKoVhTj_NdOWdIv7_F5iCZSDCqm8D4scMufCxe0zPDRzkOaBRBA-tBgtyUu-iMraWaCgYKAYISARMSFQF4udJh21ADW9DhikV7Sa8FmP9Kpw0163"
      );

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: file,
        redirect: "follow",
      };

      fetch("https://www.googleapis.com/upload/drive/v3/files", requestOptions)
        .then(async (response) => await response.json())
        .then((result) => {
          return new Response(result);
        })
        .catch((error) => {
          return new Response(
            JSON.stringify({ message: "failed to upload files ", error: error })
          );
        });
    } catch (error) {
      return new Response(
        JSON.stringify({ message: "Something went wrong", error })
      );
    }
  }
});

listen(api.run);

async function sha1(file) {
  const fileData = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-1", fileData);
  const array = Array.from(new Uint8Array(digest));
  const sha1 = array.map((b) => b.toString(16).padStart(2, "0")).join("");
  return sha1;
}
