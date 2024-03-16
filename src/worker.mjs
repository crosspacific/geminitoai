import token_html from "./get_copilot_token.html";

export default {
  async fetch (request, env) {
    if (request.method === "OPTIONS") {
      return handleOPTIONS(request);
    }
    const url = new URL(request.url);
    if (url.pathname === "/v1/models") {
      return handleModels(request);
    }
    if (url.pathname === "/token") {
      return new Response(token_html, {
        headers: { "Content-Type": "text/html" }
      });
    }
    if (url.pathname === "/corsproxy" && url.search.startsWith("?https://")) {
      let resp = await fetch(url.search.substring(1), request);
      resp = new Response(resp.body, resp);
      resp.headers.set("Access-Control-Allow-Origin", "*");
      return resp;
    }
    const auth = request.headers.get("Authorization");
    let authKey = auth && auth.split(" ")[1];
    if (!authKey) {
      return new Response("401 Unauthorized", {
        status: 401
      });
    }
    const tokenCache = env.KV;
    let token;
    try {
      token = await tokenCache.get(authKey);
    } catch (e) {
      console.error(e);
    }
    if (!token) {
      let errResponse;
      ({ token, errResponse } = await getToken(authKey));
      if (errResponse) { return errResponse; }
      const expiration = token.match(/;exp=(\d+);/)?.[1];
      if (expiration) {
        try {
          await tokenCache.put(authKey, token, { expiration });
        } catch (e) {
          console.error(e);
        }
      }
    }
    return makeRequest(request, url.pathname, await makeHeaders(token));
  }
};

const handleModels = async () => {
  const data = {
    "object": "list",
    "data": [
      //{"id": "text-embedding-3-large", "object": "model", "created": 1705953180, "owned_by": "system"},
      {"id": "text-embedding-3-small", "object": "model", "created": 1705948997, "owned_by": "system"},
      {"id": "text-embedding-ada-002", "object": "model", "created": 1671217299, "owned_by": "openai-internal"},
      {"id": "gpt-3.5-turbo", "object": "model", "created": 1677610602, "owned_by": "openai"},
      {"id": "gpt-4", "object": "model", "created": 1687882411, "owned_by": "openai"},
    ]
  };
  const json = JSON.stringify(data, null, 2);
  return new Response(json, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "X-Robots-Tag": "noindex",
    },
  });
};

const handleOPTIONS = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    }
  });
};

const chatVersion = "0.13.0";
const vscodeVersion = "1.87.0";
const apiVersion = "2023-07-07";
const getToken = async (authKey) => {
  if (authKey.startsWith("sk-")) { // dumb attempt to hide real auth key from malicious web services
    const decoded = atob(authKey.substring(3));
    if (/^[ -~]+$/.test(decoded)) { // ascii
      authKey = decoded;
    }
  }
  let githubapihost = "api.github.com";
  if (authKey.startsWith("ccu_") || authKey.endsWith("CoCopilot")) {
    githubapihost = "api.cocopilot.org";
  }
  let response = await fetch(`https://${githubapihost}/copilot_internal/v2/token`, {
    method: "GET",
    headers: {
      "Authorization": `token ${authKey}`,
      "Host": githubapihost,
      "Editor-Version": `vscode/${vscodeVersion}`,
      "Editor-Plugin-Version": `copilot-chat/${chatVersion}`,
      "User-Agent": `GitHubCopilotChat/${chatVersion}`,
      "Accept": "*/*",
      "Accept-Encoding": "*",
      //'Accept-Encoding': 'gzip, deflate, br',
    },
  });
  if (!response.ok) {
    return { errResponse: response };
  }
  const text = await response.text();
  let token;
  try {
    token = JSON.parse(text)["token"];
  } catch (e) {
    console.error(e.message,"\n",text);
    return { errResponse: new Response(e.message + "\n" + text, { status: 400 }) };
  }
  if (!token) {
    console.error("token not found:\n", text);
    return { errResponse: new Response("token not found:\n" + text, { status: 400 }) };
  }
  return { token };
};

const makeHeaders = async (token) => {
  const createSha256Hash = async (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  };
  return {
    "Authorization": `Bearer ${token}`,
    "Host": "api.githubcopilot.com",
    "X-Request-Id": crypto.randomUUID(),
    "X-Github-Api-Version": apiVersion,
    "Vscode-Sessionid": crypto.randomUUID() + Date.now().toString(),
    "vscode-machineid": await createSha256Hash(token),
    "Editor-Version": `vscode/${vscodeVersion}`,
    "Editor-Plugin-Version": `copilot-chat/${chatVersion}`,
    "Openai-Organization": "github-copilot",
    "Copilot-Integration-Id": "vscode-chat",
    "Openai-Intent": "conversation-panel",
    "Content-Type": "application/json",
    "User-Agent": `GitHubCopilotChat/${chatVersion}`,
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br",
  };
};

const makeRequest = async (request, path, headers) => {
  if (path.startsWith("/v1/")) {
    path = path.substring(3);
  }
  const response = await fetch(`https://api.githubcopilot.com${path}`, {
    method: request.method,
    headers,
    body: request.body,
  });
  headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  let body;
  if (response.ok && path === "/chat/completions" && request.method === "POST") {
    if (headers.get("Transfer-Encoding") === "chunked") { // is stream
      body = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TransformStream({ transform: cleanStream, buffer: "" }))
        .pipeThrough(new TextEncoderStream());
      headers.set("Content-Type", "text/event-stream");
    } else {
      body = clean(await response.text());
    }
  } else {
    body = response.body;
  }
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
};

const clean = (str) => {
  let json;
  try {
    json = JSON.parse(str);
  } catch (e) {
    console.error(e);
    return str;
  }
  json.model = "gpt-4"; // stub
  //json.system_fingerprint = null;
  json.object = "chat.completion";
  delete json.prompt_filter_results;
  for (const item of json.choices) {
    delete item.content_filter_results;
    //item.logprobs = null;
  }
  return JSON.stringify(json);
};

const cleanLine = (str) => {
  if (str.startsWith("data: ")) {
    let json;
    try {
      json = JSON.parse(str.substring(6));
    } catch (e) {
      if (str !== "data: [DONE]") {
        console.error(e);
      }
      return str;
    }
    if (json.choices.length === 0) { return; } // json.prompt_filter_results
    json.model = "gpt-4"; // stub
    //json.system_fingerprint = null;
    json.object = "chat.completion.chunk";
    for (const item of json.choices) {
      delete item.content_filter_offsets;
      delete item.content_filter_results;
      const delta = item.delta;
      for (const k in delta) {
        if (delta[k] === null ) { delete delta[k]; }
      }
      //delta.content = delta.content || "";
      //item.logprobs = null;
      //item.finish_reason = item.finish_reason || null;
    }
    return "data: " + JSON.stringify(json);
  }
};

const delimiter = "\n\n";
async function cleanStream (chunk, controller) {
  chunk = await chunk;
  if (!chunk) {
    if (this.buffer) {
      controller.enqueue(cleanLine(this.buffer) || this.buffer);
    }
    controller.enqueue("\n");
    controller.terminate();
    return;
  }
  this.buffer += chunk;
  let lines = this.buffer.split(delimiter);
  for (let i = 0; i < lines.length - 1; i++) {
    const line = cleanLine(lines[i]);
    if (line) {
      controller.enqueue(line + delimiter);
    }
  }
  this.buffer = lines[lines.length - 1];
}
