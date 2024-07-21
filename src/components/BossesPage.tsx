'use client';
import { resetBosses } from '@/app/actions/resetBosses';
import { toggleBossDone } from '@/app/actions/toggleBossDone';
import { modal } from '@/components/Modal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boss } from '@prisma/client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useBosses } from './hooks/useBosses';

const BossesTable: React.FC<{ bosses: Boss[] }> = ({ bosses }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bosses.map((boss) => (
          <TableRow key={boss.id}>
            <TableCell>{boss.name}</TableCell>
            <TableCell>{boss.location}</TableCell>
            <TableCell>
              <Checkbox
                defaultChecked={boss.done}
                onCheckedChange={() => {
                  toggleBossDone({ bossId: boss.id });
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const BossesPage: React.FC<{ data: Awaited<ReturnType<typeof useBosses>> }> = ({ data }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const filterBosses = Object.groupBy(
    data.bosses.filter((boss) => {
      if (searchParams.has('dlc') && searchParams.get('dlc') === 'false' && boss.inDlc) return false;
      if (searchParams.has('name') && !boss.name.includes(searchParams.get('name') as string)) return false;
      return true;
    }),
    (boss) => boss.location
  );

  return (
    <div className="flex flex-col gap-5 items-center">
      <p>{JSON.stringify(data.bossesByLocation)}</p>
      <h1 className="text-3xl font-bold">Bosses {data.bossesDone + '/' + data.bosses.length}</h1>
      <div className="flex gap-5 items-center">
        <div className="flex items-center gap-1">
          <p className="whitespace-nowrap">Show DLC</p>
          <Checkbox
            defaultChecked={searchParams.get('dlc') === 'true'}
            onCheckedChange={(checked) => {
              router.push(pathname + '?' + createQueryString('dlc', String(checked)));
            }}
          />
        </div>
        <Input
          placeholder="name"
          onChange={(e) => {
            router.push(pathname + '?' + createQueryString('name', e.target.value));
          }}
        />
        <Button
          variant={'destructive'}
          onClick={async (e) => {
            e.stopPropagation();
            const res = await modal.question({
              title: 'Reinitisaliser les données ?',
              message: 'Cette action est irreversible',
            });
            if (res) {
              resetBosses();
            }
          }}
        >
          Reset
        </Button>
      </div>
      {Object.entries(filterBosses).map(([location, b], index) => (
        <Accordion key={index} className="w-full" type="single" collapsible>
          <AccordionItem value={location}>
            <AccordionTrigger>{location}</AccordionTrigger>
            <AccordionContent>{b && <BossesTable bosses={b} />}</AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );
};

export default BossesPage;
