const core = require("@actions/core");
const fs = require("fs");
const axios = require('axios');

async function main() {
    try {
        let apiToken = core.getInput('dustico_token', {required: true});
        let packageJsonPath = core.getInput('package_json_path', {required: false});
        let requirementsTxtPath = core.getInput('requirements_txt_path', {required: false});
        let isDryRun = !!core.getInput('dry_run', {required: false});

        if (packageJsonPath) {
            let data = fs.readFileSync(packageJsonPath, 'utf8');
            data = JSON.parse(data);

            let response = await axios.post('https://api.dusti.co/v1/analysis/package.json', data, {headers: {'Authorization': apiToken}})

            if (response.data.malicious) {
                core.setFailed('package.json contain malicious package');

                if (!isDryRun) {
                    process.exit(1);
                }
            }
        }
        if (requirementsTxtPath) {
            let data = fs.readFileSync(requirementsTxtPath, 'utf8');
            let lines = data.split(/\r?\n/)

            let dependencies = {};
            lines.forEach((line) => {
                let parts = line.split('=');
                let packageName = parts[0];
                let packageVersion = parts[1] || '';
                dependencies[packageName] = packageVersion
            })

            data = {
                'dependencies': dependencies
            }

            let response = await axios.post('https://api.dusti.co/v1/analysis/requirements.txt', data, {headers: {'Authorization': apiToken}})

            if (response.data.malicious) {
                core.setFailed('requirements.txt contain malicious package');

                if (!isDryRun) {
                    process.exit(1);
                }
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
