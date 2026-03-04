import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed users
  await prisma.user.upsert({
    where: { email: "admin@iis.hr" },
    update: {},
    create: { email: "admin@iis.hr", password: "admin123", role: "full-access" },
  });

  await prisma.user.upsert({
    where: { email: "reader@iis.hr" },
    update: {},
    create: { email: "reader@iis.hr", password: "reader123", role: "read-only" },
  });

  // Seed categories
  const categories = [
    { name: "Electronics", slug: "electronics", description: "Electronic devices and gadgets" },
    { name: "Books", slug: "books", description: "Physical and digital books" },
    { name: "Clothing", slug: "clothing", description: "Apparel and fashion items" },
    { name: "Home & Garden", slug: "home-garden", description: "Home improvement and garden supplies" },
    { name: "Sports", slug: "sports", description: "Sports equipment and accessories" },
    { name: "Music", slug: "music", description: "Musical instruments and recordings" },
    { name: "Food & Beverages", slug: "food-beverages", description: "Food products and drinks" },
    { name: "Automotive", slug: "automotive", description: "Car parts and accessories" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
