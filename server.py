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
    """ Adds a new key (a JWT token) to a dictionary object

    :param obj: The object to which the token is added
    :param token: The JWT token to be added to the dictionary
    :return: The modified {obj} dictionary
    :rtype: dictionary

    """
    obj['token'] = token.decode("utf-8")
    return obj


def create_success_response(success, tot_comm: total_commander.TotalCommander, reload_panels=None, **kwargs):
    """ Creates a HTTP response that's supposed to be returned to the client who initiated the request

    :param success: A boolean flag indicating whether the request was successful or not
    :param tot_comm: A TotalCommander object with up to date panels
    :param reload_panels: The panels for which the directories and files should be reloaded by the client
    :params kwargs: Any other properties to be added to the final JSON
    :return: A flask.Response object that has the appropiate content-type header (application/json)
    :rtype: flask.Response

    """
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
    for key in kwargs:
        obj_res[key] = kwargs[key]
    return jsonify(add_token(obj_res, token_helper.encode_panels_total_commander(
        tot_comm
    )))


def create_error_message(message):
    """ Creates a HTTP Bad Request response that's
        supposed to be returned to the client who initiated the request

    :param message: The error message to be returned to the client who initiated the request    
    :return: A tuple containig a flask.Response object and a HTTP error code
    :rtype: tuple

    """
    return (jsonify({
        'error_message': message
    }), 400)


def validate_request(panel_index):
    """ Validates parameters of the current HTTP request.
        The following checks are performed:
        - The index of the panel where the operation is performed is valid
        - The HTTP request has a header containing a JWT token
        - The JWT token from the header is valid
        - The paths in the JWT tokens are valid directories

    :param panel_index: The index of the panel in which the operation is performed
    :return: A TotalCommander object containing as paths the paths in the JWT token
    :rtype: TotalCommander

    """
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
        abort(make_response(create_error_message(
            "Invalid paths in JWT token!"), 400))

    return tot_comm


@app.route("/")
def index():
    """ Returns the index.html file """
    return render_template("index.html")


@app.route("/api/all", methods=['GET'])
def get_all():
    """ Returns the contents of both panels
        If the HTTP request doesn't have a JWT attached as a header, the default
        path will be used for both panels, otherwise the panels from the JWT will be used

    :return: a flask.Response object, having a JSON containing the contents of the panels as body
    :rtype: flask.Response

    """
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
        abort(make_response(create_error_message(
            "Invalid paths in JWT token!"), 400))

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
    """ Returns the contents of a directory

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel in which the operation is supposed to be executed
    :param dir_path: An argument extracted from the HTTP Request URL specifying
        the name of the directory whose contents is to be returned
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
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
    """ Returns the content of a file

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel in which the operation is supposed to be executed
    :param file_name: An argument extracted from the HTTP Request URL specifying
        the name of the file whose content is to be returned
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
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
    """ Creates a new directory
        The body of the request has to be of type validator.CREATE_DIRECTORY_SCHEMA

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel in which the operation is supposed to be executed
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
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
    """ Creates a new file
        The body of the request has to be of type validator.CREATE_FILE_SCHEMA

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel in which the operation is supposed to be executed
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
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
    """ Updates the content of a file
        The body of the request has to be of type validator.UPDATE_FILE_SCHEMA

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel in which the operation is supposed to be executed
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
    tot_comm = validate_request(panel_index)

    if not body_validator.validate_update_file_req_body(request.json):
        return create_error_message('The request body is missing the new content of the {} file!'.format(file_name))

    # the file doesn't exist
    if not tot_comm.check_file_existence(panel_index, file_name):
        return create_error_message('Invalid file name {} in panel {}!'.format(file_name, panel_index))

    tot_comm.update_file_content(
        panel_index, file_name, request.json['content'])

    return create_success_response('true', tot_comm, reload_panels=[panel_index])


@app.route("/api/rename_request/<int:panel_index>", methods=['POST'])
def rename_file_directory(panel_index):
    """ Renames a file or a directory
        The body of the request has to be of type validator.RENAME_FILE_DIRECTORY_SCHEMA

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel in which the operation is supposed to be executed
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
    tot_comm = validate_request(panel_index)

    if not body_validator.validate_rename_file_directory_req_body(request.json):
        return create_error_message("Invalid request body! old_name or new_name missing!")

    old_name = request.json['old_name']
    new_name = request.json['new_name']

    if tot_comm.check_file_existence(panel_index, old_name):
        if tot_comm.check_existence(panel_index, new_name):
            return create_error_message("Invalid new file name! \"{}\" already exists!".format(new_name))

        if not tot_comm.rename_file_directory(panel_index, old_name, new_name):
            return create_error_message("Failed to rename {} into {}".format(old_name, new_name))

    elif tot_comm.check_directory_existence(panel_index, old_name):
        if tot_comm.check_existence(panel_index, new_name):
            return create_error_message("Invalid new directory name! \"{}\" already exists!".format(new_name))

        if not tot_comm.rename_file_directory(panel_index, old_name, new_name):
            return create_error_message("Failed to rename {} into {}".format(old_name, new_name))

    else:
        return create_error_message("Invalid old name {} in panel {}!".format(old_name, panel_index))

    return create_success_response('true', tot_comm, reload_panels=[panel_index])


@app.route("/api/delete_request/<int:panel_index>", methods=['POST'])
def delete_files_directories(panel_index):
    """ Deletes a list of items (files and directories) from a panel
        The body of the request has to be of type validator.ARRAY_OF_ITEMS_SCHEMA

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel in which the operation is supposed to be executed
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
    tot_comm = validate_request(panel_index)

    if not body_validator.validate_delete_files_directories_req_body(request.json):
        return create_error_message("Invalid request body! Expecting an array of items to delete!")

    items = request.json
    failed = []

    for item in items:
        item_name = item['file_name']
        if tot_comm.check_file_existence(panel_index, item_name):
            if not tot_comm.delete_file(panel_index, item_name):
                failed.append(item_name)
        elif tot_comm.check_directory_existence(panel_index, item_name):
            if not tot_comm.delete_directory(panel_index, item_name):
                failed.append(item_name)
        else:
            failed.append(item_name)

    panels_to_reload = [panel_index]
    if tot_comm.panels_same_directory(panel_index, 1 - panel_index):
        panels_to_reload.append(1 - panel_index)

    return create_success_response('true', tot_comm, reload_panels=panels_to_reload, failed_items=failed)


def handle_move_copy_requests(panel_index, tot_comm: total_commander.TotalCommander, callback_file, callback_dir):
    """ A helper method used for copying/moving a list of items from a panel to the other one

    :param panel_index: The index of the panel from which the items are copied/moved
    :param tot_comm: A TotalCommander object on which the operations are being performed
    :param callback_file: The callback used for an item that's a normal file
    :param callback_dir: The callback used for an item that's a directory
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
    items = request.json
    failed = []
    other_index = 1 - panel_index

    for item in items:
        item_name = item['file_name']
        if tot_comm.check_file_existence(panel_index, item_name):
            if tot_comm.check_existence(other_index, item_name):
                failed.append(item_name)
            else:
                if not callback_file(panel_index, other_index, item_name):
                    failed.append(item_name)
        elif tot_comm.check_directory_existence(panel_index, item_name):
            if tot_comm.check_existence(other_index, item_name):
                failed.append(item_name)
            else:
                if not callback_dir(panel_index, other_index, item_name):
                    failed.append(item_name)
        else:
            failed.append(item_name)

    return create_success_response('true', tot_comm, reload_panels=[panel_index, other_index], failed_items=failed)


@app.route("/api/move_request/<int:panel_index>", methods=['POST'])
def move_files_directories(panel_index):
    """ Moves a list of items (files and directories) from a panel to the other one
        The body of the request has to be of type validator.ARRAY_OF_ITEMS_SCHEMA

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel from which the files are supposed to be moved
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
    tot_comm = validate_request(panel_index)

    if not body_validator.validate_move_files_directories_req_body(request.json):
        return create_error_message("Invalid request body! Expecting an array of items to move!")

    return handle_move_copy_requests(panel_index, tot_comm, tot_comm.move, tot_comm.move)


@app.route("/api/copy_request/<int:panel_index>", methods=['POST'])
def copy_files_directories(panel_index):
    """ Copies a list of items (files and directories) from a panel to the other one
        The body of the request has to be of type validator.ARRAY_OF_ITEMS_SCHEMA

    :param panel_index: An argument extracted from the HTTP Request URL indicating
        the panel from which the files are supposed to be copied
    :return: A flask.Response object, having a JSON object as body
    :rtype: flask.Response

    """
    tot_comm = validate_request(panel_index)

    if not body_validator.validate_copy_files_directories_req_body(request.json):
        return create_error_message("Invalid request body! Expecting an array of items to copy!")

    return handle_move_copy_requests(panel_index, tot_comm, tot_comm.copy_file, tot_comm.copy_dir)


if __name__ == "__main__":
    app.run(port=PORT, debug=True)
