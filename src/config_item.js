import mongoose from 'mongoose';
const connect = mongoose.connect("mongodb://localhost:27017/item");

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
    preco: {
        type: Number,
        required: true
    },
    // Adicione outros campos conforme necessário
});

// collection part
const ItemCollection = new mongoose.model("items", ItemSchema);

export default ItemCollection;