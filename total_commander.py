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
    def __init__(self, path_left, path_right, default=False):
        self.paths = []
        if default:
            self.paths.append(DEFAULT_PATH)
            self.paths.append(DEFAULT_PATH)
        else:
            self.paths.append(path_left)
            self.paths.append(path_right)

    def valid_active_panel(self, active_panel):
        return 0 <= active_panel < len(self.paths)

    def valid_paths(self):
        for p in self.paths:
            if not os.path.isdir(p):
                return False
        return True

    def init(self):
        if not self.valid_paths():
            return False
        return True

    def change_dir(self, active_panel, ddir):
        new_path = os.path.normpath(
            os.path.join(self.paths[active_panel], ddir))
        if not os.path.isdir(new_path):
            return False
        self.paths[active_panel] = new_path
        return True

    def get_paths(self):
        return (self.paths[0], self.paths[1])

    def panels_same_directory(self, panel_1, panel_2):
        return self.paths[panel_1] == self.paths[panel_2]

    def check(self, callback, param):
        if not callback(param):
            return False
        return True

    def check_existence(self, active_panel, name):
        item_path = os.path.join(self.paths[active_panel], name)
        return self.check(os.path.exists, item_path)

    def check_file_existence(self, active_panel, file_name):
        file_path = os.path.join(self.paths[active_panel], file_name)
        return self.check(os.path.isfile, file_path)

    def check_directory_existence(self, active_panel, directory_name):
        dir_path = os.path.join(self.paths[active_panel], directory_name)
        return self.check(os.path.isdir, dir_path)

    def get_file_content(self, active_panel, file_name):
        file_path = os.path.join(self.paths[active_panel], file_name)
        with open(file_path, "r") as file_in:
            return '\n'.join([el.strip() for el in file_in.readlines()])
        return []

    def update_file_content(self, active_panel, file_name, file_content):
        file_path = os.path.join(self.paths[active_panel], file_name)
        with open(file_path, "w") as file_out:
            file_out.write(file_content)

    def create_directory(self, active_panel, directory_name):
        dir_path = os.path.join(self.paths[active_panel], directory_name)
        try:
            os.mkdir(dir_path)
        except:
            return False
        return True

    def create_file(self, active_panel, file_name):
        file_path = os.path.join(self.paths[active_panel], file_name)
        try:
            open(file_path, 'a+').close()
        except:
            return False
        return True

    def rename_file_directory(self, active_panel, old_name, new_name):
        old_path = os.path.join(self.paths[active_panel], old_name)
        new_path = os.path.join(self.paths[active_panel], new_name)

        try:
            os.rename(old_path, new_path)
        except:
            return False
        return True

    def delete(self, callback, path):
        try:
            callback(path)
        except:
            return False
        return True

    def delete_file(self, active_panel, file_name):
        return self.delete(os.remove, os.path.join(self.paths[active_panel], file_name))

    def delete_directory(self, active_panel, directory_name):
        if directory_name == '.' or directory_name == '..':
            return False
        return self.delete(shutil.rmtree, os.path.join(self.paths[active_panel], directory_name))

    def move_copy(self, source_panel, target_panel, item_name, callback):
        source_path = os.path.join(self.paths[source_panel], item_name)
        target_path = os.path.join(self.paths[target_panel], item_name)

        try:
            callback(source_path, target_path)
        except:
            return False
        return True

    def move(self, source_panel, target_panel, item_name):
        return self.move_copy(source_panel, target_panel, item_name, shutil.move)

    def copy_file(self, source_panel, target_panel, item_name):
        return self.move_copy(source_panel, target_panel, item_name, shutil.copy2)

    def copy_dir(self, source_panel, target_panel, item_name):
        return self.move_copy(source_panel, target_panel, item_name, shutil.copytree)

    def get_all(self, active_panel):
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
