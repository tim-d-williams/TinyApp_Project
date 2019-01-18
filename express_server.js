var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var morgan = require('morgan');
var cookieParser = require('cookie-parser');

const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
// set morgan
app.use(morgan('dev'));

//found solution to generate random string on stackoverflow
//setting Math.random toString with 36 as a parameter sets number > 9 to alpha characters
function generateRandomString() {
  let shortURL = Math.random().toString(36).substring(2, 8);
  return shortURL
}

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    url: "http://www.lighthouselabs.ca",
    user_id: ""
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    url:  "http://www.google.com",
    user_id: ""
  }
};

const users = {
  "111": {
    id: "111",
    email: "tim@example.com",
    password: "beer"
  },
 "222": {
    id: "222",
    email: "test@example.com",
    password: "suh"
  }
}

// '/' returns 'Hello!'
app.get("/", (req, res) => {
  res.send("Hello!");
});

//return urlDatatbase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//take login name, verify email exist
  //validate password is correct
    //if both pass set cookie and return to /
  // if fail, return 403
app.post("/login", (req, res) => {
  for (let key in users) {
    if (users[key].email === req.body.email) {
      if(users[key].password === req.body.password) {
        res.cookie('user_id', users[key].id).redirect('/urls');
      } res.status(403).send('Login or password is incorrect')
    } res.status(403).send('Email address doesn\'t exist')
  }
})

//login page
app.get('/login', (req, res) => {
  res.render('login')
})

//GET register endpoint
app.get('/register', (req, res) => {
  res.render('register')
})

//POST route for register
//add new user to the user data
app.post('/register', (req, res) => {
  //if email or password is empty
  if (!req.body.email || !req.body.password) {
    res.status(400).send('You must provide email address and password');
  }
  //if email exists
  for (let key in users) {
    if (users[key].email === req.body.email) {
      res.status(400).send('Email address already exists');
    }
  }
  let newId = generateRandomString();
  users[newId] = newId = {
    id: newId,
    email: req.body.email,
    password: req.body.password
  }
  res.cookie('user_id', newId.id).redirect('/urls')
});

//logout and clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie('user_id').redirect('/urls');
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
    user_id: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

//return urls page to browser
app.get("/urls/new", (req, res) => {
  let userId = req.cookies.user_id
  if (userId) {
    let templateVars = {
      user_id: users[req.cookies["user_id"]]
    }
    res.render('urls_new', templateVars)
  } else {
    res.redirect('/login')
  }
});

app.post("/urls", (req, res) => {
  let newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = {
    shortURL: newShortUrl,
    url: (req.body.longURL),
    user_id: req.cookies["user_id"]
  }
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.redirect(404, '/urls/new')
  } else {
  let longURL = urlDatabase[req.params.shortURL].url
  res.redirect(longURL);
  }
});

//add urls to template var
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
    urls: urlDatabase,
    user_id: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

//use POST req to DELETE url entry
//if url owner is same as logged in user allow delete
app.post('/urls/:id/delete', (req, res) => {
  let urlToDelete = req.params.id;
    if (urlDatabase[req.params.id].user_id === req.cookies["user_id"]) {
      delete urlDatabase[urlToDelete]
      res.redirect('/urls')
    }
    else
      res.send('Only URL owner can delete')
});

//use POST to update url database entrty
app.post('/urls/:id/update', (req, res) => {
  let urlToUpdateId = req.params.id;
  if (urlDatabase[req.params.id].user_id === req.cookies["user_id"]) {
    urlDatabase[urlToUpdateId].url = req.body.updatedUrl
    res.redirect('/urls')
  }
  else
    res.send('Only URL owner can update')
})


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
