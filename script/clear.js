const fs = require('fs');
const path = require('path');

const base = process.cwd();

const findFoldersByName = (startPath, folderName, folder = true) => {
  let result = []

  const walk = (dir) => {
    const list = fs.readdirSync(dir)
    for (var file of list) {
      const filePath = path.join(dir, file)
      // if (fs.existsSync(filePath)) {
      // console.log('rastreando: ', filePath);
      const stat = fs.lstatSync(filePath)
      if (stat) {
        if (
          file === folderName && (
            (folder === true && stat.isDirectory() && result.findIndex((item) => filePath.startsWith(item)) === -1) ||
            (folder === false && !stat.isDirectory())
          )) {
          result.push(filePath)
        }
        if (stat.isDirectory()) {
          walk(filePath)
        }
        // }
      }
    }
  }

  walk(startPath)
  return result
}

['node_modules', 'dist', '.angular', 'generated', 'packed'].forEach((folderName) => {
  findFoldersByName(base, folderName).forEach((folder) => {
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true })
      console.log('Removido: ', folder);
    }
  });
});
