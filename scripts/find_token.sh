#!/bin/bash

host_file="$HOME/.config/github-copilot/hosts.json"
token_file="$HOME/.copilot-cli-access-token"

if [ -f "$host_file" ]; then
    echo "Found hosts.json:"
    cat "$host_file"
else
    echo "hosts.json not found."
fi

echo

if [ -f "$token_file" ]; then
    echo "Found .copilot-cli-access-token:"
    cat "$token_file"
else
    echo ".copilot-cli-access-token not found."
fi
