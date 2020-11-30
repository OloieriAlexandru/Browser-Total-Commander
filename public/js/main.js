/*
App declarations

https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
*/

var panelsObj = {}

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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

  panelsObj[panelIndex] = {}

  panels[panelIndex].innerHTML = '';
  for (let i = 0; i < directories.length; ++i) {
    let id = 'element' + makeid(5);
    panelsObj[panelIndex][id] = directories[i];

    panels[panelIndex].innerHTML += `
    <div class="file-info" id="${id}" ondblclick="onObjectDoubleClicked(event, ${panelIndex}, '${id}')">
      <div class="column-type-1">
        ${directories[i].name}
      </div>
      <div class="column-type-2">
        &lt;DIR&gt;
      </div>
      <div class="column-type-3">
        ${directories[i].created_date}
      </div>
    </div>
    `;
  }
  for (let i = 0; i < files.length; ++i) {
    let id = 'element' + makeid(5);
    panelsObj[panelIndex][id] = files[i];

    panels[panelIndex].innerHTML += `
    <div class="file-info" id="${id}" ondblclick="onObjectDoubleClicked(event, ${panelIndex}, ${id})">
      <div class="column-type-1">
        ${files[i].name}
      </div>
      <div class="column-type-2">
        ${files[i].size}
      </div>
      <div class="column-type-3">
        ${files[i].created_date}
      </div>
    </div>
    `;
  }
}

function replacePanelInfo(panelIndex, panelInfo) {
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

/*
Event Handlers
*/

function onObjectDoubleClicked(evt, panelIndex, id) {
  let dirName = panelsObj[panelIndex][id].name;
  let url = encodeURIComponent("/api/dirs/" + panelIndex + "/" + dirName);
  console.log(url);
  httpGET(url, (res) => {
    console.log(res);
    replacePanelInfo(panelIndex, res.res.dir_content);
  }, (err) => {
    console.log(err);
  });
  evt.stopPropagation();
}
