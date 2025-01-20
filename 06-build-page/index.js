const fs = require('fs/promises');
const path = require('path');

async function readComponents(dir) {
  try {
    const components = {};
    const folderPath = path.join(__dirname, dir);
    const files = await fs.readdir(folderPath, {withFileTypes:true});

    for (const dirent of files) {
      if(dirent.isFile()){
      const filePath = path.join(folderPath, dirent.name);
      const fileName = path.basename(filePath, path.extname(filePath));
      components[fileName] = (await fs.readFile(filePath, 'utf-8')).trim();
      }
    }
    return components;
  } catch (err) {
    errHandler(err);
  }
}

async function buildHtml(dir, componentsDir){
  try {
    const filePath = path.join(__dirname, dir);
    const components = await readComponents(componentsDir);
    const tagsToReplace = Object.keys(components);
    let html = await fs.readFile(filePath, 'utf-8');

    tagsToReplace.forEach((tag) => {
      html = html.replaceAll(`{{${tag}}}`, components[tag]);
    })
    return html;
  } catch (error) {
    errHandler(error);
  }
}

async function build(){
  try {
    const distDir = path.join(__dirname,'project-dist');
    const htmlPath = path.join(distDir,'index.html');
    const stylesPath = path.join(__dirname,'styles');
    const assetsPath = path.join(__dirname,'assets');
    const assetsDist = path.join(distDir, 'assets');

    await makeDir(distDir);
    const html = await buildHtml('template.html', 'components');
    await fs.writeFile(htmlPath, html);
    await makeCssBundle(stylesPath, distDir, 'style.css');
    await copyDir(assetsPath, assetsDist);
  } catch (error) {
    errHandler(error);
  }
}

async function makeCssBundle(outDir, inDir, fileName){
  try {
  const files = await fs.promises.readdir(outDir, {withFileTypes: true});
  const pathToSave = path.join(inDir, fileName);
  await fs.promises.writeFile(pathToSave, '');

  for(const dirent of files){
    const filePath = path.join(outDir, dirent.name);

    if(dirent.isFile() && path.extname(filePath) === '.css') {
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(pathToSave, { flags: 'a' });

      readStream.on('data', (chunk) => writeStream.write(chunk.toString() + '\n'));
      readStream.on('end', () => {
        writeStream.end();
      });
    }
  }
  } catch (error) {
    console.log(error)
  }
}

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

build();

