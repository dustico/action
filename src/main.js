const core = require("@actions/core");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const axios = require('axios');
const childProcess = require('child_process');

const DUSTICO_CODE_ANALYZER_FILE_NAME = 'code-analyzer';
const DUSTICO_DIR_NAME = '.dustico';
const DUSTICO_BUCKET_NAME = 'dustico';
const DUSTICO_EXIT_CODE_FAIL_RUN = 4;

async function downloadFile(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        timeout: 10000,
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    });
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
            await downloadFile(analyzerUrl, analyzerFilePath)
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
