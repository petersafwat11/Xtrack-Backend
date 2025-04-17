const dotenv = require("dotenv");
dotenv.config();

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000, 
    query_timeout: 10000, 
    statement_timeout: 10000, 
    idle_in_transaction_session_timeout: 10000 
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000, 
    createTimeoutMillis: 30000,  
    idleTimeoutMillis: 30000,    
    reapIntervalMillis: 1000,    
    createRetryIntervalMillis: 200, 
  },
  acquireConnectionTimeout: 60000, // 60 seconds
});

// Add event listeners for connection issues
knex.on('query-error', function(error, obj) {
  console.error('Query error:', error);
  console.error('Query that caused error:', obj);
});

knex.on('error', function(err) {
  console.error('Database error:', err);
});

knex
  .raw("SELECT 1")
  .then(async () => {
    console.log("Connected to the database successfully");
    // await listTables();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
  
module.exports = knex;
 