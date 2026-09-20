<<<<<<< HEAD
<<<<<<< HEAD
const express = require('express'),
app = express();

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', 
   (req, res) => res.send('Dockerizing Node Application'))

app.listen(5000, 
   () => console.log(`⚡️[bootup]: Server is running at port: 5000`));
=======
=======
>>>>>>> e2b12ef51863654bc6f1da8f004aa5e591aaa7a9
const express = require('express');
const app = express();

const port = 5000;
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// Import the router
const Userroutes = require('./Userroutes');

// Use the router for all paths starting with '/'
app.use('/user', Userroutes);

//app.get('/', 
   //(req, res) => res.send('Dockerizing Node Application'));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
<<<<<<< HEAD
});
>>>>>>> e2b12ef (add: Authentification route and user creation in db)
=======
});
>>>>>>> e2b12ef51863654bc6f1da8f004aa5e591aaa7a9
