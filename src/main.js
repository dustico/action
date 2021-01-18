const core = require("@actions/core");
const fs = require("fs");
const axios = require('axios');

async function main() {
    try {
        let apiToken = core.getInput('dustico_token', {required: true});
        let packageJsonPath = core.getInput('package_json_path', {required: true});
        let isDryRun = !!core.getInput('dry_run', {required: false});

        let data = fs.readFileSync(packageJsonPath, 'utf8');
        data = JSON.parse(data);

        let response = await axios.post('https://api.dusti.co/v1/analysis/package.json', data, {headers: {'Authorization': apiToken}})

        if (response.data.malicious) {
            console.warn('package.json contain malicious package')

            if (!isDryRun) {
                core.setFailed('package.json contain malicious package');
            }
        }
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}
