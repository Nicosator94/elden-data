import { armors } from '../src/lib/defaultData/armor';
import { bosses } from '../src/lib/defaultData/bosses';
import { spells } from '../src/lib/defaultData/spell';
import { talismans } from '../src/lib/defaultData/talismans';
import { weapons } from '../src/lib/defaultData/weapon';
import prisma from '../src/lib/prisma';

async function main() {
  for (const boss of bosses) {
    await prisma.boss.upsert({
      where: {
        locationUrl: boss.locationUrl,
      },
      update: {
        ...boss,
      },
      create: {
        ...boss,
      },
    });
  }
  for (const talisman of talismans) {
    await prisma.item.upsert({
      where: {
        name: talisman.name,
      },
      update: {
        ...talisman,
      },
      create: {
        ...talisman,
      },
    });
  }
  for (const spell of spells) {
    await prisma.item.upsert({
      where: {
        name: spell.name,
      },
      update: {
        ...spell,
      },
      create: {
        ...spell,
      },
    });
  }
  for (const weapon of weapons) {
    await prisma.item.upsert({
      where: {
        name: weapon.name,
      },
      update: {
        ...weapon,
      },
      create: {
        ...weapon,
      },
    });
  }
  for (const armor of armors) {
    const elementsId = await Promise.all(
      armor.elements.map(async (element) => {
        const newItem = await prisma.item.upsert({
          where: {
            name: element.name,
          },
          update: {
            ...element,
          },
          create: {
            ...element,
          },
        });
        return newItem.id;
      })
    );
    await prisma.armorSet.upsert({
      where: {
        name: armor.name,
      },
      update: {
        ...armor,
        elements: {
          connect: elementsId.map((id) => ({ id })),
        },
      },
      create: {
        ...armor,
        elements: {
          connect: elementsId.map((id) => ({ id })),
        },
      },
    });
  }
}

main();
