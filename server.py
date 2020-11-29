# Documentation:
# https://flask.palletsprojects.com/en/1.1.x/quickstart/#a-minimal-application

from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify

import total_commander
import token_helper

PORT = 3333

app = Flask(__name__,
            static_folder='public',
            template_folder='public')


def add_token(obj, token):
  obj['token'] = token.decode("utf-8")
  return obj


@app.route("/")
def index():
  return render_template("index.html")


@app.route("/api/all", methods=['GET'])
def get_all():
  tot_comm = None
  if request.headers.get('x-panel-paths-token'):
    res = token_helper.decode_panels_paths(
        request.headers.get('x-panel-paths-token'))
    if res is None:
      return {}
    tot_comm = total_commander.TotalCommander(res[0], res[1])
  else:
    tot_comm = total_commander.TotalCommander(None, None, True)

  if not tot_comm.init():
    return {}

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


@app.route("/api/files", methods=['POST'])
def create_file():
  pass


@app.route("/api/files/<file_path>", methods=['PUT'])
def update_file(file_path):
  pass


if __name__ == "__main__":
  app.run(port=PORT, debug=True)
