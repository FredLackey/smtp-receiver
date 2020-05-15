# SMTP Receiver
Receives incoming SMTP email messages and writes them out to a file.

## Background
As I move my domains to AWS, those domains on "stand-by" need to account for emails mistakingly being sent to them.  Since they are not yet profitable, I do not want to incur the cost -- financially or otherwise -- of standing up a mail server.  So, whipping up a quick SMTP receiver service seemed like the easy answer.

## Installation
This project is being made public in case it helps someone else.  However, I've only built enough for it to suit my needs thus far.  It builds upon the project from [Nodemailer](https://nodemailer.com) and adds common intelligence for whitelisting or blacklisting hosted domains and addresses.  That being said, there is not an actual installer.  However, if you do want to use it for receiving emails, you _could_ do as follows:

```
git clone git@github.com:FredLackey/smtp-receiver.git
cd ./smtp-receiver
npm i
./start-dev.sh
```

## Configuration
The provided startup scripts are what I generally use in development.  This is where I set environment vaiables and launch the appropriate process (nodemon in dev, node in prod).  Should you want to use them, you would need to tweak the settings to match your environment:

```
#! /bin/bash

export DATA_DIR="$PWD/.env.test"
export NODE_ENV="development"
export SMTP_PORT="3000"

npm run dev
```

## Contact Info
Feel free to reach out if you need a hand:

**Fred Lackey**  
[fredlackey.com](http://fredlackey.com)  
[fred.lackey@gmail.com](mailto://fred.lackey@gmail.com)  
