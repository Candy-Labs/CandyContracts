// Imports
const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

function compilingPreperations() {
    const buildPath = path.resolve(__dirname, 'new-build');
    fs.removeSync(buildPath);
    return buildPath;
}

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
            'ERC721A/IERC721AUpgradeable.sol': {
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
            }
        },
        settings: {
            metadata: { useLiteralContent: true },
            optimizer: {
                enabled: true,
                runs: 200
            },
            outputSelection: { "*": { "*": ["*"], "": ["*"] } },
        }
    };
}

function compileSources(config) {
    try {
        return JSON.parse(solc.compile(JSON.stringify(config)));
    } catch (e) {
        console.log(e);
    }
}

function errorHandling(compiledSources) {
    if (!compiledSources) {
        console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n', 'NO OUTPUT');
    } else if (compiledSources.errors) { // something went wrong.
        console.error('>>>>>>>>>>>>>>>>>>>>>>>> ERRORS <<<<<<<<<<<<<<<<<<<<<<<<\n');
        compiledSources.errors.map(error => console.log(error.formattedMessage));
    }
}

function writeOutput(compiled, buildPath) {
    fs.ensureDirSync(buildPath);
    for (let contractFileName in compiled.contracts) {
        const contractName = contractFileName.replace('.sol', '');
        const short = contractFileName.split("/").reverse()[0].replace('.sol', '');
        console.log('Writing: ', contractName + '.json');
        fs.outputJsonSync(
            path.resolve(buildPath, contractName + '.json'),
            compiled.contracts[contractFileName][short]
        );
    }
}

const buildPath = compilingPreperations();
const config = createConfiguration();

fs.outputJsonSync(
    path.resolve('./standard-input/', 'CandyCreator721AUpgradeable' + '.json'),
    config
);

const output = compileSources(config)
errorHandling(output)
writeOutput(output, buildPath)