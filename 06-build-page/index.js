const fs = require('fs/promises');
const path = require('path');
const {errHandler, makeDir, copyDir} = require('../04-copy-directory/index.js');
const makeCssBundle = require('../05-merge-styles/index.js');



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

build();

