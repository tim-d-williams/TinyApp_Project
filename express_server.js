var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var morgan = require('morgan');
var cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
// set morgan
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['javascript is fun'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours

}))

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
    user_id: "vojdf2"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    url:  "http://www.google.com",
    user_id: "vojdf2"
  }
};

const users = {
  "111": {
    id: "111",
    email: "tim@example.com",
    password: "beer"
  },
 "vojdf2": {
    id: "vojdf2",
    email: "timwilliams.tx@gmail.com",
    password: "$2b$10$GqgM5tmIofmgL4DCcHAYD.JfmO3WVTcY3hmj9L9Q75kVpmPybramO"
  }
}

//loop through url database
  //if user id = logged in user id
    //add to temp db
let urlsForUser = id => {
  let tempDb = {}
  for (let key in urlDatabase) {
    if (urlDatabase[key].user_id === id) {
      tempDb[key] = {
        shortURL: urlDatabase[key].shortURL,
        url: urlDatabase[key].url,
        user_id: urlDatabase[key].user_id,
        date: urlDatabase[key].date,
        count: urlDatabase[key].count
        }
      }
    } return tempDb
  }

//counter to track number of times u/:id page is used
  let count = 0;
  counter = function(id) {
    count = urlDatabase[id].count || 0;
    urlDatabase[id].count = count +=1;
    return count;
    }


//get date to use when url is created in /register
  var date = new Date();
  var year = date.getFullYear()
  var month = date.getMonth() + 1;
      month = (month < 10 ? "0" : "") + month;
  var day  = date.getDate() - 1;
      day = (day < 10 ? "0" : "") + day;
  var todaysDate = `${year}-${month}-${day}`

// '/' returns 'Hello!'
app.get("/", (req, res) => {
  let userId = req.session.user_id
  if (userId) {
    res.redirect('/urls')
  }
  res.redirect('/login');
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
        // if(users[key].password === req.body.password) {
          let check;
          let password = req.body.password;
          check = bcrypt.compareSync(password, users[key].password)
          if (check) {
          req.session.user_id = users[key].id
          res.redirect('/urls');
        } res.status(403).send('Login or password is incorrect')
      }
    } res.status(403).send('Email address doesn\'t exist')
  })

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
    res.sendStatus(400);
  }
  //if email exists
  for (let key in users) {
    if (users[key].email === req.body.email) {
      res.sendStatus(400);
    }
  }
  let newId = generateRandomString();
  let password = req.body.password;
  var hashedPassword = bcrypt.hashSync(password, saltRounds);
  users[newId] = newId = {
    id: newId,
    email: req.body.email,
    password: hashedPassword
  }
    req.session.user_id = newId.id;
    res.redirect('/urls');
});

//logout and clear cookie
app.post("/logout", (req, res) => {
  req.session.user_id = null
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id
  let templateVars = { urls: urlsForUser(userId),
    user_id: users[req.session.user_id]
  };
  console.log('vars: ', templateVars);
  res.render("urls_index", templateVars);
});

//return urls page to browser
app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id
  if (userId) {
    let templateVars = {
      user_id: users[req.session.user_id]
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
    user_id: req.session.user_id,
    date: todaysDate,
    counter: 0
  }
  res.redirect("/urls");
});


app.get("/u/:shortURL", (req, res) => {
  let urlId = req.params.shortURL
  if (urlDatabase[urlId] === undefined) {
    res.redirect(404, '/urls/new')
  } else {
     ;
  console.log('get u shorturl: ', urlDatabase)
  let longURL = urlDatabase[urlId].url
  res.redirect(longURL);
   counter(urlId)
   console.log("count: ",urlDatabase[urlId].count)
  }
});

//add urls to template var
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
    urls: urlDatabase,
    user_id: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

//use POST req to DELETE url entry
//if url owner is same as logged in user allow delete
app.post('/urls/:id/delete', (req, res) => {
  let urlToDelete = req.params.id;
    if (urlDatabase[req.params.id].user_id === req.session.user_id) {
      delete urlDatabase[urlToDelete]
      res.redirect('/urls')
    }
    else
      res.send('Only URL owner can delete')
});

//use POST to update url database entrty
app.post('/urls/:id/update', (req, res) => {
  let urlToUpdateId = req.params.id;
  if (urlDatabase[req.params.id].user_id === req.session.user_id) {
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
