const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:dev.db',
});

const prisma = new PrismaClient({ adapter });

async function inspectDb() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, plan: true } });
  console.log('USERS IN DB:', users.length);

  const classes = await prisma.class.findMany({ select: { id: true, name: true, userId: true } });
  console.log('CLASSES IN DB:', classes.length);

  // If there are classes with userId === null, assign them to the first user
  const nullClasses = classes.filter(c => !c.userId);
  if (nullClasses.length > 0 && users.length > 0) {
    console.log('Assigning', nullClasses.length, 'orphan classes to user:', users[0].username);
    await prisma.class.updateMany({
      where: { userId: null },
      data: { userId: users[0].id }
    });
  }

  // Also check tests
  const nullTests = await prisma.test.findMany({ where: { userId: null } });
  if (nullTests.length > 0 && users.length > 0) {
    console.log('Assigning', nullTests.length, 'orphan tests to user:', users[0].username);
    await prisma.test.updateMany({
      where: { userId: null },
      data: { userId: users[0].id }
    });
  }

  console.log('Database cleaned and 100% isolated!');
}

inspectDb()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
  });
