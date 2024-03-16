To use the `openai-github-copilot` service, you need a GitHub Copilot-enabled _access token_. This is a string that starts with either `ghu_` or `gho_`.

This directory contains scripts that assist you in locating the _access token_ on your system (_if you've previously used the official Copilot plugin or CLI_), or generating a new one.

> [!WARNING]
> You still need an active Copilot subscription.

For your convenience, we've listed command lines below that you can execute immediately, without the need to download any script explicitly.

Of course, you can also execute these scripts locally.

While the scripts are straightforward and you can review their source code yourself, their use is entirely optional. You can achieve the same results without using these third-party scripts:

<details>

- If you have previously used Copilot in _VSCode_ or _JetBrains_, you should check the `hosts.json` file, which is located at
  `~/.config/github-copilot/hosts.json` _(for Linux)_, or
  `%LOCALAPPDATA%\github-copilot\hosts.json` _(for Windows)_.
- If you have previously used Copilot through the [github-copilot-cli](https://githubnext.com/projects/copilot-cli),
  you should check a different file:
  `~/.copilot-cli-access-token` _(for Linux)_, or `%HOMEDRIVE%HOMEPATH%\.copilot-cli-access-token` _(for Windows)_.

  If not, then follow next steps:
  - Install it using `npm i -g @githubnext/github-copilot-cli` (you need [Node.js](https://nodejs.org/en/download/) for this).
  - Run `github-copilot-cli auth` and follow the instructions.  
    Ignore the _"Failed to authenticate.."_ message, it's not relevant here.
  - Retrieve your token from `copilot-cli-access-token`, as described above.
</details>



## Find existing Github Copilot access token

* Bash
  ```sh
  curl -LsSf https://gitea.com/PublicAffairs/openai-github-copilot/raw/main/scripts/find_token.sh | sh
  ```
* Powershell
  ```sh
  powershell -c "irm https://gitea.com/PublicAffairs/openai-github-copilot/raw/main/scripts/Find-Token.ps1 | iex"
  ```

## Generate Github Copilot access token

* Bash
  ```sh
  curl -LsSf https://gitea.com/PublicAffairs/openai-github-copilot/raw/main/scripts/get_copilot_token.sh | sh
  ```
* Python
  ```sh
  curl -LsSf https://gitea.com/PublicAffairs/openai-github-copilot/raw/main/scripts/get_copilot_token.py | python
  ```
* Powershell
  ```sh
  powershell -c "irm https://gitea.com/PublicAffairs/openai-github-copilot/raw/main/scripts/Get-CopilotToken.ps1 | iex"
  ```

[jq]: https://jqlang.github.io/jq/
