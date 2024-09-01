import getpass
import os
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
if project_root not in sys.path:
    sys.path.append(project_root)

def set_key_if_undefined(var: str):
    if not os.environ.get(var):
        os.environ[var] = getpass.getpass(f"Please provide your {var}: ")

def get_environment_variable(var: str):
    if not os.environ.get(var):
        set_key_if_undefined(var)
    return os.environ.get(var)