const fs = require("fs");
const path = require("path");

const menuDir = path.join(__dirname, "public", "menu");
const outputFile = path.join(__dirname, "lib", "menu.ts");

const categoryMap = {
  pizzas: [
    "the-original-roni",
    "the-classic-v",
    "the-angry-pig",
    "the-spicy-roni",
    "the-aloha",
    "the-italian-sausage",
    "the-goat-v",
  ],
  breads: [
    "garlic-butter-dough-balls",
    "nduja-butter-dough-balls",
    "cheese-and-tomato-garlic-bread-12-inch",
    "cheese-garlic-bread-12-inch",
    "tomato-garlic-bread-12-inch",
    "garlic-bread-12-inch",
    "nduja-garlic-bread-12-inch",
  ],
  sides: [
    "parmesan-and-truffle-fries",
    "mushroom-arancini-balls",
    "skinny-fries",
  ],
  friedChicken: [
    "buttermilk-w-house-ranch",
    "parm-and-truffle-w-garlic-aioli",
    "buffalo-w-franks-hot-sauce",
  ],
  dips: [
    "garlic-aioli",
    "house-ranch",
    "marinara",
    "basil-pesto",
    "house-chilli",
    "franks-hot-sauce",
  ],
  drinks: [
    "san-pellegrino-blood-orange",
    "fanta-lemon",
    "fizzy-vimto",
    "coca-cola",
    "irn-bru",
    "san-pellegrino-limonata",
    "fanta-orange",
    "still-water",
    "diet-coke",
    "sprite",
  ],
};

const prettyName = (slug) =>
  slug
    .split("-")
    .map((word) => {
      if (word === "v") return "(v)";
      if (word === "w") return "w/";
      if (word === "nduja") return "Nduja";
      if (word === "aioli") return "Aioli";
      if (word === "irn") return "Irn";
      if (word === "bru") return "Bru";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace("Irn Bru", "Irn-Bru")
    .replace("Coca Cola", "Coca Cola")
    .replace("Diet Coke", "Diet Coke")
    .replace("Fizzy Vimto", "Fizzy Vimto")
    .replace("San Pellegrino", "San Pellegrino")
    .replace("And", "&")
    .replace("12 Inch", '12"')
    .replace("Franks", "Frank's");

const files = fs
  .readdirSync(menuDir)
  .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

const items = files.map((file) => {
  const slug = file.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  const image = `/menu/${file}`;

  let category = "uncategorised";
  for (const [key, values] of Object.entries(categoryMap)) {
    if (values.includes(slug)) {
      category = key;
      break;
    }
  }

  return {
    slug,
    name: prettyName(slug),
    image,
    category,
  };
});

const categoryTitles = {
  pizzas: 'The Pizza 12"',
  breads: "The Breads",
  sides: "The Sides",
  friedChicken: "Fratelli Fried Chicken",
  dips: "The Dips",
  drinks: "The Drinks",
  uncategorised: "Uncategorised",
};

const grouped = {};
for (const item of items) {
  if (!grouped[item.category]) grouped[item.category] = [];
  grouped[item.category].push(item);
}

const menuTs = `export const menu = ${JSON.stringify(
  Object.entries(grouped).map(([category, items]) => ({
    category,
    title: categoryTitles[category] || category,
    items,
  })),
  null,
  2
)} as const;
`;

fs.writeFileSync(outputFile, menuTs, "utf8");
console.log(`Generated ${outputFile}`);