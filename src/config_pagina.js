import mongoose from 'mongoose';
const connect = mongoose.connect("mongodb://localhost:27017/paginas");

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Create Schema
const Pageschema = new mongoose.Schema({
    owner: {
        type:String,
        required: true
    },
    item_name: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    
});

// collection part
const paginas = new mongoose.model("pages", Pageschema);

export default paginas;