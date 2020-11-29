# Documentation:
# https://pyjwt.readthedocs.io/en/stable/

import jwt

JWT_SECRET = '4ccc8529b6fa1e21b3b4f008e71219aa3c80b4d381f9408c64a73bb649806ed6'

def encode_panels_total_commander(tot_comm):
    paths = tot_comm.get_paths()
    return encode_panels_paths(paths[0], paths[1])

def encode_panels_paths(panel_left, panel_right):
    obj = {
        'panel_left': panel_left,
        'panel_right': panel_right
    }
    return jwt.encode(obj, JWT_SECRET, algorithm='HS256')


def decode_panels_paths(jwt_token):
    obj = jwt.decode(str.encode(jwt_token), JWT_SECRET, algorithms=['HS256'])
    if obj is not None:
        return (obj['panel_left'], obj['panel_right'])
    return None
