import mongoose from 'mongoose';
const connect = mongoose.connect("mongodb://localhost:27017/admin");

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Create Schema
const Loginschema = new mongoose.Schema({
    rf: {
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cpf: {
        type: String,
        required: true

    },  
    isAdmin: {
        type: Boolean,
        default: false
    },
    
});

// collection part
const collection = new mongoose.model("users", Loginschema);

export default collection;