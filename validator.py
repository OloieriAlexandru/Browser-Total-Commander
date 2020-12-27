# Documentation:
# https://pynative.com/python-json-validation/

import json
import jsonschema


UPDATE_FILE_SCHEMA = {
    "type": "object",
    "properties": {
        "content": {"type": "string"}
    }
}

CREATE_DIRECTORY_SCHEMA = {
    "type": "object",
    "properties": {
        "directory_name": {"type": "string"}
    }
}

CREATE_FILE_SCHEMA = {
    "type": "object",
    "properties": {
        "file_name": {"type": "string"}
    }
}


class Validator:
    def __init__(self):
        pass

    def validate_json(self, schema, obj):
        try:
            jsonschema.validate(instance=obj, schema=schema)
        except:
            return False
        for prop in schema['properties']:
            if prop not in obj:
                print(prop)
                return False
        return True

    def validate_update_file_req_body(self, req_body):
        return self.validate_json(UPDATE_FILE_SCHEMA, req_body)

    def validate_create_directory_req_body(self, req_body):
        return self.validate_json(CREATE_DIRECTORY_SCHEMA, req_body)

    def validate_create_file_req_body(self, req_body):
        return self.validate_json(CREATE_FILE_SCHEMA, req_body)
