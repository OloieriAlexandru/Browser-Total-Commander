import os

DEFAULT_PATH = 'D:\\'

class TotalCommander:
    def __init__(self, path_left, path_right, default = False):
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

    def get_paths(self):
        return (self.paths[0], self.paths[1])

    def get_all(self, active_panel):
        if not self.valid_active_panel(active_panel):
            return False
        
        directories = []
        files = []

        for f in os.listdir(self.paths[active_panel]):
            full_path = os.path.join(self.paths[active_panel], f)
            if os.path.isdir(full_path):
                directories.append(f)
            else:
                files.append(f)

        return (directories, files)
