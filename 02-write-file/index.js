const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { stdin, stdout } = process;

const fileDir = path.join(__dirname, 'text.txt');
const messages = {
  welcome: 'Hello??? Anybody up there?',
  bye: 'Bye!'
}

fs.rm(fileDir, () => {
const writeStream = fs.createWriteStream(fileDir, { flags: 'a' });
const readLine = readline.createInterface( { input: stdin, output: stdout });
readLine.setPrompt(`${messages.welcome}\n`);
readLine.prompt();

readLine.on('line', (input) => {
  if (input === 'exit') {
    console.log('aax, ok then!');
    readLine.close();
    return;
  }
  writeStream.write(`${input}\n`);
  });

  readLine.on('SIGINT', () => {
    console.log(messages.bye);
    readLine.close();
  });
})
