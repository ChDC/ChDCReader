import os
import logging
from multiprocessing.dummy import Pool


logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger()


def replaceCRLFtoLF(wwwDir):
    def replace(file):
        try:
            with open(file, encoding='utf8', newline='\r\n') as fh:
                data = fh.read()
            if '\r\n' in data:
                data = data.replace('\r\n', '\n')
                with open(file, 'w', encoding='utf8', newline='\n') as fh:
                    fh.write(data)
                log.info('Replaced: %s' % file)
        except Exception as ignore:
            log.error('Error in file: %s' % file)

    pool = Pool(4)
    fileSet = []
    for root, dirs, files in os.walk(wwwDir):
        for file in files:
            if os.path.splitext(file)[1] not in (
                '.js', '.html', '.css', '.json', '.map', '.svg'
            ):
                continue
            file = os.path.join(root, file)
            fileSet.append(file)
    pool.map(replace, fileSet)
    log.info('Success to Replace file for Github!')


def main():
    import optparse
    parser = optparse.OptionParser()
    parser.add_option('-d', '--dir')

    opt, args = parser.parse_args()

    if not opt.dir:
        parser.print_help()
        return

    if not os.path.exists(opt.dir):
        log.error('dir doesn\'t exist!')
        return

    replaceCRLFtoLF(opt.dir)


if __name__ == "__main__":
    main()
