import prisma from "./db.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Create Principal user if not exists
  const principalEmail = "principal@school.com";
  const existingPrincipal = await prisma.user.findUnique({
    where: { email: principalEmail },
  });

  if (!existingPrincipal) {
    const hashedPassword = await bcrypt.hash("principal123", 10);
    const principal = await prisma.user.create({
      data: {
        email: principalEmail,
        password: hashedPassword,
        name: "Principal Sarah Jenkins",
        role: "PRINCIPAL",
      },
    });
    console.log(`Created principal account: ${principal.email}`);
  } else {
    console.log("Principal account already exists.");
  }

  // Create standard teacher user if not exists
  const teacherEmail = "teacher@school.com";
  const existingTeacher = await prisma.user.findUnique({
    where: { email: teacherEmail },
  });

  if (!existingTeacher) {
    const hashedPassword = await bcrypt.hash("teacher123", 10);
    const teacherUser = await prisma.user.create({
      data: {
        email: teacherEmail,
        password: hashedPassword,
        name: "Mr. John Doe",
        role: "TEACHER",
        teacher: {
          create: {
            phone: "123-456-7890",
            subject: "Mathematics",
          },
        },
      },
    });
    console.log(`Created teacher account: ${teacherUser.email}`);
  } else {
    console.log("Teacher account already exists.");
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
