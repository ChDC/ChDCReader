import optparse
import re


def changePatternInFile(files, pattern, repl, flags=0):
    for file in files:
        with open(file, 'r', encoding="utf8") as fh:
            data = fh.read()

        data = re.sub(pattern, repl, data, flags)
        with open(file, 'w', encoding="utf8") as fh:
            fh.write(data)

    return True


def changeTextInFile(files, pattern, repl):
    for file in files:
        with open(file, 'r', encoding="utf8") as fh:
            data = fh.read()

        data = data.replace(pattern, repl)
        with open(file, 'w', encoding="utf8") as fh:
            fh.write(data)

    return True


envDict = {}


def env(function):
    envDict[function.__name__] = function
    return function


envConfig = {
    "product": {
        "addr": "back.exsupai.com:8080"
    },
    "dev": {
        "addr": "192.168.125.78:8080"
    },
    "test": {
        "addr": "42.202.146.85:8080"
    },
}


@env
def debug():
    print("Env: debug")
    changeTextInFile((r"config.xml", r"cordova-hcp.json",),
                     "\"https://raw.githubusercontent.com/ChDC/ChDCNovelReader/master/www/",
                     "\"https://raw.githubusercontent.com/ChDC/ChDCNovelReader/dev/www/",
                     )
    changeTextInFile((r"config.xml", ),
                     "\"com.chdc.novelreader\"",
                     "\"com.chdc.novelreader.debug\"",
                     )


@env
def release():
    print("Env: release")
    changeTextInFile((r"config.xml", r"cordova-hcp.json",),
                     "\"https://raw.githubusercontent.com/ChDC/ChDCNovelReader/dev/www/",
                     "\"https://raw.githubusercontent.com/ChDC/ChDCNovelReader/master/www/",
                     )
    changeTextInFile((r"config.xml", ),
                     "\"com.chdc.novelreader.debug\"",
                     "\"com.chdc.novelreader\"",
                     )


def main():

    parser = optparse.OptionParser()
    parser.add_option("-e", "--env", dest="env", help="set a environment name")
    parser.add_option("-d", "--dir", dest="dir",
                      help="set the root project dir")

    options, args = parser.parse_args()
    if options.env in envDict:
        envDict[options.env]()
    else:
        print("Undefined environment!")


if __name__ == "__main__":
    main()
