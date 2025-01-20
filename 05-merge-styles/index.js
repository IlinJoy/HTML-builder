const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'styles');
const inDir = path.join(__dirname, 'project-dist');

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

makeCssBundle(outDir, inDir, 'bundle.css');

module.exports = makeCssBundle;