#!/bin/bash

main() {

  if [ -z "$SMTP_PORT" ]
  then
    echo "SMTP_PORT NOT SET"
    return
  fi

  local CMD="swaks \
              --to to_user@example.com,to_user_02@example.com \
              --from from_user@example.com \
              -s localhost:$SMTP_PORT"

  eval "$CMD"

}

main