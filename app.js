const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const succesJson = (json) => {
  return {
    author: "NirKyy",
    success: true,
    data: json
  };
};

const errorJson = (json) => {
  return {
    author: "NirKyy",
    success: false,
    error: json
  };
};

app.use((req, res, next) => {
  res.succesJson = (json) => {
    res.status(200).json(succesJson(json));
  };

  res.errorJson = (json) => {
    res.json(errorJson(json));
  };

  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('json spaces', 2);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


/*-----------------*/
app.use("/api/v1", require("./API/index.js"))
/*-----------------*/
app.get('/', (req, res) => {
  res.render('index');
});
/*-----------------*/


/*Global Error*/
app.use((req, res, next) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500');
});


app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});