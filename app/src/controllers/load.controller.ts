import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as plist from 'plist';
import * as funcs from '../utils/funcs';
import moment from 'moment';
import { connect } from 'trilogy'
import IBackup from '../interfaces/backup.interface';

class LoadController {
  constructor() {

    // Get backup list
    ipcMain.handle(
      'load',
      async (res, args) => {
        let backupDir = '';
        if (process.platform === "darwin") {
          backupDir = path.join(os.homedir(), `Library/Application Support/MobileSync/Backup`);
        }

        if (backupDir === '') {
          return { ok: false, msg: `Can't determine path directory.` };
        }

        const list = fs.readdirSync(backupDir);
        const out: IBackup[] = [];

        await funcs.asyncForEach(list, async (dir: string) => {
          if (fs.existsSync(path.join(backupDir, dir, 'Info.plist'))) {
            const content = fs.readFileSync(path.join(backupDir, dir, 'Info.plist'), 'utf8');
            const parsedInfo = plist.parse(content) as any;

            const db = connect(path.join(backupDir, dir, 'Manifest.db'), {
              client: 'sql.js'
            });

            const manifest = await db.model('Files', {
              fileID: String,
              domain: String,
              relativePath: String,
              flags: Number,
              file: String
            });

            const query = await manifest.findOne({
              relativePath: 'ChatStorage.sqlite',
              domain: 'AppDomainGroup-group.net.whatsapp.WhatsApp.shared'
            }) as IManifestFile;

            db.close();

            if (!!query) {
              out.push({
                id: parsedInfo['Unique Identifier'],
                device: parsedInfo['Product Name'],
                name: parsedInfo['Display Name'],
                gsm: parsedInfo['Phone Number'],
                serial: parsedInfo['Serial Number'],
                version: parsedInfo['Product Version'],
                path: path.join(backupDir, dir),
                date: moment(parsedInfo['Last Backup Date']).toDate(),
                chatStorage: path.join(query.fileID.substring(0, 2), query.fileID)
              })
            }
          }
        });

        return { ok: true, list: out };
      }
    );

    ipcMain.handle(
      'choose',
      async (res, dbFile, base) => {

        if (!fs.existsSync(path.join(base, dbFile)) || !fs.existsSync(path.join(base, 'Manifest.db'))) {
          console.log(dbFile);
          console.log(path.join(base, 'Manifest.db'));
          return { ok: 0, msg: 'Not found' }
        }

        const db = connect(path.join(base, dbFile), {
          client: 'sql.js'
        });

        const db2 = connect(path.join(base, 'Manifest.db'), {
          client: 'sql.js'
        });

        const sessionModel = await db.model('ZWACHATSESSION', {
          Z_PK: Number,
          Z_ENT: Number,
          Z_OPT: Number,
          ZARCHIVED: Number,
          ZCONTACTABID: Number,
          ZFLAGS: Number,
          ZHIDDEN: Number,
          ZIDENTITYVERIFICATIONEPOCH: Number,
          ZIDENTITYVERIFICATIONSTATE: Number,
          ZMESSAGECOUNTER: Number,
          ZREMOVED: Number,
          ZSESSIONTYPE: Number,
          ZSPOTLIGHTSTATUS: Number,
          ZUNREADCOUNT: Number,
          ZGROUPINFO: Number,
          ZLASTMESSAGE: Number,
          ZPROPERTIES: Number,
          ZLASTMESSAGEDATE: Date,
          ZLOCATIONSHARINGENDDATE: Date,
          ZCONTACTIDENTIFIER: String,
          ZCONTACTJID: String,
          ZETAG: String,
          ZLASTMESSAGETEXT: String,
          ZPARTNERNAME: String,
          ZSAVEDINPUT: String
        });

        const manifestModel = await db2.model('Files', {
          fileID: String,
          domain: String,
          relativePath: String,
          flags: Number,
          file: String
        });

        const pictureModel = await db.model('ZWAPROFILEPICTUREITEM', {
          Z_PK: Number,
          Z_ENT: Number,
          Z_OPT: Number,
          ZREQUESTDATE: Date,
          ZJID: String,
          ZPATH: String,
          ZPICTUREID: String
        });

        const sessionFind: ISession[] = await sessionModel.find({}) as any;

        const manifestFind = await manifestModel.find({
          flags: 1,
          domain: 'AppDomainGroup-group.net.whatsapp.WhatsApp.shared'
        }) as IManifestFile[];

        console.log(manifestFind.length);

        const profilePictures = manifestFind.filter(o => o.relativePath.startsWith('Media/Profile/')).map(o => ({
          id: o.fileID,
          file: o.relativePath
        }));

        const pictureFind = await pictureModel.find({}) as any;

        let pictureFile = pictureFind.map(o => ({
          user: o.ZJID,
          path: profilePictures.find(f => f.file.startsWith(o.ZPATH))?.id
        })) as { user: string; path: string; }[]

        pictureFile = pictureFile.filter(o => !!o.path);

        db.close();

        const translatePicture = (p: { user: string; path: string; }) => {
          if (!!!p) return null;

          const file = path.join(base, p.path.substr(0, 2), p.path)

          if (!fs.existsSync(file)) {
            return null;
          }

          return 'data:image/jpg;base64,' + fs.readFileSync(file, 'base64');
        }

        return {
          ok: 1, data: sessionFind.filter(o => !o.ZCONTACTJID.endsWith('@status')).map(o => ({
            id: o.Z_PK,
            contact: o.ZCONTACTJID,
            name: o.ZPARTNERNAME,
            last: o.ZLASTMESSAGEDATE,
            picture: translatePicture(pictureFile.find(f => f.user === o.ZCONTACTJID))
          }))
        };

      }
    );
  }

}

export default LoadController;

export interface IManifestFile {
  fileID: string;
  domain: string;
  relativePath: string;
  flags: number;
  file: Blob;
}

export interface ISession {
  Z_PK: number;
  Z_ENT: number;
  Z_OPT: number;
  ZARCHIVED: number;
  ZCONTACTABID: number;
  ZFLAGS: number;
  ZHIDDEN: number;
  ZIDENTITYVERIFICATIONEPOCH: number;
  ZIDENTITYVERIFICATIONSTATE: number;
  ZMESSAGECOUNTER: number;
  ZREMOVED: number;
  ZSESSIONTYPE: number;
  ZSPOTLIGHTSTATUS: number;
  ZUNREADCOUNT: number;
  ZGROUPINFO: number;
  ZLASTMESSAGE: number;
  ZPROPERTIES: number;
  ZLASTMESSAGEDATE: Date;
  ZLOCATIONSHARINGENDDATE: Date;
  ZCONTACTIDENTIFIER: string;
  ZCONTACTJID: string;
  ZETAG: string;
  ZLASTMESSAGETEXT: string;
  ZPARTNERNAME: string;
  ZSAVEDINPUT: string
}
