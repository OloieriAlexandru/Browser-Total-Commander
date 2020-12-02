/*
App declarations

https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
*/

const FILE_INFO_SELECTED_CSS_CLASS = 'selected-file-info';
const FILE_INFO_ACTIVE_CSS_CLASS = 'active-file-info';

var activePanelSelectedFiles = [];
var activePanelFileIndexes = [0, 0];
var activePanelIndex = 0;
var activePanelElement = null;

var fileContentModal = document.getElementById('file-content-modal');
var fileContentModalText = document.querySelector('#file-content-modal .modal-content .modal-body');
var fileContentModalOpen = false;
var fileContentModalPanelIndex = null;
var fileContentModalFileName = null;

const TYPE_DIR = 1;
const TYPE_FILE = 2;

var buttonCtrlPressed = false;
var buttonShiftPressed = false;

const BUTTON_TAB = 'Tab';
const BUTTON_ARROW_UP = 'ArrowUp';
const BUTTON_ARROW_DOWN = 'ArrowDown';
const BUTTON_CTRL = 'Control';
const BUTTON_SHIFT = 'Shift';
const BUTTON_ENTER = 'Enter';

const BUTTON_SAVE_FILE = 's';

const BUTTON_EXIT_EDIT_FILE = 'Escape';
const BUTTON_EDIT_FILE = '4';
const BUTTON_COPY_FILES = '5';
const BUTTON_RENAME_FILE_FOLDER = '6';
const BUTTON_CREATE_FOLDER = '7';
const BUTTON_DELETE_FILE_FOLDER = '8';

var keyPressUpCallbacks = {};
var keyPressDownCallbacks = {};
var panelsObj = {};

class KeyPressInfo {
  constructor(callback, requireShift, requireCtrl) {
    this.callback = callback;
    this.requireShift = requireShift;
    this.requireCtrl = requireCtrl;
  }
}

class KeyPressInfoBuilder {
  constructor(callback) {
    this.callback = callback;
    this.requireShift = false;
    this.requireCtrl = false;
  }

  reqShift() {
    this.requireShift = true;
    return this;
  }

  reqCtrl() {
    this.requireCtrl = true;
    return this;
  }

  build() {
    return new KeyPressInfo(this.callback, this.requireShift, this.requireCtrl);
  }
}

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

let panelsHeader = [
  document.querySelector('.left-panel .directory-select'),
  document.querySelector('.right-panel .directory-select')
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
    directories[i].type = TYPE_DIR;
    panelsObj[panelIndex][id] = directories[i];

    panels[panelIndex].innerHTML += `
    <div class="file-info" id="${id}" ondblclick="onObjectDoubleClicked(event, ${panelIndex}, '${id}')"
        onclick="onObjectClicked(event, ${panelIndex}, '${id}')">
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
    files[i].type = TYPE_FILE;
    panelsObj[panelIndex][id] = files[i];

    panels[panelIndex].innerHTML += `
    <div class="file-info" id="${id}" ondblclick="onObjectDoubleClicked(event, ${panelIndex}, '${id}')"
        onclick="onObjectClicked(event, ${panelIndex}, '${id}')">
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

function showFileContent(fileContent) {
  fileContentModalText.value = fileContent;

  fileContentModal.style = "display: flex; flex-direction: column; align-items: center; justify-content: center";

  fileContentModalOpen = true;
}

function closeFileContentModal() {
  fileContentModal.style = "";

  fileContentModalOpen = false;
  fileContentModalPanelIndex = null;
  fileContentModalFileName = null;
}

function classAddToElement(element, cssClass) {
  element.classList.add(cssClass);
}

function classRemoveFromElement(element, cssClass) {
  element.classList.remove(cssClass);
}

function activeElementSet(element) {
  classAddToElement(element, FILE_INFO_ACTIVE_CSS_CLASS);
  element.scrollIntoViewIfNeeded();
}

function activeElementUnset(element) {
  classRemoveFromElement(element, FILE_INFO_ACTIVE_CSS_CLASS);
}

function selectedElementSet(element) {
  classAddToElement(element, FILE_INFO_SELECTED_CSS_CLASS);
}

function selectedElementUnset(element) {
  classRemoveFromElement(element, FILE_INFO_SELECTED_CSS_CLASS);
}

function clearActivePanelSelections() {
  if (activePanelSelectedFiles == null) {
    return;
  }

  for (let i = 0; i < activePanelSelectedFiles.length; ++i) {
    selectedElementUnset(activePanelSelectedFiles[i]);
  }

  activePanelSelectedFiles = [];
}

function getKthElementFromPanel(panelIndex, k) {
  if (k > panels[panelIndex].children.length) {
    return panels[panelIndex].children[0];
  }
  return panels[panelIndex].children[k];
}

function handleSelectElement(el) {
  let index = activePanelSelectedFiles.indexOf(el);
  if (index == -1) {
    activePanelSelectedFiles.push(el);
    selectedElementSet(el);
  } else {
    activePanelSelectedFiles.splice(index, 1);
    selectedElementUnset(el);
  }
}

function handleSelectActiveElement() {
  if (activePanelElement == null) {
    return;
  }
  handleSelectElement(activePanelElement);
}

function changeActivePanel(panelIndex, newElement) {
  if (panelIndex == activePanelIndex && activePanelElement != null) {
    return;
  }

  if (activePanelElement != null) {
    activeElementUnset(activePanelElement);
  }
  if (newElement == null) {
    activePanelElement = getKthElementFromPanel(panelIndex, activePanelFileIndexes[panelIndex]);
    if (activePanelElement != null) {
      activeElementSet(activePanelElement);
    }
  } else {
    activeElementSet(newElement);
  }
}

function changeActivePanelMain(newElement) {
  clearActivePanelSelections();
  let newPanel;
  if (activePanelIndex == null) {
    newPanel = 0;
  } else {
    newPanel = 1 - activePanelIndex;
  }
  changeActivePanel(newPanel, newElement);
  activePanelIndex = newPanel;
}

function findFileInfoElementIndex(element) {
  for (let i = 0; i < panels[activePanelIndex].children.length; ++i) {
    if (panels[activePanelIndex].children[i] == element) {
      return i;
    }
  }
  return 0;
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
    replacePanelInfo(0, res.res.left_panel);
    replacePanelInfo(1, res.res.right_panel);

    changeActivePanel(activePanelIndex, null);
    updatePanelPaths();
  }, (err) => {
    console.log(err);
  })

  initKeyPressDownCallbacks();
  initKeyPressUpCallbacks();
}

function initKeyPressDownCallbacks() {
  keyPressDownCallbacks[BUTTON_CTRL] = new KeyPressInfoBuilder(keyPressDownCallbackControlPressed).build();
  keyPressDownCallbacks[BUTTON_SHIFT] = new KeyPressInfoBuilder(keyPressDownCallbackShiftPressed).build();

  keyPressDownCallbacks[BUTTON_SAVE_FILE] = new KeyPressInfoBuilder(keyPressDownCallbackSaveFile).reqCtrl().build();

  keyPressDownCallbacks[BUTTON_ARROW_DOWN] = new KeyPressInfoBuilder(keyPressDownCallbackArrowDown).build();
  keyPressDownCallbacks[BUTTON_ARROW_UP] = new KeyPressInfoBuilder(keyPressDownCallbackArrowUp).build();

  keyPressDownCallbacks[BUTTON_TAB] = new KeyPressInfoBuilder(keyPressDownCallbackTab).build();
  keyPressDownCallbacks[BUTTON_ENTER] = new KeyPressInfoBuilder(keyPressDownCallbackEnter).build();
}

function initKeyPressUpCallbacks() {
  keyPressUpCallbacks[BUTTON_CTRL] = new KeyPressInfoBuilder(keyPressUpCallbackControlReleased).build();
  keyPressUpCallbacks[BUTTON_SHIFT] = new KeyPressInfoBuilder(keyPressUpCallbackShiftReleased).build();

  keyPressUpCallbacks[BUTTON_EXIT_EDIT_FILE] = new KeyPressInfoBuilder(keyPressUpCallbackExitEditFile).build();
  keyPressUpCallbacks[BUTTON_EDIT_FILE] = new KeyPressInfoBuilder(keyPressUpCallbackEditFile).build();
  keyPressUpCallbacks[BUTTON_COPY_FILES] = new KeyPressInfoBuilder(keyPressUpCallbackCopyFiles).build();
  keyPressUpCallbacks[BUTTON_RENAME_FILE_FOLDER] = new KeyPressInfoBuilder(keyPressUpCallbackRenameFileFolder).build();
  keyPressUpCallbacks[BUTTON_CREATE_FOLDER] = new KeyPressInfoBuilder(keyPressUpCallbackCreateFolder).build();
  keyPressUpCallbacks[BUTTON_DELETE_FILE_FOLDER] = new KeyPressInfoBuilder(keyPressUpCallbackDeleteFileFolder).build();
}

window.onload = initApp();

window.onclick = function (event) {
  if (event.target == fileContentModal) {
    closeFileContentModal();
  }
}

function executeCallbackHandler(event, keyPressInfo) {
  let totalConditions = 0;
  let fulfilledConditions = 0;

  if (keyPressInfo.requireCtrl) {
    ++totalConditions;
    if (buttonCtrlPressed) {
      ++fulfilledConditions;
    }
  }

  if (keyPressInfo.requireShift) {
    ++totalConditions;
    if (buttonShiftPressed) {
      ++fulfilledConditions;
    }
  }

  if (totalConditions != fulfilledConditions) {
    return;
  }
  event.preventDefault();
  keyPressInfo.callback(event);
}

window.onkeydown = function (event) {
  if (event != undefined && event.key in keyPressDownCallbacks) {
    executeCallbackHandler(event, keyPressDownCallbacks[event.key]);
  }
}

window.onkeyup = function (event) {
  if (event != undefined && event.key in keyPressUpCallbacks) {
    executeCallbackHandler(event, keyPressUpCallbacks[event.key]);
  }
}

/*
Event Handlers
*/

function keyPressDownCallbackControlPressed() {
  buttonCtrlPressed = true;
}

function keyPressDownCallbackShiftPressed() {
  buttonShiftPressed = true;
}

function keyPressUpCallbackControlReleased() {
  buttonCtrlPressed = false;
}

function keyPressUpCallbackShiftReleased() {
  buttonShiftPressed = false;
}

function keyPressUpCallbackExitEditFile() {
  if (fileContentModalOpen) {
    closeFileContentModal();
  }
}

function keyPressUpCallbackEditFile() {

}

function keyPressUpCallbackRenameFileFolder() {

}

function keyPressUpCallbackCreateFolder() {

}

function keyPressUpCallbackCopyFiles() {

}

function keyPressUpCallbackDeleteFileFolder() {

}

function keyPressDownCallbackArrowUp() {
  if (activePanelElement == null) {
    return;
  }
  if (buttonShiftPressed) {
    handleSelectActiveElement();
  }
  if (activePanelElement.previousElementSibling != null) {
    activeElementUnset(activePanelElement);
    activePanelElement = activePanelElement.previousElementSibling;
    activeElementSet(activePanelElement);
    --activePanelFileIndexes[activePanelIndex];
  }
}

function keyPressDownCallbackArrowDown() {
  if (activePanelElement == null) {
    return;
  }
  if (buttonShiftPressed) {
    handleSelectActiveElement();
  }
  if (activePanelElement.nextElementSibling != null) {
    activeElementUnset(activePanelElement);
    activePanelElement = activePanelElement.nextElementSibling;
    activeElementSet(activePanelElement);
    ++activePanelFileIndexes[activePanelIndex];
  }
}

function keyPressDownCallbackTab(event) {
  changeActivePanelMain(null);
  event.preventDefault();
}

function keyPressDownCallbackEnter() {
  if (activePanelElement == null) {
    return;
  }
  let id = activePanelElement.id;
  let type = panelsObj[activePanelIndex][id].type;
  if (type == TYPE_DIR) {
    changeDirectory(activePanelIndex, id);
  } else if (type == TYPE_FILE) {
    editFile(activePanelIndex, id);
  }
}

function keyPressDownCallbackSaveFile() {
  if (!fileContentModal) {
    return;
  }

  let url = encodeURIComponent("/api/files/" + fileContentModalPanelIndex + "/" + fileContentModalFileName);
  httpPUT(url, {
    'wrong-content': fileContentModalText.value
  }, (res) => {
    console.log(res);
  }, (err) => {
    console.log(err);
  });
}

function updatePanelPaths() {
  const objProperties = ['panel_left', 'panel_right'];
  const decodedToken = getDecodedPathsToken();
  for (let i = 0; i < 2; ++i) {
    panelsHeader[i].innerHTML = decodedToken[objProperties[i]];
  }
}

function changeDirectory(panelIndex, id) {
  let dirName = panelsObj[panelIndex][id].name;
  let url = encodeURIComponent("/api/dirs/" + panelIndex + "/" + dirName);
  httpGET(url, (res) => {
    clearActivePanelSelections();
    replacePanelInfo(panelIndex, res.res.dir_content);
    activePanelElement = null;
    activePanelFileIndexes[panelIndex] = 0;
    changeActivePanel(activePanelIndex, null);
    updatePanelPaths();
  }, (err) => {
    console.log(err);
  });
}

function editFile(panelIndex, id) {
  let fileName = panelsObj[panelIndex][id].name;
  let url = encodeURIComponent("/api/files/" + panelIndex + "/" + fileName);
  httpGET(url, (res) => {
    fileContentModalPanelIndex = panelIndex;
    fileContentModalFileName = fileName;

    showFileContent(res.res.file_content);
  }, (err) => {
    console.log(err);
  });
}

function onObjectDoubleClicked(event, panelIndex, id) {
  if (!(panelIndex in panelsObj)) {
    return;
  }
  let type = panelsObj[panelIndex][id].type;
  if (type == TYPE_DIR) {
    changeDirectory(panelIndex, id);
    event.stopPropagation();
  } else if (type == TYPE_FILE) {
    editFile(panelIndex, id);
    event.stopPropagation();
  }
}

function onObjectClicked(event, panelIndex, id) {
  if (!(panelIndex in panelsObj)) {
    return;
  }
  let el = document.getElementById(id);
  if (buttonCtrlPressed) {
    handleSelectElement(el);
  } else {
    if (panelIndex != activePanelIndex) {
      changeActivePanelMain(el);
      activePanelElement = el;
    } else {
      activeElementUnset(activePanelElement);
      activePanelElement = el;
      activeElementSet(activePanelElement);
    }
    activePanelFileIndexes[activePanelIndex] = findFileInfoElementIndex(el);
  }
}
