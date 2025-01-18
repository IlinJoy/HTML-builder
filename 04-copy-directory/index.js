const path = require('path');
const fs = require('fs/promises'); //copyFile, readdir


const outDir = path.join(__dirname, 'files');
const inDir = path.join(__dirname, 'files-copy');
const errHandler = (err) => console.log(err);
const checkSize = async (dir) => (await fs.stat(dir)).size

const makeDir = async (dir) => {
  try{
    await fs.mkdir(dir, { recursive: true });
  } catch (error){
    if(error.code !== 'ENOENT') errHandler(error.code);
  }
}

const isSame = async (outDir, inDir) => {
  try {
    await fs.access(inDir);
    const size1 = await checkSize(outDir);
    const size2 = await checkSize(inDir);
    return size1 === size2;
  } catch (error) {
    if(error.code !== 'ENOENT') errHandler(error.code);
    return false;
  }
}

const copyDir = async (outDir, inDir) => {
  try {
  await makeDir(inDir);
  const filesToCopy = await fs.readdir(outDir, {withFileTypes: true, recursive: true});
  const copiedFiles = await fs.readdir(inDir, {withFileTypes: true, recursive: true});

  for(const dirent of copiedFiles){
    if(!filesToCopy.find(currentDirent => currentDirent.name === dirent.name)) {
      await fs.rm(path.join(inDir, dirent.name), {recursive: true})
    }
  }

  for(const dirent of filesToCopy){
    let currentOutDir = path.join(outDir, dirent.name);
    let currentInDir = path.join(inDir, dirent.name);

    if(dirent.isDirectory()) {
    await copyDir(currentOutDir, currentInDir);
    continue
    }

    const sameFiles = await isSame(currentOutDir, currentInDir)
    if(sameFiles) continue;
    await fs.copyFile(currentOutDir, currentInDir);
  }

  } catch (error) {
    errHandler(error);
  }
}

copyDir(outDir, inDir);


