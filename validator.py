# Documentation:
# https://pynative.com/python-json-validation/

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

RENAME_FILE_DIRECTORY_SCHEMA = {
    "type": "object",
    "properties": {
        "old_name": {"type": "string"},
        "new_name": {"type": "string"}
    }
}

ARRAY_OF_ITEMS_SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "file_name": {"type": "string"}
        }
    }
}


class Validator:
    """ A class that incapsulates all the validation of the HTTP request bodies """

    def validate_json(self, schema, obj):
        """ Validates that a dictionary is of the given schema

        :param schema: The schema used to validate the dictionary
        :param obj: The dictionary to be validated (JSON object)
        :return: True if the dictionary is of the given schema, False otherwise
        :rtype: bool

        """
        try:
            jsonschema.validate(instance=obj, schema=schema)
        except:
            return False
        if 'properties' not in schema:
            return True
        for prop in schema['properties']:
            if prop not in obj:
                print(prop)
                return False
        return True

    def validate_update_file_req_body(self, req_body):
        """ Validates that the object is of type UPDATE_FILE_SCHEMA

        :param req_body: The object to be validated
        :return: True if the dictionary is of type UPDATE_FILE_SCHEMA, False otherwise
        :rtype: bool

        """
        return self.validate_json(UPDATE_FILE_SCHEMA, req_body)

    def validate_create_directory_req_body(self, req_body):
        """ Validates that the object is of type CREATE_DIRECTORY_SCHEMA

        :param req_body: The object to be validated
        :return: True if the dictionary is of type CREATE_DIRECTORY_SCHEMA, False otherwise
        :rtype: bool

        """
        return self.validate_json(CREATE_DIRECTORY_SCHEMA, req_body)

    def validate_create_file_req_body(self, req_body):
        """ Validates that the object is of type CREATE_DIRECTORY_SCHEMA

        :param req_body: The object to be validated
        :return: True if the dictionary is of type CREATE_DIRECTORY_SCHEMA, False otherwise
        :rtype: bool

        """
        return self.validate_json(CREATE_FILE_SCHEMA, req_body)

    def validate_rename_file_directory_req_body(self, req_body):
        """ Validates that the object is of type RENAME_FILE_DIRECTORY_SCHEMA

        :param req_body: The object to be validated
        :return: True if the dictionary is of type RENAME_FILE_DIRECTORY_SCHEMA, False otherwise
        :rtype: bool

        """
        return self.validate_json(RENAME_FILE_DIRECTORY_SCHEMA, req_body)

    def validate_delete_files_directories_req_body(self, req_body):
        """ Validates that the object is of type ARRAY_OF_ITEMS_SCHEMA

        :param req_body: The object to be validated
        :return: True if the dictionary is of type ARRAY_OF_ITEMS_SCHEMA, False otherwise
        :rtype: bool

        """
        return self.validate_json(ARRAY_OF_ITEMS_SCHEMA, req_body)

    def validate_move_files_directories_req_body(self, req_body):
        """ Validates that the object is of type ARRAY_OF_ITEMS_SCHEMA

        :param req_body: The object to be validated
        :return: True if the dictionary is of type ARRAY_OF_ITEMS_SCHEMA, False otherwise
        :rtype: bool

        """
        return self.validate_json(ARRAY_OF_ITEMS_SCHEMA, req_body)

    def validate_copy_files_directories_req_body(self, req_body):
        """ Validates that the object is of type ARRAY_OF_ITEMS_SCHEMA

        :param req_body: The object to be validated
        :return: True if the dictionary is of type ARRAY_OF_ITEMS_SCHEMA, False otherwise
        :rtype: bool

        """
        return self.validate_json(ARRAY_OF_ITEMS_SCHEMA, req_body)
