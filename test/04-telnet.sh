#!/bin/bash

main() {

  if [ -z "$SMTP_PORT" ]
  then
    echo "SMTP_PORT NOT SET"
    return
  fi

  (
  sleep 5;
  echo "HELO cornholio.com";
  sleep 5;
  echo "MAIL FROM: <from-user@example.com>";
  sleep 5;
  echo "RCPT TO: <to-user-a@example.com>";
  sleep 5;
  echo "RCPT TO: <to-user-b@example.com>";
  sleep 5;
  echo "DATA";
  sleep 5;
  echo -e "From: \"Joe Blow\" <joe.blow@nowhere.com>";
  echo -e "Subject: I am the great Cornholio!";
  echo -e "Shake it baby."
  echo -e "\n\n.";
  sleep 5;
  echo "QUIT";
  ) | telnet localhost 3000

}


main