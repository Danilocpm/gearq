import multer from 'multer';
import { storage as gcsStorage } from './config_cloud.js';

const multerStorage = multer.memoryStorage({
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: multerStorage,
    fileFilter: function (req, file, cb) {
        // Aqui você pode adicionar lógica para filtrar os tipos de arquivos permitidos
        cb(null, true);
    }
});

export default upload;