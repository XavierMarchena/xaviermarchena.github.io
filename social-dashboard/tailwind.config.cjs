const path = require("path");
module.exports = {
  content: [
    path.join(__dirname, "client/index.html"),
    path.join(__dirname, "client/src/**/*.{ts,tsx}"),
  ],
  theme: { extend: {} },
  plugins: [],
};