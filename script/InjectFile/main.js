"use strict";

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bplistCreator = require('bplist-creator');
const crypto = require('crypto')
const shasum = crypto.createHash('sha1')

if (process.argv.length != 7) {
  console.log('Missing backup path, file path and INodeNumber');
  return 1;
}

const backupPath = process.argv[2];
const file = process.argv[3];
const appDomain = process.argv[4];
const relativePath = process.argv[5];
const inode = process.argv[6];
const fileID = shasum.update(appDomain + '-' + relativePath).digest('hex');
const destination = path.join(backupPath, fileID.substr(0, 2), fileID);

if (!fs.existsSync(path.join(backupPath, 'Manifest.db'))) {
  console.log('Not a valida backup path. Manifest.db not found.');
  return 1;
}

if (!fs.existsSync(file)) {
  console.log('Not a valida file path. File not found.');
  return 1;
}

if (!!!appDomain || !!!relativePath) {
  console.log('AppDomain or RelativePath invalid.');
  return 1;
}

if (isNaN(inode) || isNaN(parseFloat(inode))) {
  console.log('INodeNumber must be a number');
  return 1;
}

if (fs.existsSync(destination)) {
  console.log('Destinationm file already exists. ' + destination);
  return 1;
}
fs.copyFileSync(file, destination);

let db;
try {
  db = new sqlite3.Database(path.join(backupPath, 'Manifest.db'), sqlite3.OPEN_READWRITE);
} catch (err) {
  console.log('Can\'t open database file');
  return 1;
}

const info = fs.statSync(file);
const mtime = Math.floor(info.mtimeMs / 1000);

const bin = bplistCreator({
  '$version': 100000,
  '$objects': [
    '$null',
    relativePath,
    {
      '$classname': 'MBFile',
      '$classes': [
        'MBFile',
        'NSObject'
      ],
    },
    {
      '$class': {
        UID: 2
      },
      'UserID': 501,
      'Mode': 33188, // Folder: 78468
      'LastModified': mtime,
      'Size': info.size, // Folder: 0
      'InodeNumber': +inode,
      'LastStatusChange': mtime,
      'RelativePath': {
        UID: 1
      },
      'ProtectionClass': 3, // Folder: 0
      'Birth': mtime,
      'GroupID': 501
    }
  ],
  '$archiver': 'NSKeyedArchiver',
  '$top': {
    'root': {
      UID: 3
    }
  }
});

const hex = bin.toString('hex');

// console.log(hex);
// return 0;

db.run('INSERT INTO Files (fileID, domain, relativePath, flags, file) VALUES ($fileID, $domain, $relativePath, $flags, $file)', {
  $fileID: fileID,
  $domain: appDomain,
  $relativePath: relativePath,
  $flags: 1,
  $file: bin
}, (err, success) => {
  if (err) {
    console.log('Failed to insert file data.');
    return 1;
  }
  console.log('Sucesso!');
  return 0;
});
