'use server';
import { pages } from '@/components/pages';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const countItems = async (type: string, id: string | undefined) => {
  let done;
  if (id) {
    done = await prisma.item_user.count({
      where: {
        userId: id,
        done: true,
        item: { type },
      },
    });
  } else {
    done = 0;
  }
  const allWithoutDlc = await prisma.item.count({
    where: { type, inDlc: false },
  });
  const all = await prisma.item.count({
    where: { type },
  });

  return { name: type, done, allWithoutDlc, all };
};

export const useCounter = async () => {
  const session = await auth();
  const id = session?.user?.id;

  const data = [];

  let bossesDone;
  if (id) {
    bossesDone = await prisma.boss_user.count({
      where: { userId: id, done: true },
    });
  } else {
    bossesDone = 0;
  }
  const bossesAllWithoutDlc = await prisma.boss.count({
    where: { inDlc: false },
  });
  const bossesAll = await prisma.boss.count();
  data.push({ name: 'boss', done: bossesDone, allWithoutDlc: bossesAllWithoutDlc, all: bossesAll });

  let armors;
  if (id) {
    const userArmors = await prisma.armorSet_user.findMany({
      where: { userId: id },
      include: {
        armorSet: {
          include: {
            elements: {
              include: {
                item_user: {
                  where: { userId: id },
                  select: {
                    done: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    armors = userArmors.map((armor) => ({
      ...armor.armorSet,
      elements: armor.armorSet.elements.map((element) => {
        const { item_user, ...rest } = element;
        return {
          ...rest,
          done: item_user[0].done,
        };
      }),
    }));
  }
  const armorsDone = armors?.filter((armor) => armor.elements.every((element) => element.done)).length || 0;
  const armorsAllWithoutDlc = await prisma.armorSet.count({
    where: { inDlc: false },
  });
  const armorsAll = await prisma.armorSet.count();
  data.push({ name: 'armor', done: armorsDone, allWithoutDlc: armorsAllWithoutDlc, all: armorsAll });

  for (const page of pages) {
    if (page.type === 'page') continue;
    data.push(await countItems(page.path.slice(1), id));
  }

  return data;
};

export type TUseCounter = Awaited<ReturnType<typeof useCounter>>;
