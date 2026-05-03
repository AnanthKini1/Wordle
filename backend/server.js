const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/guess', (req, res) => {
    res.send('Hello');
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});