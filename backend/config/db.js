const mysql = require("mysql2");

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",      
  password: "",    
  database: "pkm_db" 
});

conn.connect((err) => {
  if (err) throw err;
  console.log("✅ Database connected...");
});

module.exports = conn;
