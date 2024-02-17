import { Rectangle } from 'electron';
import { prisma } from './prisma';

export const getConfig = async (): Promise<Config> => {
  try {
    const ret = await prisma.config.findMany();

    return ret.reduce((acc, cur) => {
      acc[cur.key] = JSON.parse(cur.value);
      return acc;
    }, {} as any);
  } catch (err) {
    return Promise.reject({ msg: 'Config not found' });
  }
};

export const setConfig = async <T>(key: string, value: T) => {
  try {
    await prisma.config.upsert({
      where: {
        key,
      },
      update: {
        value: JSON.stringify(value),
      },
      create: {
        key,
        value: JSON.stringify(value),
      },
    });

    return true;
  } catch (err) {
    return Promise.reject({ msg: 'Não foi possível trazer relação' });
  }
};

export const deleteConfig = async (id: string) => {
  return setConfig(id, null);
};

export type Config = {
  background: {
    id: string;
    url: string;
    page: number;
  };
  window: Rectangle;
  internet: {
    session: string;
  };
};
