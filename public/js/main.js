/*
App declarations
*/

let panels = [
  document.querySelector('.left-panel .files-info'),
  document.querySelector('.right-panel .files-info')
]

function goodPanelIndex(index) {
  return index >= 0 && index <= panels.length;
}

function replacePanelFiles(panelIndex, directories, files) {
  if (!goodPanelIndex(panelIndex)) {
    console.log("ERROR - invalid panel index!");
    return;
  }
  panels[panelIndex].innerHTML = '';
  console.log(panels[panelIndex]);
  for (let i = 0; i < directories.length; ++i) {
    panels[panelIndex].innerHTML += `
    <div class="file-info">
      <div class="column-type-1">
        ${directories[i]}
      </div>
      <div class="column-type-2">
        &lt;DIR&gt;
      </div>
      <div class="column-type-3">
        07/14/2018 22:40
      </div>
    </div>
    `;
  }
  for (let i = 0; i < files.length; ++i) {
    panels[panelIndex].innerHTML += `
    <div class="file-info">
      <div class="column-type-1">
        ${files[i]}
      </div>
      <div class="column-type-2">
        &lt;FILE&gt;
      </div>
      <div class="column-type-3">
        07/14/2018 22:40
      </div>
    </div>
    `;
  }
}

function replacePanelInfo(panelIndex, panelInfo) {
  console.log(panelInfo);
  replacePanelFiles(panelIndex, panelInfo.dirs, panelInfo.files);
}

/*
Panel paths token
*/

const TOKEN_KEY = 'paths-token';

function getPathsToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (token == null) {
    return null;
  }
  return token;
}

function getDecodedPathsToken() {
  let token = getPathsToken();
  if (token == null) {
    return null;
  }
  return jwt_decode(token);
}

function removePathsToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function savePathToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/*
AJAX
*/

// https://github.com/CojocariuAlexandru/WEB/blob/master/web-app/scripts/services.js
function httpRequest(url, httpVerb, body, res, err) {
  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open(httpVerb, url);

  let token = getPathsToken();
  if (token != null) {
    xmlhttp.setRequestHeader('x-panel-paths-token', token);
  }

  xmlhttp.setRequestHeader('Content-Type', 'application/json');

  if (body) {
    xmlhttp.send(JSON.stringify(body));
  } else {
    xmlhttp.send();
  }

  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status >= 200 && this.status < 300) {
        if (res) {
          jsonObj = JSON.parse(xmlhttp.responseText);
          if (jsonObj.hasOwnProperty('token')) {
            savePathToken(jsonObj.token);
          }
          res({
            status: this.status,
            res: jsonObj
          });
        }
      } else if (this.status >= 400 && this.status < 600) {
        if (err) {
          err({
            status: this.status,
            res: xmlhttp.responseText
          });
        }
      }
    }
  }
}

function httpGET(url, res, err) {
  httpRequest(url, "GET", null, res, err);
}

function httpPOST(url, obj, res, err) {
  httpRequest(url, "POST", obj, res, err);
}

function httpPUT(url, obj, res, err) {
  httpRequest(url, "PUT", obj, res, err);
}

function httpDELETE(url, res, err) {
  httpRequest(url, "DELETE", null, res, err);
}

function initApp() {
  httpGET("/api/all", (res) => {
    console.log(res);
    replacePanelInfo(0, res.res.left_panel);
    replacePanelInfo(1, res.res.right_panel);
  }, (err) => {
    console.log(err);
  })
}

window.onload = initApp();
