#!/bin/bash

main() {

  if [ -z "$SMTP_PORT" ]
  then
    echo "SMTP_PORT NOT SET"
    return
  fi

  local CMD="swaks \
              --to mailbox@example.com \
              -s localhost:$SMTP_PORT"

  eval "$CMD"

}

main