const path = require('path');
const fs = require('fs/promises'); //copyFile, readdir


const outDir = path.join(__dirname, 'files');
const inDir = path.join(__dirname, 'files-copy');
const errHandler = (err) => console.log(err);
const checkSize = async (dir) => (await fs.stat(dir)).size

const makeDir = async (dir) => {
  try{
    await fs.access(dir);
  } catch (error){
    if(error.code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true })
    }else{
     errHandler(error);
    }
  }
}

const isSame = async (outD, inD) => {
  try {
    const size1 = await checkSize(outD);
    const size2 = await checkSize(inD);
    return size1 === size2;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    errHandler(error);
  }
}

const copyDir = async (outD, inD) => {
  try {
  await makeDir(inD);
  const filesToCopy = await fs.readdir(outD, {withFileTypes: true});
  const copiedFiles = await fs.readdir(inD , {withFileTypes: true});

  for(const dirent of copiedFiles){
    if(!filesToCopy.some(currentDirent => currentDirent.name === dirent.name)) {
      await fs.rm(path.join(inD, dirent.name), {recursive: true})
    }
  }

   for(const dirent of filesToCopy){
     let currentOutDir = path.join(outD, dirent.name);
     let currentInDir = path.join(inD, dirent.name);

     const sameFiles = await isSame(currentOutDir, currentInDir)
     if (sameFiles) {
      continue;
     }

     if(dirent.isDirectory()) {
        await copyDir(currentOutDir, currentInDir);
      } else {
        await fs.copyFile(currentOutDir, currentInDir);
      }
    }
  } catch (error) {
    errHandler(error);
  }
}

if (require.main === module) {
  copyDir(outDir, inDir);
}

module.exports ={
  errHandler,
  makeDir,
  copyDir
}

