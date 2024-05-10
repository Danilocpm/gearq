import { Storage } from '@google-cloud/storage';

// Substitua 'caminho/para/o/arquivo/de/chave.json' pelo caminho correto do seu arquivo de chave
const storage = new Storage({
    keyFilename: 'enhanced-hawk-422816-j7-0ab8ff03a389.json'
});

const bucketName = 'danilocpm';
const folderName = 'uploads/';

async function listFilesInFolder() {
    console.log('Iniciando listagem de arquivos...');
    try {
        // Restante do código...
    } catch (error) {
        console.error('Falha ao conectar ao Google Cloud Storage:', error);
    }
}


listFilesInFolder().catch(console.error);
export { storage, bucketName, folderName };