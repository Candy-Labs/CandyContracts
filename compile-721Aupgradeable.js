
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
            'CandyCreator721AUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Token', 'CandyCreator721AUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol'), 'utf8')
            },
            'Royalties/CandyCollection2981RoyaltiesUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Royalties/CandyCollection2981RoyaltiesUpgradeable.sol'), 'utf8')
            },
            '@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol': {
                content: fs.readFileSync(path.resolve('node_modules', '@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol'), 'utf8')
            },
            'PaymentSplitter/CandyPaymentSplitterUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/PaymentSplitter/CandyPaymentSplitterUpgradeable.sol'), 'utf8')
            },
            'ERC721A/ERC721AUpgradeable.sol': {
                content: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Token/ERC721A/ERC721AUpgradeable.sol'), 'utf8')
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
 * Searches for dependencies in the Solidity files (import statements). All import Solidity files
 * need to be declared here.
 * @param dependency
 * @returns {*}
 */


function getImports(dependency) {
    console.log('Searching for dependency: ', dependency);
    if (dependency[0] !== "@") {

        switch (dependency) {
            case 'CandyCreator721A.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Token', 'CandyCreatorV1A.sol'), 'utf8').toString() };
            case 'token/ERC721/ERC721A.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/Base/Token/ERC721A', 'ERC721A.sol'), 'utf8').toString() };
            case 'access/Ownable.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/access', 'OwnableV2.sol'), 'utf8').toString() };
            case 'eip/2981/ERC2981Collection.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'eip', '2981', 'ERC2981Collection.sol'), 'utf8').toString() };
            case 'eip/2981/IERC2981.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts', 'eip', '2981', 'IERC2981.sol'), 'utf8').toString() };
            case 'interface/IMAX721.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/interface', 'IMAX721.sol'), 'utf8').toString() };
            case 'modules/Whitelist.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/modules', 'Whitelist.sol'), 'utf8').toString() };
            case 'modules/PaymentSplitter.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/modules', 'PaymentSplitter.sol'), 'utf8').toString() };
            case 'modules/BAYC.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/modules', 'BAYC.sol'), 'utf8').toString() };
            case 'modules/ContractURI.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/modules', 'ContractURI.sol'), 'utf8').toString() };
            case 'interface/IMAX721Whitelist.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/interface', 'IMAX721Whitelist.sol'), 'utf8').toString() };
            case 'interface/IBAYC.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/interface', 'IBAYC.sol'), 'utf8').toString() };
            case 'interface/IContractURI.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/interface', 'IContractURI.sol'), 'utf8').toString() };
            case 'utils/ContextV2.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/utils', 'ContextV2.sol'), 'utf8').toString() };
            case 'utils/ContextV2.sol':
                return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts/utils', 'ContextV2.sol'), 'utf8').toString() };

            default:
                console.log(dependency)
                return { error: 'File not found' }
        }
    }
    else {
        return { contents: fs.readFileSync(path.resolve(__dirname, 'contracts', dependency), 'utf8').toString() };
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
    path.resolve('./standard-input/', 'CandyCreator721A' + '.json'),
    config
);

const output = compileSources(config)
errorHandling(output)
console.log(output)
writeOutput(output, buildPath)
//const supertoken = output['contracts']['ERC721v2.1.2ETHColWLWith2981.sol']['ERC721v2ETHCollectionWhitelist']




