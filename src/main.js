const core = require("@actions/core");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const http = require('http');
const childProcess = require('child_process');

const DUSTICO_CODE_ANALYZER_FILE_NAME = 'code-analyzer';
const DUSTICO_DIR_NAME = '.dustico';
const DUSTICO_BUCKET_NAME = 'dustico';
const DUSTICO_EXIT_CODE_FAIL_RUN = 4;

function downloadFile(url, filePath) {
    let command = `curl -o ${filePath}  '${url}'`;
    let result = childProcess.execSync(command);
}

async function runAnalyzer(filePath) {
    return new Promise((resolve, reject) => {
        let process = childProcess.spawn(filePath, {stdio: 'inherit'});
        process.on('exit', resolve);
    });
}

async function main() {
    try {
        let dusticoDirPath = path.resolve(__dirname, DUSTICO_DIR_NAME);
        const analyzerUrl = `https://${DUSTICO_BUCKET_NAME}.s3.amazonaws.com/${DUSTICO_CODE_ANALYZER_FILE_NAME}/${process.platform}`;
        let analyzerFilePath = path.resolve(dusticoDirPath, DUSTICO_CODE_ANALYZER_FILE_NAME);

        fsExtra.ensureDirSync(dusticoDirPath);
        try {
            downloadFile(analyzerUrl, analyzerFilePath)
            fs.chmodSync(analyzerFilePath, 0o777);
            let exitCode = await runAnalyzer(analyzerFilePath);
            if (exitCode === DUSTICO_EXIT_CODE_FAIL_RUN) {
                process.exit(1);
            }
        } finally {
            fsExtra.removeSync(dusticoDirPath);
        }
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
}

if (require.main === module) {
    main()
        .catch(e => {
            console.error(e);
        })
        .finally(() => process.exit(0));

}
