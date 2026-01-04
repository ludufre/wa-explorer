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
import { IMessage } from '../interfaces/message.interface';

interface DatabaseCache {
  chatStorageDb: BetterSqlite3.Database;
  manifestDb: BetterSqlite3.Database;
  mediaItems: Map<number, any>;
  manifestFiles: IManifestFile[];
}

class LoadController {
  private dbCache: Map<string, DatabaseCache> = new Map();

  private getOrCreateCache(dbFile: string, base: string): DatabaseCache | null {
    const cacheKey = dbFile;

    if (this.dbCache.has(cacheKey)) {
      return this.dbCache.get(cacheKey)!;
    }

    const chatStoragePath = dbFile;
    const manifestPath = path.join(base, 'Manifest.db');

    if (!fs.existsSync(chatStoragePath) || !fs.existsSync(manifestPath)) {
      return null;
    }

    console.log('📂 Opening database connections for cache:', cacheKey);

    const chatStorageDb = BetterSqlite3(chatStoragePath, { readonly: true });
    const manifestDb = BetterSqlite3(manifestPath, { readonly: true });

    // Pre-load all media items and manifest files
    const mediaItemsArray = chatStorageDb
      .prepare('SELECT * FROM ZWAMEDIAITEM')
      .all() as any[];

    const mediaItems = new Map<number, any>();
    mediaItemsArray.forEach(item => {
      mediaItems.set(item.Z_PK, item);
    });

    const manifestFiles = manifestDb
      .prepare(
        'SELECT fileID, relativePath FROM Files WHERE flags = 1 AND domain = ?',
      )
      .all(
        'AppDomainGroup-group.net.whatsapp.WhatsApp.shared',
      ) as IManifestFile[];

    const cache: DatabaseCache = {
      chatStorageDb,
      manifestDb,
      mediaItems,
      manifestFiles,
    };

    this.dbCache.set(cacheKey, cache);
    console.log(
      `✅ Cache created with ${mediaItems.size} media items and ${manifestFiles.length} manifest files`,
    );

    return cache;
  }

  closeCache(dbFile: string, base: string): void {
    const cacheKey = `${base}:${dbFile}`;
    const cache = this.dbCache.get(cacheKey);

    if (cache) {
      console.log('🔒 Closing database connections for:', cacheKey);
      cache.chatStorageDb.close();
      cache.manifestDb.close();
      this.dbCache.delete(cacheKey);
    }
  }

  closeAllCaches(): void {
    console.log('🔒 Closing all database connections');
    this.dbCache.forEach(cache => {
      cache.chatStorageDb.close();
      cache.manifestDb.close();
    });
    this.dbCache.clear();
  }

  async load() {
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
          const found = await this.handleIos(backupDir);
          if (!!!found?.chatStorage) {
            continue;
          }

          found.chatStorage = path.join(backupDir, found.chatStorage || '');
          itunes.push(found);
        }
      }
    }

    return { ok: true, itunes };
  }

  choose(dbFile: string, base: string) {
    console.log(dbFile);
    console.log(path.join(base, 'Manifest.db'));

    if (
      !fs.existsSync(dbFile) ||
      !fs.existsSync(path.join(base, 'Manifest.db'))
    ) {
      console.log(dbFile);
      console.log(path.join(base, 'Manifest.db'));
      return { ok: 0, msg: 'PAGES.PICKUP.NOT_FOUND' };
    }

    const db = BetterSqlite3(dbFile, {
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

  getMessages(dbFile: string, base: string, contactJid: string) {
    console.log('🔍 Getting messages for:', contactJid);
    console.log('📁 DB:', dbFile);

    if (!fs.existsSync(dbFile)) {
      console.error('❌ DB file not found');
      return { ok: 0, msg: 'PAGES.DETAIL.DB_NOT_FOUND' };
    }

    const db = BetterSqlite3(dbFile, {
      readonly: true,
    });

    // Get the chat session to find the Z_PK
    const session: ISession | undefined = db
      .prepare('SELECT * FROM ZWACHATSESSION WHERE ZCONTACTJID = ?')
      .get(contactJid) as ISession | undefined;

    console.log(
      '📱 Session found:',
      session ? `Yes (Z_PK: ${session.Z_PK})` : 'No',
    );

    if (!session) {
      db.close();
      console.error('❌ Session not found for contact:', contactJid);
      return { ok: 0, msg: 'PAGES.DETAIL.SESSION_NOT_FOUND' };
    }

    // Get messages for this chat session
    const messages: IMessage[] = db
      .prepare(
        `SELECT * FROM ZWAMESSAGE
         WHERE ZCHATSESSION = ?
         ORDER BY ZMESSAGEDATE ASC`,
      )
      .all(session.Z_PK) as IMessage[];

    console.log(`💬 Messages found: ${messages.length}`);

    db.close();

    return {
      ok: 1,
      data: messages.map(m => ({
        id: m.Z_PK,
        from: m.ZFROMJID,
        to: m.ZTOJID,
        text: m.ZTEXT,
        date: m.ZMESSAGEDATE,
        isFromMe: m.ZISFROMME === 1,
        type: m.ZMESSAGETYPE,
        groupMember: m.ZGROUPMEMBER,
        mediaItemId: m.ZMEDIAITEM || null,
      })),
      session: {
        contact: session.ZCONTACTJID,
        name: session.ZPARTNERNAME,
      },
    };
  }

  getMessagesPaginated(
    dbFile: string,
    base: string,
    contactJid: string,
    limit: number,
    offset: number,
  ) {
    // Validate parameters
    if (limit < 1 || limit > 500) limit = 100;
    if (offset < 0) offset = 0;

    console.log(
      `🔍 Getting paginated messages for: ${contactJid} (limit: ${limit}, offset: ${offset})`,
    );
    console.log('📁 DB:', dbFile);

    if (!fs.existsSync(dbFile)) {
      console.error('❌ DB file not found');
      return { ok: 0, msg: 'PAGES.DETAIL.DB_NOT_FOUND' };
    }

    const db = BetterSqlite3(dbFile, {
      readonly: true,
    });

    // Get the chat session to find the Z_PK
    const session: ISession | undefined = db
      .prepare('SELECT * FROM ZWACHATSESSION WHERE ZCONTACTJID = ?')
      .get(contactJid) as ISession | undefined;

    console.log(
      '📱 Session found:',
      session ? `Yes (Z_PK: ${session.Z_PK})` : 'No',
    );

    if (!session) {
      db.close();
      console.error('❌ Session not found for contact:', contactJid);
      return { ok: 0, msg: 'PAGES.DETAIL.SESSION_NOT_FOUND' };
    }

    // Get total count of messages
    const countResult: { count: number } = db
      .prepare('SELECT COUNT(*) as count FROM ZWAMESSAGE WHERE ZCHATSESSION = ?')
      .get(session.Z_PK) as { count: number };

    const total = countResult.count;
    console.log(`💬 Total messages: ${total}`);

    // Get paginated messages
    const messages: IMessage[] = db
      .prepare(
        `SELECT * FROM ZWAMESSAGE
         WHERE ZCHATSESSION = ?
         ORDER BY ZMESSAGEDATE ASC
         LIMIT ? OFFSET ?`,
      )
      .all(session.Z_PK, limit, offset) as IMessage[];

    console.log(`💬 Messages loaded: ${messages.length}`);

    db.close();

    // Para scroll reverso (carregando mensagens antigas), hasMore = true se offset > 0
    // Significa que ainda há mensagens anteriores (antes do offset atual)
    const hasMore = offset > 0;

    return {
      ok: 1,
      data: {
        messages: messages.map(m => ({
          id: m.Z_PK,
          from: m.ZFROMJID,
          to: m.ZTOJID,
          text: m.ZTEXT,
          date: m.ZMESSAGEDATE,
          isFromMe: m.ZISFROMME === 1,
          type: m.ZMESSAGETYPE,
          groupMember: m.ZGROUPMEMBER,
          mediaItemId: m.ZMEDIAITEM || null,
        })),
        total,
        hasMore,
        offset,
      },
      session: {
        contact: session.ZCONTACTJID,
        name: session.ZPARTNERNAME,
      },
    };
  }

  getMediaPath(dbFile: string, base: string, mediaItemId: number) {
    if (!mediaItemId) return { ok: 0, path: null };

    const cache = this.getOrCreateCache(dbFile, base);
    if (!cache) {
      console.error('❌ Could not create cache for:', dbFile, base);
      return { ok: 0, path: null };
    }

    const mediaItem = cache.mediaItems.get(mediaItemId);
    if (!mediaItem) {
      return { ok: 0, path: null };
    }

    const relativePath = mediaItem.ZMEDIALOCALPATH;
    if (!relativePath) {
      return { ok: 0, path: null };
    }

    const fileInfo = cache.manifestFiles.find(f =>
      f.relativePath.includes(relativePath),
    );

    if (!fileInfo) {
      return { ok: 0, path: null };
    }

    const filePath = path.join(
      base,
      fileInfo.fileID.substring(0, 2),
      fileInfo.fileID,
    );

    if (!fs.existsSync(filePath)) {
      return { ok: 0, path: null };
    }

    return { ok: 1, path: `local-file://${filePath}` };
  }

  private async handleIos(backupDir: string): Promise<IBackup> {
    const url = path.join(backupDir, 'Info.plist');
    if (!fs.existsSync(url)) {
      return {
        path: backupDir,
        error: 'PAGES.PICKUP.INVALID_BACKUP',
        errorDetail: url,
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
