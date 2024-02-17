import log from 'electron-log';
import { PrismaClient } from '../../generated/client';
import { dbUrl, mePath, qePath, Migration, dbPath } from './constants';
import { fork } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

log.info('DB URL', dbUrl);
log.info('QE Path', qePath);

const appPath = process.env.APP_PATH || app.getAppPath();

export const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  // @ts-expect-error internal prop
  __internal: {
    engine: {
      binaryPath: qePath,
    },
  },
});

export async function applyPrismaMigrations() {
  let needsMigration;
  const dbExists = fs.existsSync(dbPath);
  if (!dbExists) {
    needsMigration = true;
    fs.closeSync(fs.openSync(dbPath, 'w'));
  } else {
    try {
      const latest: Migration[] =
        await prisma.$queryRaw`select * from _prisma_migrations order by finished_at`;
      needsMigration = latest[latest.length - 1]?.migration_name !== '';
    } catch (e) {
      log.error(e);
      needsMigration = true;
    }
  }

  if (needsMigration) {
    try {
      const schemaPath = path.join(
        appPath.replace('app.asar', 'app.asar.unpacked'),
        'prisma',
        'schema.prisma',
      );
      log.info(
        `Needs a migration. Running prisma migrate with schema path ${schemaPath}`,
      );

      // first create or migrate the database! If you were deploying prisma to a cloud service, this migrate deploy
      // command you would run as part of your CI/CD deployment. Since this is an electron app, it just needs
      // to run every time the production app is started. That way if the user updates the app and the schema has
      // changed, it will transparently migrate their DB.
      await runPrismaCommand({
        command: ['migrate', 'deploy', '--schema', schemaPath],
        dbUrl,
      });
      log.info('Migration done.');

      // seed
      // log.info("Seeding...");
      // await seed(prisma);
    } catch (e) {
      log.error(e);
      process.exit(1);
    }
  } else {
    log.info('Does not need migration');
  }
}

async function runPrismaCommand({
  command,
  dbUrl,
}: {
  command: string[];
  dbUrl: string;
}): Promise<number> {
  log.info('Migration engine path', mePath);
  log.info('Query engine path', qePath);

  // Currently we don't have any direct method to invoke prisma migration programatically.
  // As a workaround, we spawn migration script as a child process and wait for its completion.
  // Please also refer to the following GitHub issue: https://github.com/prisma/prisma/issues/4703
  try {
    const exitCode = await new Promise((resolve, _) => {
      const prismaPath = path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'node_modules/prisma/build/index.js',
      );
      log.info('Prisma path', prismaPath);

      const child = fork(prismaPath, command, {
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
          PRISMA_SCHEMA_ENGINE_BINARY: mePath,
          PRISMA_QUERY_ENGINE_LIBRARY: qePath,

          // Prisma apparently needs a valid path for the format and introspection binaries, even though
          // we don't use them. So we just point them to the query engine binary. Otherwise, we get
          // prisma:  Error: ENOTDIR: not a directory, unlink '/some/path/electron-prisma-trpc-example/packed/mac-arm64/ElectronPrismaTrpcExample.app/Contents/Resources/app.asar/node_modules/@prisma/engines/prisma-fmt-darwin-arm64'
          PRISMA_FMT_BINARY: qePath,
          PRISMA_INTROSPECTION_ENGINE_BINARY: qePath,
        },
        stdio: 'pipe',
      });

      child.on('message', msg => {
        log.info(msg);
      });

      child.on('error', err => {
        log.error('Child process got error:', err);
      });

      child.on('close', (code, _signal) => {
        resolve(code);
      });

      child.stdout?.on('data', function (data) {
        log.info('prisma: ', data.toString());
      });

      child.stderr?.on('data', function (data) {
        log.error('prisma: ', data.toString());
      });
    });

    if (exitCode !== 0)
      throw Error(`command ${command} failed with exit code ${exitCode}`);

    return exitCode;
  } catch (e) {
    log.error(e);
    throw e;
  }
}
