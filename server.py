# Documentation:
# https://flask.palletsprojects.com/en/1.1.x/quickstart/#a-minimal-application
# https://flask-restplus.readthedocs.io/en/stable/errors.html

from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from flask import abort
from flask.helpers import make_response  # 400 Bad Request

import total_commander
import token_helper
import validator

PORT = 3333

app = Flask(__name__,
            static_folder='public',
            template_folder='public')

body_validator = validator.Validator()

HEADER_TOKEN_STR = 'x-panel-paths-token'


def add_token(obj, token):
  obj['token'] = token.decode("utf-8")
  return obj


def create_success_response(success, tot_comm, reload_panels=None):
  obj_res = {
      'success': success
  }
  if reload_panels is not None and type(reload_panels) is list:
    for reloaded_panel in reload_panels:
      prop_name = 'reloaded_panel_{}'.format(reloaded_panel)
      files = tot_comm.get_all(reloaded_panel)
      if files is False:
        continue
      obj_res[prop_name] = files
  return jsonify(add_token(obj_res, token_helper.encode_panels_total_commander(
      tot_comm
  )))


def create_error_message(message):
  return (jsonify({
      'error_message': message
  }), 400)


def validate_request(panel_index):
  if not (0 <= panel_index < 2):
    abort(make_response(create_error_message("Invalid panel index!"), 400))

  if not request.headers.get(HEADER_TOKEN_STR):
    abort(make_response(create_error_message(
        "Missing JWT token containing the of the two panels!"), 400))

  tot_comm = None
  token = token_helper.decode_panels_paths(
      request.headers.get(HEADER_TOKEN_STR))

  if token == -1:
    abort(make_response(create_error_message("Invalid JWT token!"), 400))

  tot_comm = total_commander.TotalCommander(token[0], token[1])

  if not tot_comm.init():
    abort(make_response(create_error_message("Invalid paths in JWT token!"), 400))

  return tot_comm


@app.route("/")
def index():
  return render_template("index.html")


@app.route("/api/all", methods=['GET'])
def get_all():
  tot_comm = None
  default = False
  if request.headers.get(HEADER_TOKEN_STR):
    res = token_helper.decode_panels_paths(
        request.headers.get(HEADER_TOKEN_STR))

    if res == -1 or res is None:
      default = True
    else:
      tot_comm = total_commander.TotalCommander(res[0], res[1])
  else:
    default = True

  if default:
    tot_comm = total_commander.TotalCommander(None, None, True)

  if not tot_comm.init():
    abort(make_response(create_error_message("Invalid paths in JWT token!"), 400))

  left = tot_comm.get_all(0)
  right = tot_comm.get_all(1)

  left_panel_res = {
      'dirs': left[0],
      'files': left[1]
  }
  right_panel_res = {
      'dirs': right[0],
      'files': right[1]
  }

  return jsonify(add_token({
      'left_panel': left_panel_res,
      'right_panel': right_panel_res
  }, token_helper.encode_panels_total_commander(
      tot_comm
  )))


@app.route("/api/dirs/<int:panel_index>/<string:dir_path>", methods=['GET'])
def get_dir_contents(panel_index, dir_path):
  tot_comm = validate_request(panel_index)

  if not tot_comm.change_dir(panel_index, dir_path):
    return create_error_message('Invalid directory path {} in panel {}'.format(dir_path, panel_index))

  panel_content = tot_comm.get_all(panel_index)
  panel_res = {
      'dirs': panel_content[0],
      'files': panel_content[1]
  }

  return jsonify(add_token({
      'dir_content': panel_res
  }, token_helper.encode_panels_total_commander(
      tot_comm
  )))


@app.route("/api/files/<int:panel_index>/<string:file_name>", methods=['GET'])
def get_file_content(panel_index, file_name):
  tot_comm = validate_request(panel_index)

  if not tot_comm.check_file_existence(panel_index, file_name):
    return create_error_message('Invalid file name {} in panel {}'.format(file_name, panel_index))

  file_content = tot_comm.get_file_content(panel_index, file_name)
  file_res = {
      'file_content': file_content
  }

  return jsonify(add_token(file_res, token_helper.encode_panels_total_commander(
      tot_comm
  )))


@app.route("/api/dirs/<int:panel_index>", methods=['POST'])
def create_dir(panel_index):
  tot_comm = validate_request(panel_index)

  if not body_validator.validate_create_directory_req_body(request.json):
    return create_error_message("The request body is missing the name of the directory!")

  dir_name = request.json['directory_name']
  if tot_comm.check_directory_existence(panel_index, dir_name):
    return create_error_message("A directory with name {} already exists!".format(dir_name))

  if not tot_comm.create_directory(panel_index, dir_name):
    return create_error_message('Creation of directory {} has failed!'.format(dir_name))

  return create_success_response('true', tot_comm, reload_panels=[panel_index])


@app.route("/api/files/<int:panel_index>", methods=['POST'])
def create_file(panel_index):
  tot_comm = validate_request(panel_index)

  if not body_validator.validate_create_file_req_body(request.json):
    return create_error_message("The request body is missing the name of the file!")

  file_name = request.json['file_name']
  if tot_comm.check_file_existence(panel_index, file_name):
    return create_error_message('A file with name {} already exists!'.format(file_name))

  if not tot_comm.create_file(panel_index, file_name):
    return create_error_message('Creation of file {} has failed!'.format(file_name))

  return create_success_response('true', tot_comm, reload_panels=[panel_index])


@app.route("/api/files/<int:panel_index>/<string:file_name>", methods=['PUT'])
def update_file(panel_index, file_name):
  tot_comm = validate_request(panel_index)

  if not body_validator.validate_update_file_req_body(request.json):
    return create_error_message('The request body is missing the new content of the {} file!'.format(file_name))

  # the file doesn't exist
  if not tot_comm.check_file_existence(panel_index, file_name):
    return create_error_message('Invalid file name {} in panel {}!'.format(file_name, panel_index))

  tot_comm.update_file_content(panel_index, file_name, request.json['content'])

  return create_success_response('true', tot_comm, reload_panels=[panel_index])


@app.route("/api/rename_request/<int:panel_index>", methods=['POST'])
def rename_file_directory(panel_index):
  tot_comm = validate_request(panel_index)

  if not body_validator.validate_rename_file_directory_req_body(request.json):
    return create_error_message("Invalid request body! old_name or new_name missing!")

  old_name = request.json['old_name']
  new_name = request.json['new_name']

  if tot_comm.check_file_existence(panel_index, old_name):
    if tot_comm.check_file_existence(panel_index, new_name):
      return create_error_message("Invalid new file name! \"{}\" already exists!".format(new_name))

    if not tot_comm.rename_file_directory(panel_index, old_name, new_name):
      return create_error_message("Failed to rename {} into {}".format(old_name, new_name))

  elif tot_comm.check_directory_existence(panel_index, old_name):
    if tot_comm.check_directory_existence(panel_index, new_name):
      return create_error_message("Invalid new directory name! \"{}\" already exists!".format(new_name))

    if not tot_comm.rename_file_directory(panel_index, old_name, new_name):
      return create_error_message("Failed to rename {} into {}".format(old_name, new_name))

  else:
    return create_error_message("Invalid old name {} in panel {}!".format(old_name, panel_index))

  return create_success_response('true', tot_comm, reload_panels=[panel_index])


if __name__ == "__main__":
  app.run(port=PORT, debug=True)
