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
const fileID = shasum.update(appDomain + '-' + (relativePath === 'NULL' ? '' : relativePath)).digest('hex');
const destination = path.join(backupPath, fileID.substr(0, 2), fileID);

if (!fs.existsSync(path.join(backupPath, 'Manifest.db'))) {
  console.log('Not a valid backup path. Manifest.db not found.');
  return 1;
}

if (!fs.existsSync(file) && file !== 'folder') {
  console.log('Not a valid file path. File not found.');
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

if (file !== 'folder') {
  fs.copyFileSync(file, destination);
}

let db;
try {
  db = new sqlite3.Database(path.join(backupPath, 'Manifest.db'), sqlite3.OPEN_READWRITE);
} catch (err) {
  console.log('Can\'t open database file');
  return 1;
}

let bin;
if (file === 'folder') {
  const mtime = Math.round(Date.now() / 1000);

  bin = bplistCreator({
    '$version': 100000,
    '$objects': [
      '$null',
      {
        '$class': {
          UID: 3
        },
        'LastModified': mtime,
        'Flags': 0,
        'GroupID': 501,
        'LastStatusChange': mtime,
        'Birth': mtime,
        'Size': 0,
        'InodeNumber': +inode,
        'Mode': 16877, // talves: 78468,
        'UserID': 501,
        'ProtectionClass': 0,
        'RelativePath': {
          UID: 2
        },
      },
      '',
      {
        '$classname': 'MBFile',
        '$classes': [
          'MBFile',
          'NSObject'
        ],
      },
    ],
    '$archiver': 'NSKeyedArchiver',
    '$top': {
      'root': {
        UID: 1
      }
    }
  });

  // fs.writeFileSync(path.join(backupPath, '../folder.plist'), bin, 'binary');

} else {
  const info = fs.statSync(file);
  const mtime = Math.floor(info.mtimeMs / 1000);

  bin = bplistCreator({
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
}

// const hex = bin.toString('hex');
// console.log(hex);
// return 0;

db.run('INSERT INTO Files (fileID, domain, relativePath, flags, file) VALUES ($fileID, $domain, $relativePath, $flags, $file)', {
  $fileID: fileID,
  $domain: appDomain,
  $relativePath: relativePath === 'NULL' ? '' : relativePath,
  $flags: file === 'folder' ? 2 : 1,
    $file: bin
}, (err, success) => {
  if (err) {
    console.log('Failed to insert file data.');
    return 1;
  }
  console.log('Sucesso!');
  return 0;
});
