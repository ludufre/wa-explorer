import { BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as plist from 'plist';
import bplist from 'bplist-parser';
import { Backup } from '../interfaces/backup.interface';
import BetterSqlite3 from 'better-sqlite3';
import { Chat, ManifestFile } from '../interfaces/chat.interface';
import { addSeconds, formatISO9075 } from 'date-fns';

export default class LoadController {
  constructor() {
    // Get backup list
    ipcMain.handle('loadd', async (_res, _args) => {
      // const dirs: string[] = dialog.showOpenDialogSync(BrowserWindow.fromWebContents (res.sender), {
      //   properties: ['openDirectory', 'showHiddenFiles']
      // });
      // console.log(dirs);
      // return;

      const itunes: Backup[] = [];

      if (process.platform === 'darwin') {
        const backupsDir = path.join(
          os.homedir(),
          `Library/Application Support/MobileSync/Backup`,
        );

        if (fs.existsSync(backupsDir)) {
          let list = fs.readdirSync(backupsDir);

          list = list.filter(o => o !== '.DS_Store' && !o.startsWith('.'));

          for await (const dir of list) {
            const backupDir = path.join(backupsDir, dir);
            itunes.push(await this.handleIos(backupDir));
          }
        }
      }

      return { ok: true, itunes };
    });

    ipcMain.on('choose', async (event, dbFile, base) => {
      console.log('checkeeee', dbFile, base);

      console.log(path.join(base, dbFile));
      console.log(path.join(base, 'Manifest.db'));

      if (
        !fs.existsSync(path.join(base, dbFile)) ||
        !fs.existsSync(path.join(base, 'Manifest.db'))
      ) {
        console.log(dbFile);
        console.log(path.join(base, 'Manifest.db'));
        return { ok: 0, msg: 'Not found' };
      }

      const db = BetterSqlite3(path.join(base, dbFile), {
        readonly: true,
      });

      const db2 = BetterSqlite3(path.join(base, 'Manifest.db'), {
        readonly: true,
      });

      const chats = db
        .prepare(
          `
          SELECT
          A.Z_PK AS id,
          A.ZCONTACTJID AS contact,
          IFNULL(B.ZPUSHNAME, A.ZPARTNERNAME) AS name,
          C.ZPATH AS avatar,
          A.ZLASTMESSAGEDATE AS last_date,
          D.ZMESSAGETYPE AS last_type,
          D.ZTEXT AS last_text
          FROM
          ZWACHATSESSION AS A
          LEFT JOIN ZWAPROFILEPUSHNAME AS B ON (A.ZCONTACTJID = B.ZJID)
          LEFT JOIN ZWAPROFILEPICTUREITEM AS C ON (C.ZJID = A.ZCONTACTJID)
          LEFT JOIN (SELECT MAX(ZSORT), * FROM ZWAMESSAGE GROUP BY ZCHATSESSION) AS D ON (D.ZCHATSESSION = A.Z_PK)
          WHERE
          A.ZCONTACTJID NOT LIKE '%@status'
          `,
        )
        .all() as Chat[];

      const profiles = db2
        .prepare(
          'SELECT fileID, relativePath FROM Files WHERE flags = 1 AND domain = ? AND relativePath LIKE ?',
        )
        .all(
          'AppDomainGroup-group.net.whatsapp.WhatsApp.shared',
          'Media/Profile/%',
        ) as ManifestFile[];

      let pictureFile = chats
        .filter(f => !!f.avatar)
        .map(o => ({
          id: o.id,
          path: profiles.find(f => f.relativePath.startsWith(o.avatar))?.fileID,
        })) as { id: number; path: string }[];

      pictureFile = pictureFile.filter(o => !!o.path);

      db.close();
      db2.close();

      const translatePicture = (p: { id: number; path: string }) => {
        if (!!!p) return null;

        const file = path.join(base, p.path.substr(0, 2), p.path);

        if (!fs.existsSync(file)) {
          return null;
        }

        return `atom://${file}`;
      };

      event.reply('choosed', {
        ok: 1,
        data: chats.map(o => ({
          ...o,
          last_date: formatISO9075(
            addSeconds(new Date(2001, 0, 1), o.last_date),
          ),
          avatar: translatePicture(
            pictureFile.find(f => f.id === o.id) as (typeof pictureFile)[0],
          ),
        })),
      });
    });

    ipcMain.handle('pickup-dialog', async event => {
      const paths: string[] = dialog.showOpenDialogSync(
        BrowserWindow.fromWebContents(event.sender) as any,
        {
          title: 'Backup location',
          properties: ['openDirectory'],
          message: 'Can be an iTunes Backup or Android WhatsApp dump',
        },
      ) as string[];
      if (paths.length === 0) {
        return { ok: 0, msg: null };
      }
      const path = paths[0];

      console.log(path);
      const found = await this.handleIos(path);

      if (!!!found?.chatStorage) {
        return { ok: 0, msg: found.error };
      }

      return { ok: 1, path, db: found.chatStorage };
    });
  }

  async handleIos(backupDir: string): Promise<Backup> {
    const url = path.join(backupDir, 'Info.plist');
    if (!fs.existsSync(url)) {
      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_BACKUP',
        errorDetail: `Not found: ${url}`,
      };
    }

    const buffer = fs.readFileSync(url, 'binary');
    const header = buffer.slice(0, 'bplist'.length).toString();

    let parsedInfo: any;
    try {
      if (header === 'bplist') {
        parsedInfo = (await bplist.parseFile(url))[0];
        // console.log(parsedInfo[0]);
      } else {
        const content = fs.readFileSync(url, 'utf8');
        parsedInfo = plist.parse(content);
      }
    } catch (err) {
      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_INFO',
        errorDetail: (err as any)?.message || 'Unknown error',
      };
    }

    if (!!!parsedInfo) {
      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_INFO',
        errorDetail: `Can't parse Info.plist`,
      };
    }

    let query: ManifestFile;
    try {
      const db = BetterSqlite3(path.join(backupDir, 'Manifest.db'), {
        readonly: true,
      });

      query = db
        .prepare('SELECT * FROM Files WHERE relativePath = ? AND domain = ?')
        .get(
          'ChatStorage.sqlite',
          'AppDomainGroup-group.net.whatsapp.WhatsApp.shared',
        ) as ManifestFile;

      db.close();

      // const manifest = await db.model('Files', {
      //   fileID: String,
      //   domain: String,
      //   relativePath: String,
      //   flags: Number,
      //   file: String
      // });

      // query = await manifest.findOne({
      //   relativePath: 'ChatStorage.sqlite',
      //   domain: 'AppDomainGroup-group.net.whatsapp.WhatsApp.shared'
      // }) as IManifestFile;

      // db.close();
    } catch (err) {
      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_MANIFEST',
        errorDetail: (err as any)?.message || 'Unknown error',
      };
    }

    return {
      id: parsedInfo['Unique Identifier'],
      device: parsedInfo['Product Name'],
      name: parsedInfo['Display Name'],
      gsm: parsedInfo['Phone Number'],
      serial: parsedInfo['Serial Number'],
      version: parsedInfo['Product Version'],
      path: backupDir,
      date: parsedInfo['Last Backup Date'],
      chatStorage: (!!query
        ? path.join(query.fileID.substring(0, 2), query.fileID)
        : null) as any,
    };
  }
}
