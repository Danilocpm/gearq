import mongoose from 'mongoose';
const connect = mongoose.connect("mongodb://localhost:27017/item");
const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000  // Tempo de espera para seleção do servidor
};

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Create Schema
const ItemSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    descricao: {
        type: String,
        required: true
    },
    portas: {
        type: String,
        required: false
    },
    tipos_de_portas: {
        type: String,
        required: false
    },
    portas_adicionais: {
        type: String,
        required: false
    },
    tipos_de_portas_adicionais: {
        type: String,
        required: false
    },
    protocolos: {
        type: String,
        required: false
    },
    altura: {
        type: Number,
        required: false
    },
    largura: {
        type: Number,
        required: false
    },
    memoria: {
        type: String,
        required: false
    },
    processador: {
        type: String,
        required: false
    },
    MAC: {
        type: String,
        required: false
    },
    performance: {
        type: String,
        required: false
    },
    Capacidade_de_encaminhamento: {
        type: String,
        required: false
    },
    capacidade_de_computacao: {
        type: String,
        required: false
    },
    Frequência: {
        type: String,
        required: false
    },
    watts: {
        type: Number,
        required: false
    }
});

// collection part
const ItemCollection = new mongoose.model("items", ItemSchema);

export default ItemCollection;