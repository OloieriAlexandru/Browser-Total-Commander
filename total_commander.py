# Documentation:
# https://www.w3resource.com/python-exercises/python-basic-exercise-64.php
# https://stackoverflow.com/questions/2860153/how-do-i-get-the-parent-directory-in-python/29137365
# https://stackoverflow.com/questions/1868714/how-do-i-copy-an-entire-directory-of-files-into-an-existing-directory-using-pyth
# https://stackoverflow.com/questions/8858008/how-to-move-a-file
# https://datatofish.com/rename-file-python/
# https://stackoverflow.com/questions/6996603/how-to-delete-a-file-or-folder

import os
import time
import pathlib
import shutil

DEFAULT_PATH = 'D:\\'


class TotalCommander:
    """ A class that incapsulates all the file system operations """

    def __init__(self, path_left, path_right, default=False):
        """ Initializes a TotalCommander object by creating a list with the paths
            for all panels (2 panels)

        :param path_left: The current directory for the left panel
        :param path_right: The current directory for the right panel
        :param default: Indicates whether to use path_left and path_right or to use
            the default path for both panels (this happens when the app is open for 
            the first time)

        """
        self.paths = []
        self.token = None
        if default:
            self.paths.append(DEFAULT_PATH)
            self.paths.append(DEFAULT_PATH)
        else:
            self.paths.append(path_left)
            self.paths.append(path_right)

    def set_token(self, token):
        """ Sets the JWT token associated with the object

        :param token: The JWT token
        :rtype: void

        """
        self.token = token

    def get_state_from_token(self):
        """ Returns the saved state from the token

        :return: A tuple containing the panel and the index of the element from the panel
        :rtype: tuple

        """
        if self.token is None or 'state_panel' not in self.token:
            return (0, 0)
        return (self.token['state_panel'], self.token['state_panel_element_index'])

    def valid_active_panel(self, active_panel):
        """ Checks if the parameter is a valid panel index

        :param active_panel: The index of the current panel
        :return: True if active_panel is a valid panel index, False otherwise
        :rtype: bool

        """
        return 0 <= active_panel < len(self.paths)

    def valid_paths(self):
        """ Checks if all the paths from the self.paths list are valid directories

        :return: True if all the paths are directories, False otherwise
        :rtype: bool

        """
        for p in self.paths:
            if not os.path.isdir(p):
                return False
        return True

    def init(self):
        """ The initialization logic for a TotalCommander object
            - currently only checking whether the paths are valid
        
        :return: True if the initialization was successful, False otherwise
        :rtype: bool

        """
        if not self.valid_paths():
            return False
        return True

    def change_dir(self, active_panel, ddir):
        """ Changes the path in the panel indicated by the first paramater

        :param active_panel: The panel in which to change the directory
        :param ddir: A subdirectory of the self.paths[active_panel] directory
        :return: True if the directory was successfully changed, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        new_path = os.path.normpath(
            os.path.join(self.paths[active_panel], ddir))
        if not os.path.isdir(new_path):
            return False
        self.paths[active_panel] = new_path
        return True

    def get_paths(self):
        """ Returns the directories of the panels as a tuple

        :return: A tuple containing the paths of the directories in the panels
        :rtype: tuple

        """
        return tuple(self.paths)

    def panels_same_directory(self, panel_1, panel_2):
        """ Checks if two panels have the same directory path

        :param panel_1: The first panel index
        :param panel_2: The second panel index
        :return: True if the panels indicated by the two indexes have the same directory path
        :type: bool

        """
        if not self.valid_active_panel(panel_1) or not self.valid_active_panel(panel_2):
            return False
        return self.paths[panel_1] == self.paths[panel_2]

    def check(self, callback, param):
        """ A helper method which executes a method passed as parameter

        :param callback: The method to be executed
        :param param: The parameter to be passed to the method
        :return: The result of the callback method
        
        """
        return callback(param)

    def check_existence(self, active_panel, name):
        """ Checks if the specified panel contains an item (file/directory)

        :param active_panel: The index of the panel
        :param name: The name of the item
        :return: True if the self.paths[active_panel] panel contains an
            item named {name}, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        item_path = os.path.join(self.paths[active_panel], name)
        return self.check(os.path.exists, item_path)

    def check_file_existence(self, active_panel, file_name):
        """ Checks if the specified panel contains a file

        :param active_panel: The index of the panel
        :param file_name: The name of the file
        :return: True if the self.paths[active_panel] panel contains a
            file named {file_name}, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        file_path = os.path.join(self.paths[active_panel], file_name)
        return self.check(os.path.isfile, file_path)

    def check_directory_existence(self, active_panel, directory_name):
        """ Checks if the specified panel contains a directory

        :param active_panel: The index of the panel
        :param file_name: The name of the directory
        :return: True if the self.paths[active_panel] panel contains a
            directory named {directory_name}, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        dir_path = os.path.join(self.paths[active_panel], directory_name)
        return self.check(os.path.isdir, dir_path)

    def get_file_content(self, active_panel, file_name):
        """ Returns the content of a file

        :param active_panel: The index of the panel in which the file is located
        :param file_name: The name of the file whose content is returned
        :return: A list of strings, the content of the file
        :rtype: list

        """
        if not self.valid_active_panel(active_panel):
            return False
        file_path = os.path.join(self.paths[active_panel], file_name)
        with open(file_path, "r") as file_in:
            return '\n'.join([el.strip() for el in file_in.readlines()])
        return []

    def update_file_content(self, active_panel, file_name, file_content):
        """ Updates hte content of a file

        :param active_panel: The index of the panel in which the file is located
        :param file_name: The name of the file whose content is updated
        :param file_content: A string, the new content of the file
        :rtype: void

        """
        if not self.valid_active_panel(active_panel):
            return False
        file_path = os.path.join(self.paths[active_panel], file_name)
        with open(file_path, "w") as file_out:
            file_out.write(file_content)

    def create_directory(self, active_panel, directory_name):
        """ Creates a new directory

        :param active_panel: The index of the panel in which the directory is created
        :param directory_name: The name of the created directory
        :return: True if the directory was created successfully
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        dir_path = os.path.join(self.paths[active_panel], directory_name)
        try:
            os.mkdir(dir_path)
        except:
            return False
        return True

    def create_file(self, active_panel, file_name):
        """ Creates a new file

        :param active_panel: The index of the panel in which the file is created
        :param directory_name: The name of the created file
        :return: True if the file was created successfully
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        file_path = os.path.join(self.paths[active_panel], file_name)
        try:
            open(file_path, 'a+').close()
        except:
            return False
        return True

    def rename_file_directory(self, active_panel, old_name, new_name):
        """ Renames an item (file/directory)

        :param active_panel: The index of the panel in which the files that's renamed is located
        :param old_name: The old name of the item
        :param new_name: The new name of the item
        :return: True if the item was renamed successfully, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        old_path = os.path.join(self.paths[active_panel], old_name)
        new_path = os.path.join(self.paths[active_panel], new_name)

        try:
            os.rename(old_path, new_path)
        except:
            return False
        return True

    def delete(self, callback, path):
        """ A helper method used when deleting an item (file/directory)

        :param callback: The method used for deleting the item
        :param path: The path of the items that's being deleted
        :return: True if the item was deleted successfully, False otherwise
        :rtype: bool

        """
        try:
            callback(path)
        except:
            return False
        return True

    def delete_file(self, active_panel, file_name):
        """ Deletes a file from a panel

        :param active_panel: The panel from which the file is deleted 
        :param file_name: The name of the file
        :return: True if the file was deleted successfully, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(active_panel):
            return False
        return self.delete(os.remove, os.path.join(self.paths[active_panel], file_name))

    def delete_directory(self, active_panel, directory_name):
        """ Deletes a directory from a panel

        :param active_panel: The panel from which the directory is deleted 
        :param directory_name: The name of the directory
        :return: True if the directory was deleted successfully, False otherwise
        :rtype: bool

        """
        if directory_name == '.' or directory_name == '..' or not self.valid_active_panel(active_panel):
            return False
        return self.delete(shutil.rmtree, os.path.join(self.paths[active_panel], directory_name))

    def move_copy(self, source_panel, target_panel, item_name, callback):
        """ A helper method used for copying/moving an item
            This method was implemented to avoid writing duplicate code.
            The callback can be one of the following: [shutil.move, shutil.copy2, shutil.copytree]

        :param source_panel: The panel from which the item is moved/copied
        :param target_panel: The panel to which the item is moved/copied
        :param item_name: The name of the item
        :param callback: The method used for copying/moving the item
        :return: True if the operation was successful, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(source_panel) or not self.valid_active_panel(target_panel):
            return False
        source_path = os.path.join(self.paths[source_panel], item_name)
        target_path = os.path.join(self.paths[target_panel], item_name)

        try:
            callback(source_path, target_path)
        except:
            return False
        return True

    def move(self, source_panel, target_panel, item_name):
        """ Moves a file from a panel to another

        :param source_panel: The panel from which the file is moved
        :param target_panel: The panel to which the file is moved
        :return: True if the operation was successful, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(source_panel) or not self.valid_active_panel(target_panel):
            return False
        return self.move_copy(source_panel, target_panel, item_name, shutil.move)

    def copy_file(self, source_panel, target_panel, item_name):
        """ Copies a file from a panel to another

        :param source_panel: The panel from which the file is copies
        :param target_panel: The panel to which the file is copied
        :return: True if the operation was successful, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(source_panel) or not self.valid_active_panel(target_panel):
            return False
        return self.move_copy(source_panel, target_panel, item_name, shutil.copy2)

    def copy_dir(self, source_panel, target_panel, item_name):
        """ Copies a directory from a panel to another

        :param source_panel: The panel from which the directory is copies
        :param target_panel: The panel to which the directory is copied
        :return: True if the operation was successful, False otherwise
        :rtype: bool

        """
        if not self.valid_active_panel(source_panel) or not self.valid_active_panel(target_panel):
            return False
        return self.move_copy(source_panel, target_panel, item_name, shutil.copytree)

    def get_all(self, active_panel):
        """ Returns all the files and directories in a panel

        :param active_panel: The index of the panel for which the files and directories will be returned
        :return: A tuple of lists: the directories and files in the self.paths[active_panel] directory
        :rtype: tuple

        """
        if not self.valid_active_panel(active_panel):
            return False

        parent_path = pathlib.Path(self.paths[active_panel])

        directories = []
        files = []

        directories.append({
            'name': '..',
            'created_date': time.ctime(os.path.getctime(parent_path.parent))
        })

        for f in os.listdir(self.paths[active_panel]):
            full_path = os.path.join(self.paths[active_panel], f)
            if os.path.isdir(full_path):
                directories.append({
                    'name': f,
                    'created_date':  time.ctime(os.path.getctime(full_path))
                })
            else:
                files.append({
                    'name': f,
                    'size': os.path.getsize(full_path),
                    'created_date':  time.ctime(os.path.getctime(full_path))
                })

        return (directories, files)
