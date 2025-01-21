const fsPromises = require('fs/promises');
const fs = require('fs');
const path = require('path');

async function readComponents(dir) {
  try {
    const components = {};
    const folderPath = path.join(__dirname, dir);
    const files = await fsPromises.readdir(folderPath, { withFileTypes: true });

    for (const dirent of files) {
      if (dirent.isFile()) {
        const filePath = path.join(folderPath, dirent.name);
        const fileName = path.basename(filePath, path.extname(filePath));
        components[fileName] = (
          await fsPromises.readFile(filePath, 'utf-8')
        ).trim();
      }
    }
    return components;
  } catch (err) {
    console.log(err);
  }
}

async function buildHtml(dir, componentsDir) {
  try {
    const filePath = path.join(__dirname, dir);
    const components = await readComponents(componentsDir);
    const tagsToReplace = Object.keys(components);
    let html = await fsPromises.readFile(filePath, 'utf-8');

    tagsToReplace.forEach((tag) => {
      html = html.replaceAll(`{{${tag}}}`, components[tag]);
    });
    return html;
  } catch (error) {
    console.log(error);
  }
}

async function build() {
  try {
    const distDir = path.join(__dirname, 'project-dist');
    const htmlPath = path.join(distDir, 'index.html');
    const stylesPath = path.join(__dirname, 'styles');
    const assetsPath = path.join(__dirname, 'assets');
    const assetsDist = path.join(distDir, 'assets');

    await makeDir(distDir);
    const html = await buildHtml('template.html', 'components');
    await fsPromises.writeFile(htmlPath, html);
    await makeCssBundle(stylesPath, distDir, 'style.css');
    await copyDir(assetsPath, assetsDist);
  } catch (error) {
    console.log(error);
  }
}

async function makeCssBundle(outDir, inDir, fileName) {
  try {
    const files = await fsPromises.readdir(outDir, { withFileTypes: true });
    const pathToSave = path.join(inDir, fileName);
    await fsPromises.writeFile(pathToSave, '');

    for (const dirent of files) {
      const filePath = path.join(outDir, dirent.name);

      if (dirent.isFile() && path.extname(filePath) === '.css') {
        const readStream = fs.createReadStream(filePath);
        const writeStream = fs.createWriteStream(pathToSave, { flags: 'a' });

        readStream.on('data', (chunk) =>
          writeStream.write(chunk.toString() + '\n'),
        );
        readStream.on('end', () => writeStream.end());
      }
    }
  } catch (error) {
    console.log(error);
  }
}

const checkSize = async (dir) => (await fsPromises.stat(dir)).size;

const makeDir = async (dir) => {
  try {
    await fsPromises.access(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fsPromises.mkdir(dir, { recursive: true });
    } else {
      console.log(error);
    }
  }
};

const isSame = async (outDir, inDir) => {
  try {
    const size1 = await checkSize(outDir);
    const size2 = await checkSize(inDir);
    return size1 === size2;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    console.log(error);
  }
};

const copyDir = async (outDir, inDir) => {
  try {
    await makeDir(inDir);
    const filesToCopy = await fsPromises.readdir(outDir, {
      withFileTypes: true,
    });
    const copiedFiles = await fsPromises.readdir(inDir, {
      withFileTypes: true,
    });

    for (const dirent of copiedFiles) {
      if (
        !filesToCopy.some((currentDirent) => currentDirent.name === dirent.name)
      ) {
        await fsPromises.rm(path.join(inDir, dirent.name), { recursive: true });
      }
    }

    for (const dirent of filesToCopy) {
      let currentOutDir = path.join(outDir, dirent.name);
      let currentInDir = path.join(inDir, dirent.name);

      if (dirent.isDirectory()) {
        await copyDir(currentOutDir, currentInDir);
      } else {
        const sameFiles = await isSame(currentOutDir, currentInDir);
        if (sameFiles) continue;

        await fsPromises.copyFile(currentOutDir, currentInDir);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

build();
