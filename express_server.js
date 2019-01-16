var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

//found solution to generate random string on stackoverflow
//setting Math.random toString with 36 as a parameter sets number > 9 to alpha characters
function generateRandomString() {
  let shortURL = Math.random().toString(36).substring(2, 8);
  return shortURL
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// '/' returns 'Hello!'
app.get("/", (req, res) => {
  res.send("Hello!");
});

//return urlDatatbase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//return urls page to browser
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let newShortUrl = generateRandomString();
  let newUrl = (req.body);
  newUrl = newUrl.longURL;
  urlDatabase[newShortUrl] =  newUrl
  res.redirect("/urls");
});

app.get("/url/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.redirect(404, '/urls/new')
  } else {
  let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
  }
});

//add urls to template var
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
    urls: urlDatabase };
  res.render("urls_show", templateVars);
});

//use POST req to DELETE url entry
app.post('/urls/:id/delete', (req, res) => {
  let urlToDelete = req.params.id;
  delete urlDatabase[urlToDelete]
  res.redirect('/urls')
});

//use POST to update url database entrty
app.post('/urls/:id/update', (req, res) => {
    let urlToUpdateId = req.params.id;
    urlDatabase[urlToUpdateId] = req.body.updatedUrl
    res.redirect('/urls')
})


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
