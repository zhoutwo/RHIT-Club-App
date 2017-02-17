const express = require('express');
const router = express.Router();
const _ = require('lodash');

const auth = require('../auth')();
const backend = require('../backend');

// Users
// Not Signed In
router.post('/users/', (req, res) => {
  let token = req.cookies ? req.cookies.token : (req.body ? req.body.token : null);
  if (token) {
    auth.getIdentity(token).then((RFuser) => {
      backend.isRegistered(RFuser.rose_username).then((is) => {
        if (!is) {
          return backend.createUser(RFuser.rose_username, RFuser.name, RFuser.email).then((user) => {
            res.status(200).json(_.assign({'message': 'Successfully registered!'}, user));
          });
        } else {
          return backend.fetchUser(RFuser.rose_username).then((user) => {
            res.status(200).json(_.assign({'message': 'Successfully logged in!'}, user));
          });
        }
      })
    }).catch((err) => {
      res.status(403).send('Log in failed');
    });
  } else {
    res.status(403).send('Missing token information');
  }
});

// Signed In
router.get('/users/:rose_username', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    let rose_username = req.params.rose_username;
    if (rose_username == RFuser.rose_username) {
      res.json(RFuser);
    } else {
      res.status(403).send('Failed to fetch user info');
    }
  });
});
router.post('/users/:rose_username/clubs/:clubName', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    let rose_username = req.params.rose_username;
    let clubName = req.params.clubName;
    let type = req.body.type;
    if (rose_username == RFuser.rose_username) {
      if (type == 'sign_up') {
        backend.signUpForClub(rose_username, clubName).then(() => {
          return fetchUser(rose_username, res);
        }).catch((err) => {
          res.status(403).send('Unable to sign up for this club');
        })
      } else if (type == 'subscribe') {
        backend.subscribeToClub(rose_username, clubName).then(() => {
          return fetchUser(rose_username, res);
        }).catch((err) => {
          res.status(403).send('Unable to subscribe to this club');
        })
      } else {
        res.status(403).send('Type is not sign_up/subscribe in the requst body');
      }
    } else {
      res.status(403).send('Inconsistent username with token');
    }
  });
});
router.delete('/users/:rose_username/clubs/:clubName', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    let rose_username = req.params.rose_username;
    let clubName = req.params.clubName;
    let type = req.body.type;
    if (rose_username == RFuser.rose_username) {
      if (type == 'sign_up') {
        backend.unsignUpForClub(rose_username, clubName).then(() => {
          return fetchUser(rose_username, res);
        }).catch((err) => {
          res.status(403).send('Unable to unsign up for this club');
        })
      } else if (type == 'subscribe') {
        backend.unsubscribeClub(rose_username, clubName).then(() => {
          return fetchUser(rose_username, res);
        }).catch((err) => {
          res.status(403).send('Unable to unsubscribe to this club');
        })
      } else {
        res.status(403).send('Type is not sign_up/subscribe in the requst body');
        return;
      }
    } else {
      res.status(403).send('Inconsistent username with token');
    }
  });
});
router.post('/users/:rose_username/events/:eventID', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    let rose_username = req.params.rose_username;
    let eventID = req.params.eventID;
    if (rose_username == RFuser.rose_username) {
      backend.signUpForEvent(rose_username, eventID). then(() => {
        return fetchUser(rose_username, res);
      }).catch((err) => {
        res.status(403).send('Fail to sign up for this event');
      });
    } else {
      res.status(403).send('Inconsistent username with token');
    }
  });
});
router.delete('/users/:rose_username/events/:eventID', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    let rose_username = req.params.rose_username;
    let eventID = req.params.eventID;
    if (rose_username = RFuser.rose_username) {
      backend.unsignUpForEvent(rose_username, eventID).then(() => {
        return fetchUser(rose_username, res);
      }).catch((err) => {
        res.status(403).send('Fail to unsign up for this event');
      });
    } else {
      res.status(403).send('Inconsistent username with token');
    }
  });
});

// Clubs
router.get('/clubs/', (req, res) => {
  let token = req.cookies ? req.cookies.token : (req.body ? req.body.token : null);
  let promise;
  if (token) {
    promise = auth.getIdentity(token).then((RFuser) => {
      return backend.fetchAllClubs(RFuser.rose_username).then((clubs) => {
        res.status(200).json(clubs);
      });
    })
  } else {
    promise = backend.fetchAllClubs().then((clubs) => {
      res.status(200).json({clubs: clubs});
    });
  }
  promise.catch((err) => {
    throw err;
    res.status(403).send('Fail to fetch all clubs');
  });
});
router.get('/clubs/:clubName', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.fetchClub(RFuser.rose_username, req.params.clubName).then((club) => {
      res.status(200).json(club);
    }).catch((err) => {
      res.status(403).send('Unable to fetch the club info');
    });
  });
});
router.post('/clubs/:clubName', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.fetchClub(RFuser.rose_username, req.params.clubName).then((club) => {
      let newClub = _.assignIn({}, club, req.body, {clubName: req.params.clubName});
      newCLub = _.omit(newCLub, 'token', 'rose_username');
      return Promise.resolve(newClub);
    }).then((club) => {
      return backend.updateClub(club);
    }).catch((err) => {
      res.status(403).send('Unable to fetch the club info');
    });
  });
});
router.get('/clubs/:clubName/events', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.fetchEventsByClub(req.params.clubName).then((events) => {
      res.status(200).json(events);
    }).catch((err) => {
      res.status(403).send('Failed to fetch events by club name');
    });
  });
});
router.post('/clubs/:clubName/events', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.createEvent(RFuser.rose_username, req.params.clubName, req.body).then((event) => {
      res.status(200).json(event);
    }).catch((err) => {
      res.status(403).send('Failed to create event');
    });
  });
});

// Events
router.get('/events/', (req, res) => {
  let token = req.cookies ? req.cookies.token : (req.body ? req.body.token : null);
  let promise;
  if (token) {
    // Signed In
    promise = auth.getIdentity(token).then((RFuser) => {
      backend.fetchAllEvents(RFuser.rose_username).then((events) => {
        res.status(200).json(events);
      });
    });
  } else {
    // Not Signed In
    promise = backend.fetchAllEvents().then((events) => {
      res.status(200).json(events);
    });
  }
  promise.catch((err) => {
    throw err;
    res.status(403).send('Failed to fetch all events');
  });
});
router.get('/events/:eventID', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.fetchEvent(req.params.eventID).then((event) => {
      res.status(200).json(event);
    }).catch((err) => {
      res.status(403).send('Failed to fetch event information');
    });
  });
});
router.delete('/events/:eventID', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.cancelEvent(RFuser.rose_username, req.params.eventID).then((event) => {
      res.status(200).json(event);
    }).catch((err) => {
      res.status(403).send('Failed to cancel the event');
    });
  });
});

// Rooms
router.get('/rooms/', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.fetchAllRooms().then((rooms) => {
      res.status(200).json(rooms);
    }).catch((err) => {
      res.status(403).send('Failed to fetch all room availabilities');
    });
  });
});
router.get('/rooms/:roomNumber', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.fetchRoom(req.params.roomNumber).then((room) => {
      res.status(200).json(room);
    }).catch((err) => {
      res.status(403).send('Failed to fetch room information');
    });
  });
});
router.get('/rooms/:roomNumber/:year/:month/:day', (req, res) => {
  verifyRoseFireLoggedIn(req, res, (RFuser) => {
    backend.fetchRoom(req.params.roomNumber, new Date(req.params.year, req.params.month, req.params.day)).then((room) => {
      res.status(200).json(room);
    }).catch((err) => {
      res.status(403).send('Failed to fetch room information');
    });
  });
});

// 404 for All Other Requests
router.all('/', (req, res) => {
  res.send(404);
});

// Utilities
function verifyRoseFireLoggedIn(req, res, cb) {
  let token = req.cookies ? req.cookies.token : (req.body ? req.body.token : null);
  if (token) {
    auth.getIdentity(token).then((RFuser) => {
      backend.fetchUser(RFuser.rose_username).then((user) => {
        cb(user);
      });
    }).catch((err) => {
      throw err;
    });
  } else {
    res.send('Missing token');
  }
}

function fetchUser(rose_username, res) {
  return backend.fetchUser(rose_username).then((user) => {
    res.status(200).json(user);
  }).catch((err) => {
    throw err;
  });
}

module.exports = router;
