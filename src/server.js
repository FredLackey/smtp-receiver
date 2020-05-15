const _     = require('cleaner-node');
const fs    = require('fs');
const path  = require('path');
const { SMTPServer } = require('smtp-server');
const addresses = require('./addresses');

const CACHE = {
  def  : null,
  items: []
};

const loadDefinition = async () => {
  if (_.objects.isValid(CACHE.def)) { return CACHE.def; }
  CACHE.def = await addresses.getAddressDefinition();
  return CACHE.def;
};

const getCacheItem = session => {
  return CACHE.items.find(x => (x && x.session === session));
};
const initCache = session => {
  const existing = getCacheItem(session);
  if (existing) { return existing; }
  if (_.env.IS_DEV || _.env.IS_DEBUG) {
    console.info(` > CACHING SESSION ${session.id}`);
  }
  const newItem = { 
    session,
    received  : (new Date())
  };
  CACHE.items.push(newItem);
  return newItem;
};

const isValidTo = ({ address }) => {
  if (_.env.IS_DEV || _.env.IS_DEBUG) {
    console.log('----- isValidTo -----');
  }

  if (!_.email.isValid(address)) { 
    return false; 
  }
  const domainName = _.email.getDomainName(address);
  if (!_.strings.isValid(domainName)) { 
    return false; 
  }
  const localPart = _.email.getLocalPart(address);
  if (!_.strings.isValid(localPart)) { 
    return false; 
  }

  const allowed = CACHE.def.allowed
    .filter(x => (
      x === address.toLowerCase() ||
      x === `*@${domainName}`
    ));

  const blocked = CACHE.def.blocked
    .filter(x => (
      x === address.toLowerCase()
    ));
  
  return (allowed.length > 0 && blocked.length === 0);
};

const endStream = async (stream) => {
  if (_.env.IS_DEV || _.env.IS_DEBUG) {
    console.log('----- endStream -----');
  }
  await stream.end();
  await stream.close();
};
const saveInfo = (item) => {
  if (_.env.IS_DEV || _.env.IS_DEBUG) {
    console.log('----- saveInfo -----');
  }
  const dirName   = path.dirname(item.file);
  const fileName  = path.basename(item.file);
  const logName   = `${fileName.split('.')[0]}.log`;
  const logPath   = path.join(dirName, logName);
  
  _.files.writeFile(logPath, JSON.stringify(item, null, 2));
};

const server = new SMTPServer({
  name        : `${_.env.MODULE_NAME} v${_.env.MODULE_VERSION}`,
  
  disabledCommands  : ['AUTH'],
  secure            : false,
  authMethods       : [],
  
  onAuth : (auth, session, next) => {
    if (_.env.IS_DEV || _.env.IS_DEBUG) {
      console.log('----- onAuth -----');
    }
    return next(new Error('Authorization is disabled.'));
  },
  
  onConnect : (session, next) => {
    if (_.env.IS_DEV || _.env.IS_DEBUG) {
      console.log('----- onConnect -----');
      console.log(`SESSION ID: ${session.id}`);
    }
    const item = initCache(session);
    if (!item) { return next(new Error('Session init failed.')); }
    next();
  },
  
  onClose : (session) => {
    if (_.env.IS_DEV || _.env.IS_DEBUG) {
      console.log('----- onClose -----');
    }
    const item = initCache(session);
    item.closed = true;
  },
  
  onMailFrom : (address, session, next) => {
    if (_.env.IS_DEV || _.env.IS_DEBUG) {
      console.log('----- onMailFrom -----');
      console.log(`ADDRESS: ${address.address}`);
    }
    const item = initCache(session);
    item.from = item.from || [];
    item.from.push(address);
    next();
  },
  
  onRcptTo : (address, session, next) => {
    if (_.env.IS_DEV || _.env.IS_DEBUG) {
      console.log('----- onRcptTo -----');
      console.log(`ADDRESS: ${address.address}`);
    }
    if (!isValidTo(address)) {
      return next(new Error('Not acceptable.'));
    }
    const item = initCache(session);
    item.to = item.to || [];
    item.to.push(address);
    next();
  },
  
  onData : (stream, session, next) => {
    if (_.env.IS_DEV || _.env.IS_DEBUG) {
      console.log('----- onData -----');
    }
    const item = initCache(session);
    if (!item.file) {
      const subdir  = _.dates.toBlockDate(item.date, '/', false);
      const fullDir = path.join(_.env.DATA_DIR, subdir);
      item.file     = path.join(path.dirname(fullDir), `${_.dates.toUnixDateStamp(item.date)}.eml`);
      
      // item.file = path.resolve(path.join(__dirname, '../_test', `${_.dates.toUnixDateStamp(item.date)}.eml`));
      if (!_.files.createPath(path.dirname(item.file))) { 
        throw new Error('Failed to create output folder!'); 
      }
      item.stream = fs.createWriteStream(item.file);
    }
    stream.pipe(item.stream);
    stream.on('end', async () => {
      item.ended = true;
      await endStream(item.stream);
      await saveInfo(item);
      next();
    });
  }
});


server.on('error', err => {
  console.log('Error %s', err.message);
});
server.listen(_.env.SMTP_PORT,  async () => {
  
  const addressDef = await loadDefinition();
  
  if (!_.objects.isValid(addressDef)) { 
    throw new Error('Invalid address definition.'); 
  }
  if (!_.files.createPath(_.env.DATA_DIR)) {
    throw new Error('Invalid data directory.'); 
  }
  
  console.log(`${_.env.MODULE_DESCRIPTION} v${_.env.MODULE_VERSION}`);
  console.log(`ALLOWED  : ${addressDef.allowed.length}`);
  console.log(`BLOCKED  : ${addressDef.blocked.length}`);
  console.log(`PORT     : ${_.env.SMTP_PORT}`);
  console.log(`DATA     : ${_.env.DATA_DIR}`);
  console.log(`DEV      : ${_.env.IS_DEV}`);
  console.log(`DEBUG    : ${_.env.IS_DEBUG}`);
});
