import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create users first
  const user1 = await prisma.user.create({
    data: {
      username: 'john_doe',
      password: 'password123',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'jane_doe',
      password: 'password123',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: 'jack_doe',
      password: 'password123',
    },
  });

  // Create posts and comments referencing users
  await prisma.post.create({
    data: {
      title: 'First Post',
      perex: 'A short summary of the first post.',
      content: 'This is the content of the first post.',
      authorId: user1.id, // Connect by userId
      comments: {
        create: [
          {
            content: 'Great post!',
            score: 5,
            authorId: user2.id, // Comment by jane_doe (user2 created above)
          },
          {
            content: 'Thanks for sharing!',
            score: 3,
            authorId: user3.id, // Comment by jack_doe (user3 created above)
          },
        ],
      },
    },
  });

  await prisma.post.create({
    data: {
      title: 'Second Post',
      perex: 'A short summary of the second post.',
      content: 'This is the content of the second post.',
      authorId: user1.id, // Connect by userId (user1)
      comments: {
        create: [
          {
            content: 'Interesting read!',
            score: 2,
            authorId: user2.id, // Comment by jane_doe (user2)
          },
        ],
      },
    },
  });

  await prisma.post.create({
    data: {
      title: 'Only Post by Jane',
      perex: "A short summary of Jane's post.",
      content: "This is Jane's single post.",
      authorId: user2.id, // Post by jane_doe (user2)
      comments: {
        create: [
          {
            content: 'Nice post, Jane!',
            score: 4,
            authorId: user1.id, // Comment by john_doe (user1)
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    throw new Error('Seeding failed');
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
