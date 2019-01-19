var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var morgan = require('morgan');
var cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const bodyParser = require("body-parser");
// const styles = require('./assets/styles.css')

app.use(express.static('./assets'));

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
  var day  = date.getDate();
      day = (day < 10 ? "0" : "") + day;
  var todaysDate = `${month}/${day}/${year}`

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
  let user_id = req.session.user_id;
  if (user_id) {
    res.redirect('/urls')
  }
  res.render('login')
})

//check if logged in, if not render page
app.get('/register', (req, res) => {
  let user_id = req.session.user_id;
  if (user_id) {
    res.redirect('/urls')
  }
  res.render('register')
})

//POST route for register
//add new user to the user data
app.post('/register', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  console.log(email, password)
  if (email) {
    if (password) {
      let inUsers = false;
      for (var key in users) {
        if (users[key].email === email) {
          inUsers = true;
        }
      }
        if (inUsers === false) {
          let newId = generateRandomString();
          var hashedPassword = bcrypt.hashSync(password, saltRounds);
          users[newId] = newId = {
            id: newId,
            email: req.body.email,
            password: hashedPassword
          }
            req.session.user_id = newId.id;
            res.redirect('/urls');
        } else {
          res.status(400).send('<h1>Email address already exist, try logging in.</h1>');
        }
    } else {
    res.status(400).send('<h1>Email address or password was not provided. Please try again.</h1>');
    }
  } else {
    res.status(400).send('<h1>Email address or password was not provided. Please try again.</h1>');
  }
});

//logout and clear cookie
app.post("/logout", (req, res) => {
  req.session.user_id = null
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id
  if (userId) {
    let templateVars = { urls: urlsForUser(userId),
      user_id: users[req.session.user_id]
    }
    res.render("urls_index", templateVars);
  } else {
    res.send('Please login to access this page')
  }
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

//generate new id and add to database
app.post("/urls", (req, res) => {
  let newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = {
    shortURL: newShortUrl,
    url: (req.body.longURL),
    user_id: req.session.user_id,
    date: todaysDate,
    counter: 0
  }
  let newUrl = ('/urls/'+newShortUrl)
  res.redirect(newUrl);
});


app.get("/u/:shortURL", (req, res) => {
  let urlId = req.params.shortURL
  if (!urlDatabase[urlId]) {
    console.log(urlDatabase[urlId]);
    res.status(404).send('This URL does not exist');
  } else {
  let longURL = urlDatabase[urlId].url
  res.redirect(longURL);
   counter(urlId)
  }
});

//check if user is logged in
  //if not, return error
//then check if url is valid
  //if not, return error
//then check if user is owner
  //if not return error
//else return page
app.get("/urls/:id", (req, res) => {
  let urlId = req.params.id;
  let user_id = req.session.user_id

  if (user_id) {
    if (urlDatabase[urlId]) {
     if (urlDatabase[urlId].user_id === user_id) {
        let templateVars = { shortURL: urlId,
          urls: urlDatabase,
          user_id: users[req.session.user_id] };
        res.render("urls_show", templateVars);
      } else {
        res.send('Only URL owner can access this page')
      }
    } else {
      res.status(404).send('This URL does not exist')
    }
  } else {
    res.send('Please login to access this page')
  }
});

//use POST req to DELETE url entry
//if url owner is same as logged in user allow delete
app.post('/urls/:id/delete', (req, res) => {
  let urlToDelete = req.params.id;
  let user_id = req.session.user_id

  if (user_id) {
    if (urlDatabase[urlToDelete].user_id === user_id) {
      delete urlDatabase[urlToDelete]
      res.redirect('/urls')
    } else {
      res.send('Only URL owner can delete')
      }
    } else {
    res.send('Please login to access this page')
    }
});

//use POST to update url database entrty
app.post('/urls/:id/update', (req, res) => {
  let urlToUpdateId = req.params.id;
  let user_id = req.session.user_id

  if (user_id) {
    if (urlDatabase[urlToUpdateId].user_id === user_id) {
      urlDatabase[urlToUpdateId].url = req.body.updatedUrl
      res.redirect('/urls')
    } else {
      res.send('Only URL owner can delete')
      }
    } else {
    res.send('Please login to access this page')
    }
})


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
