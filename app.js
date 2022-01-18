const express = require('express');
const app = express();
if(process.env.APP_ENV == 'dev'){
    require('dotenv').config();
}


// run server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));