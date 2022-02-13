import mongoose from 'mongoose';
// Declare the Schema of the Mongo model
const shopSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    token:{type:String},
    active:{
        type:Boolean,
        required:true,
        default: 1,
    },
},{timestamps: true});

//Export the model
const Shop = mongoose.model.Shop || mongoose.model('Shop', shopSchema);
export default Shop;