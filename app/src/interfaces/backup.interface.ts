
export default interface IBackup {
  id?: string;
  device?: string;
  name?: string;
  gsm?: string;
  serial?: string;
  version?: string;
  path: string;
  date?: Date;
  chatStorage?: string;
  error?: string;
  errorDetail?: string;
}
