"""旧入口，等同 python3 scripts/film-prep.py everest <素材目录> [镜头号…]"""
import os, sys, subprocess
sys.exit(subprocess.call([sys.executable, os.path.join(os.path.dirname(__file__), 'film-prep.py'), 'everest', *sys.argv[1:]]))
