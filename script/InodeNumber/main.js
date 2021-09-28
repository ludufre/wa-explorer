"use strict";

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bplist = require('bplist');

if (process.argv.length != 3) {
  console.log('Missing backup path');
  return 1;
}

const backupPath = process.argv[2];

if (!fs.existsSync(path.join(backupPath, 'Manifest.db'))) {
  console.log('Not a valida backup path. Manifest.db not found.');
  return 1;
}

let db;
try {
  db = new sqlite3.Database(path.join(backupPath, 'Manifest.db'), sqlite3.OPEN_READONLY);
} catch (err) {
  console.log('Can\'t open database file');
  return 1;
}

db.all('SELECT file FROM Files', [], (err, result) => {
  if (err) {
    console.log('Can\'t open database file');
    throw err;
  }

  let last = 0;

  result.forEach(row => {
    bplist.parseBuffer(row.file, (err, data) => {
      if (err) {
        console.log('Can\'t get bplist');
      } else {
        data[0]?.$objects.forEach(obj => {
          if (!!obj?.InodeNumber) {
            if (obj.InodeNumber > last) {
              last = obj.InodeNumber;
            }
          }
        });
      }
    })
  });

  console.log(last);
  return 0;
});
