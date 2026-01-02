export interface IManifestFile {
  fileID: string;
  domain: string;
  relativePath: string;
  flags: number;
  file: Blob;
}
