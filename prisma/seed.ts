import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const masterHash = await bcrypt.hash("demo-master-123", 10);
  const childHash = await bcrypt.hash("demo-child-123", 10);

  const master = await prisma.user.upsert({
    where: { email: "master@demo.local" },
    update: { passwordHash: masterHash },
    create: {
      email: "master@demo.local",
      passwordHash: masterHash,
      role: Role.MASTER,
    },
  });

  await prisma.user.upsert({
    where: { email: "child@demo.local" },
    update: { passwordHash: childHash, parentId: master.id },
    create: {
      email: "child@demo.local",
      passwordHash: childHash,
      role: Role.USER,
      parentId: master.id,
    },
  });

  console.log("Seed OK: master@demo.local / demo-master-123");
  console.log("         child@demo.local / demo-child-123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
