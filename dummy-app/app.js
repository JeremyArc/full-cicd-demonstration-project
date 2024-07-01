const express = require('express');
const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.send("It's work");
});

app.listen(port, () => {
  console.log(`App listening at port:${port}`);
});
