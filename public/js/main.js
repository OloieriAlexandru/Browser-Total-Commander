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

var confirmModal = document.getElementById('confirm-modal');
var confirmModalText = document.querySelector('#confirm-modal .modal-content .modal-body');
var confirmModalOpen = false;
var confirmModalPanelIndex = null;
var confirmModalFileName = null;
var confirmModalCallback = null;

var inputModal = document.getElementById('input-modal');
var inputModalText = document.querySelector('#input-modal .modal-content .prompt');
var inputModalInput = document.querySelector('#input-modal .modal-content .modal-input');
var inputModalOpen = false;
var inputModalPanelIndex = null;
var inputModalFileName = null;
var inputModalCallback = null;

function fileContentModalIsOpen() {
  return fileContentModalOpen;
}

function confirmModalIsOpen() {
  return confirmModalOpen;
}

function inputModalIsOpen() {
  return inputModalOpen;
}

function screenIsMain() {
  const checks = [fileContentModalIsOpen, confirmModalIsOpen, inputModalIsOpen];
  for (let i = 0; i < checks.length; ++i) {
    if (checks[i]()) {
      return false;
    }
  }
  return true;
}

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

const BUTTON_SAVE_FILE = 'KeyS';

const BUTTON_EXIT_EDIT_FILE = 'Escape';
const BUTTON_EDIT_FILE = 'Digit4';
const BUTTON_CREATE_FILE = 'Digit4';
const BUTTON_COPY_FILES = 'Digit5';
const BUTTON_RENAME_FILE_FOLDER = 'Digit6';
const BUTTON_MOVE_FILE_FOLDER = 'Digit6';
const BUTTON_CREATE_FOLDER = 'Digit7';
const BUTTON_DELETE_FILE_FOLDER = 'Digit8';

var keyPressUpCallbacks = {};
var keyPressDownCallbacks = {};
var panelsObj = {};

class KeyPressInfo {
  constructor(callback, requireShift, requireCtrl, checkCallbacks) {
    this.callback = callback;
    this.requireShift = requireShift;
    this.requireCtrl = requireCtrl;
    this.checkCallbacks = checkCallbacks;
  }

  allChecksPass() {
    for (let i = 0; i < this.checkCallbacks.length; ++i) {
      if (!this.checkCallbacks[i]()) {
        return false;
      }
    }
    return true;
  }
}

class KeyPressInfoBuilder {
  constructor(callback) {
    this.callback = callback;
    this.requireShift = false;
    this.requireCtrl = false;
    this.checkCallbacks = [];
  }

  reqShift() {
    this.requireShift = true;
    return this;
  }

  reqCtrl() {
    this.requireCtrl = true;
    return this;
  }

  addCheck(check) {
    this.checkCallbacks.push(check);
    return this;
  }

  build() {
    return new KeyPressInfo(this.callback, this.requireShift, this.requireCtrl, this.checkCallbacks);
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
        [${directories[i].name}]
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
  fileContentModalText.focus();
  fileContentModalText.scrollTop = 0;
}

function closeFileContentModal() {
  fileContentModal.style = "";

  fileContentModalOpen = false;
  fileContentModalPanelIndex = null;
  fileContentModalFileName = null;
}

function showConfirmModal(text, callback) {
  confirmModalText.innerHTML = text;
  confirmModal.style = "display: flex; flex-direction: column; align-items: center; justify-content: center";

  confirmModalCallback = callback;
  confirmModalOpen = true;
}

function closeConfirmModal(confirmResult) {
  if (confirmModalCallback) {
    confirmModalCallback(confirmResult);
  }
  confirmModal.style = "";

  confirmModalOpen = false;
  confirmModalPanelIndex = null;
  confirmModalFileName = null;
  confirmModalCallback = null;
}

function showInputModal(text, initialValue, callback) {
  inputModalText.innerHTML = text;
  inputModal.style = "display: flex; flex-direction: column; align-items: center; justify-content: center";
  inputModalInput.value = initialValue;
  inputModalInput.focus();

  inputModalCallback = callback;
  inputModalPanelIndex = activePanelIndex;
  inputModalOpen = true;
}

function closeInputModal(confirmResult) {
  if (inputModalCallback) {
    inputModalCallback(confirmResult, inputModalInput.value);
  }
  inputModal.style = "";

  inputModalOpen = false;
  inputModalPanelIndex = null;
  inputModalFileName = null;
  inputModalCallback = null;
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
  if (panelsObj[activePanelIndex][el.id].name === '..') {
    return;
  }
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

function checkPanelReload(jsonObj) {
  let panelsCount = 2;
  let baseName = 'reloaded_panel_';
  for (let i = 0; i < panelsCount; ++i) {
    let currentPanelPropName = baseName + i;
    if (jsonObj.hasOwnProperty(currentPanelPropName)) {
      let dirs = jsonObj[currentPanelPropName][0];
      let files = jsonObj[currentPanelPropName][1];
      replacePanelFiles(i, dirs, files);
      if (i == activePanelIndex) {
        clearActivePanelSelections();
        activePanelElement = null;
        activePanelFileIndexes[activePanelIndex] = 0;
        changeActivePanel(activePanelIndex, null);
      }
    }
  }
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
          let jsonObj = JSON.parse(xmlhttp.responseText);
          if (jsonObj.hasOwnProperty('token')) {
            savePathToken(jsonObj.token);
          }
          checkPanelReload(jsonObj);
          res({
            status: this.status,
            res: jsonObj
          });
        }
      } else if (this.status >= 400 && this.status < 600) {
        let jsonObj = JSON.parse(xmlhttp.responseText)
        if (err && jsonObj.hasOwnProperty('error_message')) {
          err({
            status: this.status,
            res: jsonObj.error_message
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

  initKeyPressArrays();
  initKeyPressDownCallbacks();
  initKeyPressUpCallbacks();
}

function initKeyPressArrays() {
  keyPressDownCallbacks[BUTTON_CTRL] = [];
  keyPressDownCallbacks[BUTTON_SHIFT] = [];
  keyPressDownCallbacks[BUTTON_SAVE_FILE] = [];
  keyPressDownCallbacks[BUTTON_ARROW_DOWN] = [];
  keyPressDownCallbacks[BUTTON_ARROW_UP] = [];
  keyPressDownCallbacks[BUTTON_TAB] = [];
  keyPressDownCallbacks[BUTTON_ENTER] = [];

  keyPressUpCallbacks[BUTTON_CTRL] = [];
  keyPressUpCallbacks[BUTTON_SHIFT] = [];
  keyPressUpCallbacks[BUTTON_EXIT_EDIT_FILE] = [];
  keyPressUpCallbacks[BUTTON_EDIT_FILE] = [];
  keyPressUpCallbacks[BUTTON_COPY_FILES] = [];
  keyPressUpCallbacks[BUTTON_RENAME_FILE_FOLDER] = [];
  keyPressUpCallbacks[BUTTON_CREATE_FOLDER] = [];
  keyPressUpCallbacks[BUTTON_DELETE_FILE_FOLDER] = [];
}

function initKeyPressDownCallbacks() {
  keyPressDownCallbacks[BUTTON_CTRL].push(new KeyPressInfoBuilder(keyPressDownCallbackControlPressed).build());
  keyPressDownCallbacks[BUTTON_SHIFT].push(new KeyPressInfoBuilder(keyPressDownCallbackShiftPressed).build());

  keyPressDownCallbacks[BUTTON_SAVE_FILE].push(new KeyPressInfoBuilder(keyPressDownCallbackSaveFile).reqCtrl().addCheck(fileContentModalIsOpen).build());

  keyPressDownCallbacks[BUTTON_ARROW_DOWN].push(new KeyPressInfoBuilder(keyPressDownCallbackArrowDown).addCheck(screenIsMain).build());
  keyPressDownCallbacks[BUTTON_ARROW_UP].push(new KeyPressInfoBuilder(keyPressDownCallbackArrowUp).addCheck(screenIsMain).build());

  keyPressDownCallbacks[BUTTON_TAB].push(new KeyPressInfoBuilder(keyPressDownCallbackTab).addCheck(screenIsMain).build());
  keyPressDownCallbacks[BUTTON_ENTER].push(new KeyPressInfoBuilder(keyPressDownCallbackEnter).addCheck(screenIsMain).build());
  keyPressDownCallbacks[BUTTON_ENTER].push(new KeyPressInfoBuilder(keyPressDownCallbackEnterModal).addCheck(confirmModalIsOpen).build());
  keyPressDownCallbacks[BUTTON_ENTER].push(new KeyPressInfoBuilder(keyPressDownCallbackEnterModal).addCheck(inputModalIsOpen).build());
}

function initKeyPressUpCallbacks() {
  keyPressUpCallbacks[BUTTON_CTRL].push(new KeyPressInfoBuilder(keyPressUpCallbackControlReleased).build());
  keyPressUpCallbacks[BUTTON_SHIFT].push(new KeyPressInfoBuilder(keyPressUpCallbackShiftReleased).build());

  keyPressUpCallbacks[BUTTON_EXIT_EDIT_FILE].push(new KeyPressInfoBuilder(keyPressUpCallbackExitModal).addCheck(fileContentModalIsOpen).build());
  keyPressUpCallbacks[BUTTON_EXIT_EDIT_FILE].push(new KeyPressInfoBuilder(keyPressUpCallbackExitModal).addCheck(confirmModalIsOpen).build());
  keyPressUpCallbacks[BUTTON_EXIT_EDIT_FILE].push(new KeyPressInfoBuilder(keyPressUpCallbackExitModal).addCheck(inputModalIsOpen).build());

  keyPressUpCallbacks[BUTTON_EDIT_FILE].push(new KeyPressInfoBuilder(keyPressUpCallbackEditFile).addCheck(screenIsMain).build());
  keyPressUpCallbacks[BUTTON_CREATE_FILE].push(new KeyPressInfoBuilder(keyPressUpCallbackCreateFile).addCheck(screenIsMain).reqShift().build());

  keyPressUpCallbacks[BUTTON_COPY_FILES].push(new KeyPressInfoBuilder(keyPressUpCallbackCopyFiles).addCheck(screenIsMain).build());

  keyPressUpCallbacks[BUTTON_RENAME_FILE_FOLDER].push(new KeyPressInfoBuilder(keyPressUpCallbackRenameFileFolder).addCheck(screenIsMain).reqShift().build());
  keyPressUpCallbacks[BUTTON_MOVE_FILE_FOLDER].push(new KeyPressInfoBuilder(keyPressUpCallbackMoveFileFolder).addCheck(screenIsMain).build())

  keyPressUpCallbacks[BUTTON_CREATE_FOLDER].push(new KeyPressInfoBuilder(keyPressUpCallbackCreateFolder).addCheck(screenIsMain).build());
  keyPressUpCallbacks[BUTTON_DELETE_FILE_FOLDER].push(new KeyPressInfoBuilder(keyPressUpCallbackDeleteFileFolder).addCheck(screenIsMain).build());
}

window.onload = initApp();

window.onclick = function (event) {
  if (event.target == fileContentModal) {
    closeFileContentModal();
  } else if (event.target == confirmModal) {
    closeConfirmModal(false);
  } else if (event.target == inputModal) {
    closeInputModal(false);
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

  if (totalConditions != fulfilledConditions || !keyPressInfo.allChecksPass()) {
    return;
  }
  event.preventDefault();
  keyPressInfo.callback(event);
}

window.onkeydown = function (event) {
  if (event == null || event == undefined) {
    return;
  }
  for (var callbackInfo in keyPressDownCallbacks) {
    if (event.code.startsWith(callbackInfo)) {
      for (let i = 0; i < keyPressDownCallbacks[callbackInfo].length; ++i) {
        executeCallbackHandler(event, keyPressDownCallbacks[callbackInfo][i]);
      }
    }
  }
}

window.onkeyup = function (event) {
  if (event == null || event == undefined) {
    return;
  }
  for (var callbackInfo in keyPressUpCallbacks) {
    if (event.code.startsWith(callbackInfo)) {
      for (let i = 0; i < keyPressUpCallbacks[callbackInfo].length; ++i) {
        executeCallbackHandler(event, keyPressUpCallbacks[callbackInfo][i]);
      }
    }
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

function keyPressUpCallbackExitModal() {
  if (confirmModalIsOpen()) {
    closeConfirmModal(false);
    return;
  }
  if (inputModalIsOpen()) {
    closeInputModal(false);
    return;
  }
  if (fileContentModalIsOpen()) {
    closeFileContentModal();
    return;
  }
}

function keyPressUpCallbackCreateFile() {
  showInputModal('Create the file:', '', (confirmResult, fileName) => {
    if (!confirmResult) {
      return;
    }
    if (fileName.length == 0) {
      return;
    }
    let url = encodeURIComponent("/api/files/" + inputModalPanelIndex);
    httpPOST(url, {
      'file_name': fileName
    }, (res) => {
      // 
    }, (err) => {
      console.log(err);
    });
  });
}

function keyPressUpCallbackEditFile() {
  if (buttonShiftPressed) {
    return;
  }
  let id = activePanelElement.id;
  if (panelsObj[activePanelIndex][id].type == TYPE_FILE) {
    editFile(activePanelIndex, id);
  }
}

function keyPressUpCallbackMoveFileFolder() {
  if (buttonShiftPressed) {
    return;
  }
  console.log("MOVE");
}

function keyPressUpCallbackRenameFileFolder() {
  if (!buttonShiftPressed) {
    return;
  }
  let id = activePanelElement.id;
  let oldName = panelsObj[activePanelIndex][id].name;
  if (oldName === '..') {
    return;
  }
  let message = `<div>Enter the new name of the file:</div>`;
  showInputModal(message, panelsObj[activePanelIndex][id].name, (confirmResult, newFileName) => {
    if (!confirmResult) {
      return;
    }
    if (newFileName.length == 0 || oldName == newFileName) {
      return;
    }
    let url = encodeURIComponent("/api/rename_request/" + inputModalPanelIndex);
    httpPOST(url, {
      'old_name': oldName,
      'new_name': newFileName
    }, (result) => {
      console.log(result);
    }, (err) => {
      console.log(err);
    });
  });
}

function keyPressUpCallbackCreateFolder() {
  showInputModal('Create the folder:', '', (confirmResult, folderName) => {
    if (!confirmResult) {
      return;
    }
    if (folderName.length == 0) {
      return;
    }
    let url = encodeURIComponent("/api/dirs/" + inputModalPanelIndex);
    httpPOST(url, {
      'directory_name': folderName
    }, (res) => {
      // 
    }, (err) => {
      console.log(err);
    });
  });
}

function keyPressUpCallbackCopyFiles() {
  console.log("COPY");
}

function keyPressUpCallbackDeleteFileFolder() {
  let message = null;
  let deletedItems = [];
  if (activePanelSelectedFiles.length == 0) {
    let id = activePanelElement.id;
    if (panelsObj[activePanelIndex][id].name == '..') {
      return;
    }
    let fullPath = getCurrentDirectoryPathForPanel(activePanelIndex) + '\\' + panelsObj[activePanelIndex][id].name;
    message = `<div>Do you really want to delete the following file?</div><div>${fullPath}</div>`;
    deletedItems.push({
      'file_name': panelsObj[activePanelIndex][id].name
    });
  } else {
    message = `<div>Do you really want to delete the selected items?</div>`;
    for (let i = 0; i < activePanelSelectedFiles.length; ++i) {
      let fileName = panelsObj[activePanelIndex][activePanelSelectedFiles[i].id].name;
      deletedItems.push({
        'file_name': fileName
      });
    }
  }
  if (!message || deletedItems.length == 0) {
    return;
  }
  let url = encodeURIComponent("/api/delete_request/" + activePanelIndex);
  showConfirmModal(message, (result) => {
    if (result) {
      httpPOST(url, deletedItems,
        (result) => {
          console.log(result);
        }, (err) => {
          console.log(err);
        });
    }
  });
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

function keyPressDownCallbackEnterModal() {
  if (confirmModalIsOpen()) {
    closeConfirmModal(true);
    return;
  }
  if (inputModalIsOpen()) {
    closeInputModal(true);
    return;
  }
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
    'content': fileContentModalText.value
  }, (res) => {
    console.log(res);
  }, (err) => {
    console.log(err);
  });
}

function getCurrentDirectoryPathForPanel(panelIndex) {
  const objProperties = ['panel_left', 'panel_right'];
  const decodedToken = getDecodedPathsToken();
  return decodedToken[objProperties[panelIndex]];
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
    if (panelIndex != activePanelIndex) {
      return;
    }
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

function onButtonAction(type) {
  if (type == 'edit-create') {
    if (buttonShiftPressed) {
      keyPressUpCallbackCreateFile();
    } else {
      keyPressUpCallbackEditFile();
    }
  } else if (type == 'copy') {
    keyPressUpCallbackCopyFiles();
  } else if (type == 'rename-move') {
    if (!buttonShiftPressed) {
      keyPressUpCallbackMoveFileFolder();
    } else {
      keyPressUpCallbackRenameFileFolder();
    }
  } else if (type == 'create-folder') {
    keyPressUpCallbackCreateFolder();
  } else if (type == 'delete') {
    keyPressUpCallbackDeleteFileFolder();
  }
}
