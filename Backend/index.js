require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const app = express()
const mainrouter = require('./Routes/index')
const PORT = process.env.PORT || 5000

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(helmet())
app.use('/api/v1', mainrouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
