const os = require("os");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// Platform: darwin
// CPU: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz
// Total Memory: 17179869184
// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// Path module
// Joined path: /path/to/sample-files/folder/file.txt
console.log(
  "Joined path:",
  path.join("path/to/sample-files", "folder/file.txt")
);
// fs.promises API
// fs.promises read: Hello from fs.promises!
const filePath = path.join(__dirname, "./sample-files/demo.txt");
const content = "Hello from fs.promises!";
const readWriteFunction = async () => {
  try {
    await fsPromises.writeFile(filePath, content, "utf-8");
    const result = await fsPromises.readFile(filePath, "utf-8");
    console.log("fs.promises read:", result);
  } catch (error) {
    console.log("error", error);
  }
};

readWriteFunction();
// Streams for large files- log first 40 chars of each chunk
// Read chunk: This is a line in a large file...
// Finished reading large file with streams.
const largeFilePath = path.join(__dirname, "./sample-files/largefile.txt");
const contentLine = "This is a line in a large file...\n";
const readWriteLargeFileFunction = async () => {
  try {
    for (let i = 0; i < 100; i++) {
      await fsPromises.appendFile(largeFilePath, contentLine, "utf-8");
    }
    const readStream = fs.createReadStream(largeFilePath, {
      encoding: "utf-8",
      highWaterMark: 1024,
    });
    readStream.on("data", (chunk) => {
      console.log("Read chunk:\n", chunk);
    });

    readStream.on("end", () => {
      console.log("Finished reading large file with streams.");
    });
  } catch (error) {
    console.log("error", error);
  }
};
readWriteLargeFileFunction();
