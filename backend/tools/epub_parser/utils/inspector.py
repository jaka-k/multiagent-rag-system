import zipfile

def inspect_epub(file_path):
    with zipfile.ZipFile(file_path, 'r') as zip_ref:
        file_list = zip_ref.namelist()
        for file_name in file_list:
            # TODO: 📟 log folder structure before parsing
            print(file_name)

def find_toc_file(zip_ref):
    toc_files = []
    for file_name in zip_ref.namelist():
        if 'toc' in file_name.lower() and (file_name.endswith('.html') or file_name.endswith('.xhtml') or file_name.endswith('.htm') or file_name.endswith('.ncx')):
            toc_files.append(file_name)
    return toc_files