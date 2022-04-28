
// imports & defines

const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const pkgName = require('./package.json')
console.log(pkgName.dependencies.solc)

// Functions
//

/**
 * Makes sure that the build folder is deleted, before every compilation
 * @returns {*} - Path where the compiled sources should be saved.
 */
function compilingPreperations() {
    const buildPath = path.resolve(__dirname, 'new-build');
    fs.removeSync(buildPath);
    return buildPath;
}
//
//
/**
 * Returns and Object describing what to compile and what need to be returned.
 */
function createConfiguration() {
    return {
        language: 'Solidity',
        sources: {
            'CandyCreator721ACloneFactory.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Factories', 'CandyCreator721ACloneFactory.sol'), 'utf8')
            },
            'Base/Token/CandyCreator721AUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Token', 'CandyCreator721AUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol'), 'utf8')
            },
            'Base/Royalties/CandyCollection2981RoyaltiesUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Royalties/CandyCollection2981RoyaltiesUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol'), 'utf8')
            },
            'Base/PaymentSplitter/CandyPaymentSplitterUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/PaymentSplitter/CandyPaymentSplitterUpgradeable.sol'), 'utf8')
            },
            'Base/Token/ERC721A/ERC721AUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Token/ERC721A/ERC721AUpgradeable.sol'), 'utf8')
            },
            'Base/Token/ERC721A/IERC721AUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Token/ERC721A/IERC721AUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol'), 'utf8')
            },
            '@openzeppelin/contracts/proxy/Clones.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts/proxy/Clones.sol'), 'utf8')
            }
        },
        settings: {
            metadata: { useLiteralContent: true },
            optimizer: {
                // disabled by default
                enabled: true,
                // Optimize for how many times you intend to run the code.
                // Lower values will optimize more for initial deployment cost, higher values will optimize more for high-frequency usage.
                runs: 200
            },
            outputSelection: { "*": { "*": ["*"], "": ["*"] } },
        }
    };
}



/**
 * Compiles the sources, defined in the config object with solc-js.
 * @param config - Configuration object.
 * @returns {any} - Object with compiled sources and errors object.
 */

// New syntax (supported from 0.5.12, mandatory from 0.6.0)

function compileSources(config) {
    try {
        return JSON.parse(solc.compile(JSON.stringify(config)));
    } catch (e) {
        console.log(e);
    }
}

/**
 * Shows when there were errors during compilation.
 * @param compiledSources
 */
function errorHandling(compiledSources) {
    if (!compiledSources) {
        console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n', 'NO OUTPUT');
    } else if (compiledSources.errors) { // something went wrong.
        console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n');
        compiledSources.errors.map(error => console.log(error.formattedMessage));
    }
}

/**
 * Writes the contracts from the compiled sources into JSON files, which you will later be able to
 * use in combination with web3.
 * @param compiled - Object containing the compiled contracts.
 * @param buildPath - Path of the build folder.
 */
function writeOutput(compiled, buildPath) {
    fs.ensureDirSync(buildPath);

    for (let contractFileName in compiled.contracts) {

        const contractName = contractFileName.replace('.sol', '');
        var short = ""


        short = contractFileName.split("/").reverse()[0].replace('.sol', '');



        //console.log(compiled.contracts[contractFileName])
        console.log('Writing: ', contractName + '.json');
        //console.log(compiled.contracts[contractFileName])
        //console.log(short)
        fs.outputJsonSync(
            path.resolve(buildPath, contractName + '.json'),
            compiled.contracts[contractFileName][short]
        );
        //console.log(compiled.contracts)
    }
}



// Workflow

const buildPath = compilingPreperations();


const config = createConfiguration();

console.log(config);

fs.outputJsonSync(
    path.resolve('./standard-input/', 'CandyCreator721ACloneFactory' + '.json'),
    config
);

const output = compileSources(config)
errorHandling(output)
console.log(output)
writeOutput(output, buildPath)
//const supertoken = output['contracts']['ERC721v2.1.2ETHColWLWith2981.sol']['ERC721v2ETHCollectionWhitelist']




