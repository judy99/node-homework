const loggerHelper = (req, error = null) => {
  const now = new Date();
  const date = now.toLocaleDateString("en-US");
  const time = now.toLocaleTimeString("en-US");
  const timestamp = `${date}, ${time}`;
  const { method, path, requestId } = req;
  if (!error) {
    console.log(`[${timestamp}]: ${method} ${path} (${requestId})`);
  } else {
    const errorMessage = `${error.name} - ${error.message} (Request ID: ${req.requestId})`;
    if (error.statusCode == 400 || error.statusCode == 404) {
      console.warn(`WARN: ${errorMessage})`);
    } else {
      console.error(`ERROR: ${errorMessage}`);
    }
  }
};

module.exports = loggerHelper;
