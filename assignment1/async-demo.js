const fs = require("fs");
const fsPromise = require("fs/promises");
const path = require("path");

const filePath = path.join(__dirname, "./sample-files/sample.txt");
const content = "Hello, async world!";
fs.writeFileSync(filePath, content, "utf-8");

// 1. Callback style
fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.log("Error while reading: ", err);
  } else {
    console.log("Callback read: ", data);
  }
});
// Callback hell example (test and leave it in comments):
// open file
// fs.open(filePath, (err, fileHandle) => {
//   if (err) {
//     console.log("File open failed: ", err.message);
//   } else {
//     console.log("File open succeeded.  The file handle is: ", fileHandle);
//     // read file
//     fs.readFile(fileHandle, "utf-8", (err, data) => {
//       if (err) {
//         console.log("Error while reading: ", err);
//       } else {
//         // log file info
//         console.log("Initial file: ", data);
//         // write to file
//         fs.appendFile(filePath, " Hello again!", (err) => {
//           if (err) {
//             console.log("Error while writing: ", err);
//           } else {
//             console.log("Successfully wrote data");
//             // read again
//             fs.readFile(filePath, "utf-8", (err, data) => {
//               if (err) {
//                 console.log("err while reading - 2: ", err);
//               }
//               // log file info after adding
//               console.log("Updated file: ", data);
//             });
//           }
//         });
//       }
//     });
//   }
// });

// 2. Promise style
const doFileOperations = async () => {
  try {
    fsPromise.readFile(filePath, "utf-8").then((data) => {
      console.log("Promise read: ", data);
    });
  } catch (err) {
    console.log("An error occurred.", err);
  }
};

doFileOperations();

// 3. Async/Await style
const doAsyncAwait = async () => {
  try {
    const filehandle = await fsPromise.readFile(filePath, "utf-8");
    console.log("Async/Await read: ", filehandle);
  } catch (err) {
    console.log("An error occurred.", err);
  }
};

doAsyncAwait();
