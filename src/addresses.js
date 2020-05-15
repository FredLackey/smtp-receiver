const _     = require('cleaner-node');
const path  = require('path');
const fs    = require('fs');

const NAMES = [
  '.addresses',
  '.addressesrc',
  '.addresses.txt',
  '.addressesrc.txt',
  'addresses',
  'addressesrc',
  'addresses.txt',
  'addressesrc.txt',
];

const getArrays = async (filePath) => {
  
  const lines = await _.files.readLines(filePath);
  
  const allowed = lines
    .filter(x => (_.strings.isValid(x) && !x.trim().startsWith('#') && !x.trim().startsWith('!')))
    .map(x => (x.trim().toLowerCase()))
    .filter(x => (_.email.isValidText(x) || _.email.isValidText(`test@${x}`)));
  
  const blocked = lines
    .filter(x => (_.strings.isValid(x) && x.trim().startsWith('!')))
    .map(x => (x.trim().toLowerCase()))
    .map(x => (_.strings.removePrefix(x, '!')))
    .filter(x => (_.email.isValidText(x) || _.email.isValidText(`test@${x}`)));

  if (allowed.length > 0 && blocked.length > 0) {
    if (allowed.filter(x => (x && blocked.includes(x))).length > 0) {
      throw new Error('Allowed values appear in block list.');
    }
    if (blocked.filter(x => (x && allowed.includes(x))).length > 0) {
      throw new Error('Blocked values appear in allow list.');
    }
  }

  return { allowed, blocked };
};

module.exports.getAddressDefinition = async () => {
  const root  = path.resolve(path.join(__dirname, '../'));
  const files = fs.readdirSync(root).filter(x => (x && NAMES.includes(x.toLowerCase()))).map(name => (path.join(root, name))); 
  if (files.length === 0) { return { allowed: [], blocked: [] }; }
  if (files.length > 1) { throw new Error('Multiple address files found.'); }
  const result = await getArrays(files[0]);
  return result;
};


