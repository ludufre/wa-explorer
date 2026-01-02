import { BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as plist from 'plist';
import IBackup from '../interfaces/backup.interface';
import bplist from 'bplist-parser';
import BetterSqlite3 from 'better-sqlite3';
import { ISession } from '../interfaces/session.interface';
import { IManifestFile } from '../interfaces/apple-manifest.interface';
import { parse } from 'date-fns';

class LoadController {
  async load() {
    // const dirs: string[] = dialog.showOpenDialogSync(BrowserWindow.fromWebContents (res.sender), {
    //   properties: ['openDirectory', 'showHiddenFiles']
    // });
    // console.log(dirs);
    // return;

    let itunes: IBackup[] = [];

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
  }

  choose(dbFile: string, base: string) {
    console.log(path.join(base, dbFile));
    console.log(path.join(base, 'Manifest.db'));

    if (
      !fs.existsSync(path.join(base, dbFile)) ||
      !fs.existsSync(path.join(base, 'Manifest.db'))
    ) {
      console.log(dbFile);
      console.log(path.join(base, 'Manifest.db'));
      return { ok: 0, msg: 'PAGES.PICKUP.NOT_FOUND' };
    }

    const db = BetterSqlite3(path.join(base, dbFile), {
      readonly: true,
    });

    const db2 = BetterSqlite3(path.join(base, 'Manifest.db'), {
      readonly: true,
    });

    const chats: ISession[] = db
      .prepare(
        "SELECT * FROM ZWACHATSESSION WHERE ZCONTACTJID NOT LIKE '%@status'",
      )
      .all() as ISession[];

    const profiles: IManifestFile[] = db2
      .prepare(
        'SELECT fileID, relativePath FROM Files WHERE flags = 1 AND domain = ? AND relativePath LIKE ?',
      )
      .all(
        'AppDomainGroup-group.net.whatsapp.WhatsApp.shared',
        'Media/Profile/%',
      ) as IManifestFile[];

    const pictureFind = db
      .prepare('SELECT * FROM ZWAPROFILEPICTUREITEM')
      .all() as { ZJID: string; ZPATH: string }[];

    let pictureFile = pictureFind.map((o: { ZJID: string; ZPATH: string }) => ({
      user: o.ZJID,
      path: profiles.find(f => f.relativePath.startsWith(o.ZPATH))?.fileID,
    })) as { user: string; path: string }[];

    pictureFile = pictureFile.filter(o => !!o.path);

    db.close();
    db2.close();

    const translatePicture = (p?: { user: string; path: string }) => {
      if (!!!p) return null;

      const file = path.join(base, p.path.substr(0, 2), p.path);

      if (!fs.existsSync(file)) {
        return null;
      }

      return `local-file://${file}`;
    };

    return {
      ok: 1,
      data: chats
        .filter(o => !o.ZCONTACTJID.endsWith('@status'))
        .map(o => ({
          id: o.Z_PK,
          contact: o.ZCONTACTJID,
          name: o.ZPARTNERNAME,
          last: o.ZLASTMESSAGEDATE,
          picture: translatePicture(
            pictureFile.find(f => f.user === o.ZCONTACTJID),
          ),
        })),
    };
  }

  async pickup(event: Electron.IpcMainInvokeEvent) {
    const paths: string[] | undefined = dialog.showOpenDialogSync(
      BrowserWindow.fromWebContents(event.sender)!,
      {
        title: 'Backup location',
        properties: ['openDirectory'],
        message: 'Can be an iTunes Backup or Android WhatsApp dump',
      },
    );
    if (!paths || paths.length === 0) {
      return { ok: 0, msg: null };
    }
    const path = paths[0];

    console.log(path);
    const found = await this.handleIos(path);

    if (!!!found?.chatStorage) {
      return { ok: 0, msg: found.error };
    }

    return { ok: 1, path, db: found.chatStorage };
  }

  private async handleIos(backupDir: string): Promise<IBackup> {
    const url = path.join(backupDir, 'Info.plist');
    if (!fs.existsSync(url)) {
      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_BACKUP',
        errorDetail: `PAGES.PICKUP.FILE_NOT_FOUND: ${url}`,
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
        errorDetail: (err as any).message,
      };
    }

    if (!!!parsedInfo) {
      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_INFO',
        errorDetail: 'PAGES.PICKUP.CANT_PARSE_INFO',
      };
    }

    let query: IManifestFile;
    try {
      const db = BetterSqlite3(path.join(backupDir, 'Manifest.db'), {
        readonly: true,
      });

      query = db
        .prepare('SELECT * FROM Files WHERE relativePath = ? AND domain = ?')
        .get(
          'ChatStorage.sqlite',
          'AppDomainGroup-group.net.whatsapp.WhatsApp.shared',
        ) as IManifestFile;

      db.close();

      // const manifest = await db.model('Files', {
      //   fileID: String,
      //   domain: String,¨
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
      console.error(err);

      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_MANIFEST',
        errorDetail: (err as any).message,
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
      chatStorage: !!query
        ? path.join(query.fileID.substring(0, 2), query.fileID)
        : undefined,
    };
  }
}

export default LoadController;
