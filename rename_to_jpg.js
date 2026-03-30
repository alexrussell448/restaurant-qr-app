const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "public/menu");

fs.readdirSync(dir).forEach((file) => {
  if (file.endsWith(".jpeg")) {
    const newName = file.replace(".jpeg", ".jpg");
    fs.renameSync(
      path.join(dir, file),
      path.join(dir, newName)
    );
    console.log(`${file} → ${newName}`);
  }
});