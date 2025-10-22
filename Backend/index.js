require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const app = express()
const mainrouter = require('./Routes/index')
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: ["http://localhost:5173", "https://grouply.netlify.app"], // ✅ allow local + production
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json())
app.use(helmet())
app.use('/api/v1', mainrouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
