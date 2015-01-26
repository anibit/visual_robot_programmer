#This is a script to package all the requisite files to run on a webserver
#it optimizes the files and zips the into a deployment package.
#This file requires Python 3.4+
# and Java 1.6 +
#it also requires the yuicompressor and htmlcompressor java binaries, not included with the source.

import shutil
import os
import json
import subprocess
import datetime
import zipfile

target_folder = "./deploy"

#replace this with your actual path to java
java_exe = "\"C:\\Program Files\\Java\\jre1.8.0_20\\bin\\java.exe\""

def minify_js(source, target):
    command = java_exe + " -jar yuicompressor-2.4.8.jar -o mintemp.js" + " " + source
    print (command)
    result = subprocess.check_output( command)
    shutil.move("mintemp.js", target)
    print(result)
     
def minify_css(source, target):
    command = java_exe + " -jar yuicompressor-2.4.8.jar -o mintemp.css" + " " + source
    print (command)
    result = subprocess.check_output( command)
    shutil.move("mintemp.css", target)
    print(result)
    
def minify_html(source, target):
    command = java_exe + " -jar htmlcompressor-1.5.3.jar --compress-js --compress-css -o mintemp.html " + " " + source
    print (command)
    result = subprocess.check_output( command)
    shutil.move("mintemp.html", target)
    print(result)


def deploy_file(target_folder, source_root, file_object):
    is_object = not isinstance(file_object, str)
    filename = file_object if not is_object else file_object["name"]
    path, extension = os.path.splitext( filename)
    enable_minify = (not is_object) or (not "raw" in file_object) or not file_object["raw"]
    #handle certain extensions specifically
    extension = extension.lower()

    abs_source = os.path.abspath(os.path.join(source_root, filename))

    abs_target = os.path.abspath(os.path.join(target_folder, filename))

    target_dir = os.path.dirname(abs_target)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    if extension == ".js":
        if enable_minify:
            minify_js(abs_source, abs_target)
        else:
            shutil.copyfile(abs_source, abs_target)
    elif extension == ".html":
        if enable_minify:
            minify_html(abs_source, abs_target)
        else:
            shutil.copyfile(abs_source, abs_target)
    elif extension == ".css":
        if enable_minify:
            minify_css(abs_source, abs_target)
        else:
            shutil.copyfile(abs_source, abs_target)
    else:
        shutil.copyfile(abs_source, abs_target)


def read_build():
    build_path = os.path.abspath("build.json")
    with open(build_path) as f:
        json_data = json.load(f)
        return json_data

def stage_deployment_files(build_data):
    #clear target
    abs_target = os.path.abspath(target_folder)
    shutil.rmtree(abs_target, ignore_errors = True)


    #wait until the directory is actually gone... hack!
    hack_counter = 0
    quit = False
    while hack_counter < 1000 and not quit:
        try:
            os.makedirs(abs_target, True)
            quit = True
        except:
            hack_counter += 1



    source_root = build_data["source_root"]
    abs_source = os.path.abspath(source_root)
    for file in build_data["files"]:
        deploy_file(abs_target, abs_source, file)
 
def touch_node_manifest(build_data):
    abs_target = os.path.abspath(target_folder)
    target_manifest_filename = os.path.join(abs_target, build_data["cache_manifest"])
    with open(target_manifest_filename, "r+t") as f:
        lines = f.readlines()

    stampIndex = next((index for index, item in enumerate(lines) if item.startswith("#cachestamp")), -1)
    if stampIndex != -1:
        lines[stampIndex] = "#cachestamp %s" %  str(datetime.datetime.utcnow())

        with open(target_manifest_filename, "w+t") as f:
            f.writelines(lines)
 


def zip_deployment_files(build_data):
    abs_target = os.path.abspath(target_folder)
    zip_target = os.path.join(abs_target, "3piBlockly_deployment.zip")
    filenames = [(x if isinstance(x, str) else x["name"]) for x in build_data["files"]]
    with zipfile.ZipFile( zip_target, 'w', zipfile.ZIP_DEFLATED, True) as z:
        for file in filenames:
            abs_file = os.path.join(abs_target, file)
            z.write(abs_file, file)


if __name__ == "__main__":
    build_data = read_build()
    stage_deployment_files(build_data)
    touch_node_manifest(build_data);
    zip_deployment_files(build_data)
    