# Documentation:
# https://pyjwt.readthedocs.io/en/stable/

import jwt

JWT_SECRET = '4ccc8529b6fa1e21b3b4f008e71219aa3c80b4d381f9408c64a73bb649806ed6'


def encode_panels_total_commander(tot_comm):
    """ Returns an encoded JWT token containing the paths for the directories of a TotalCommander object

    :param tot_com: A TotalCommander object
    :return: A JWT token
    :rtype: byte[]

    """
    paths = tot_comm.get_paths()
    return encode_panels_paths(paths[0], paths[1])


def encode_panels_paths(panel_left, panel_right):
    """ Encodes an object having the two panel paths as properties

    :param panel_left: The path of the left panel
    :param panel_rigth: The path of the right panel
    :return: A JWT token
    :rtype: byte[]

    """
    obj = {
        'panel_left': panel_left,
        'panel_right': panel_right
    }
    return jwt.encode(obj, JWT_SECRET, algorithm='HS256')


def decode_panels_paths(jwt_token):
    """ Decodes a JWT token

    :param jwt_token: The JWT token that should be decoded
    :return: -1 if the JWT token is invalid, A tuple containing the two paths from the token otherwise
    :rtype: int or tuple

    """
    try:
        obj = jwt.decode(str.encode(jwt_token),
                         JWT_SECRET, algorithms=['HS256'])
    except:
        return -1
    return (obj['panel_left'], obj['panel_right'])
