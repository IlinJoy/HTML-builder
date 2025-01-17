const fs = require('fs');
const path = require('path');

const errHandler = (err) => console.log(err);

const combineWithSize = (itemPath, name, extension) => {
  return fs.stat(itemPath, (err, stats)=> {
    if(err) errHandler(err);
    size = stats.size;
    console.log(`${name}-${extension}-${size}`);
  })
};

const folderPath = path.join(__dirname, 'secret-folder');
fs.readdir(folderPath, {withFileTypes: true}, (err, files) => {
  if(err) errHandler(err);

  files.forEach(dirent => {
    if(dirent.isFile()){
      const itemPath = path.join(folderPath,dirent.name)
      const extension = path.extname(itemPath);
      const name = path.basename(itemPath, extension)
      combineWithSize(itemPath, name, extension.slice(1));
    }
  })
})

//<file name>-<file extension>-<file size>