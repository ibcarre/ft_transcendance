require('dotenv').config();

const pgp = require('pg-promise')();

const db = pgp({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test de connexion
db.connect()
  .then(obj => {
    console.log('✅ Connexion à Supabase réussie !');
    obj.done();
  })
  .catch(error => {
	console.log(process.env.DATABASE_URL)
    console.log('❌ Erreur PostgreSQL :', error.message);
  });

module.exports = db;
