const TYPES = require('tedious').TYPES;
const Request = require('tedious').Request;
const ConnectionPool = require('tedious-connection-pool');

const poolConfig = {
    min: 10,
    max: 200,
    log: true
};

const connectionConfig = {
    userName: 'clubUser',
    password: 'clubPassword',
    server: 'titan.csse.rose-hulman.edu',
    options: {
        database: 'RHIT_Club_App',
        rowCollectionOnRequestCompletion: true
    }
};

const pool = new ConnectionPool(poolConfig, connectionConfig);

pool.on('error', function(err) {
  if (err) {
    console.error(err);
  }
});

// ---------------------------------------------------------------
// Make sure SQL statements cascade for deletions (eg. delete Club
// remove from events, subscribes, member_of, etc.)
// If not, must modify SQL
// ---------------------------------------------------------------

/*
Checks if the user is already registerd
Uses the stored procedure 'getUserRegistered'
Returns true if the user is registered, false if they are not
*/
function isRegistered(username) {
  let value = false;
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('getUserRegistered', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          value = true;
        }

        return resolve(value);
      });
      request.addParameter('username', TYPES.VarChar, username);
      connection.callProcedure(request);
    });
  });
}

/*
Adds the user and information to the database
Uses the stored procedure 'createNewUser'
Returns the json of the user created
*/
function createUser(username, name, email) {
  var user = {
    rose_username: '',
    name: '',
    email: ''
  };
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('createNewUser', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        const email = username + "@rose-hulman.edu";
        user.rose_username = rows[0][0].value;
        user.name = rows[0][1].value;
        user.email = rows[0][2].value; 

        return resolve(user);
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('name', TYPES.VarChar, name);
      request.addParameter('email', TYPES.VarChar, email);
      connection.callProcedure(request);
    });
  });
}

/*
Fetches the user information from the database
Uses the stored procedure 'fetchRegisteredUser'
Returns the json of the user fetched
*/
function fetchUser(username) {
  var user = {
    rose_username: '',
    name: '',
    email: '',
    signed_up: [],
    subscribed: [],
    manages: [],
    events: []
  };
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request1 = new Request('fetchRegisteredUser', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        for (var i = 0; i < rows.length; i++) {
          user.rose_username = rows[i][0].value;
          user.name = rows[i][1].value;
          user.email = rows[i][2].value;
        }

        pool.acquire(function (err, connection) {
          if (err) {
              reject(err);
          }

          var request2 = new Request('fetchUserClubMember', function(err, rowCount, rows) {
            setImmediate(() => {connection.close();});
            if (err) {
              return reject(err);
            }
            for (var i = 0; i < rows.length; i++) {
              rows[i][0].value ? user.signed_up.push(rows[i][0].value) : null;
            }

            pool.acquire(function (err, connection) {
              if (err) {
                  reject(err);
              }

              var request3 = new Request('fetchUserClubSubscribe', function(err, rowCount, rows) {
                setImmediate(() => {connection.close();});
                if (err) {
                  return reject(err);
                }
                for (var i = 0; i < rows.length; i++) {
                  rows[i][0].value ? user.subscribed.push(rows[i][0].value) : null;
                }

                pool.acquire(function (err, connection) {
                  if (err) {
                      reject(err);
           
                  }

                  var request4 = new Request('fetchUserOfficer', function(err, rowCount, rows) {
                    setImmediate(() => {connection.close();});
                    if (err) {
                      return reject(err);
                    }
                    club = {
                      club_name: '',
                      title: ''
                    };
                    for (var i = 0; i < rows.length; i++) {
                      if (rows[i][0].value) {
                        club.club_name = rows[i][0].value;
                        club.title = rows[i][1].value;
                        user.manages.push(club);
                      }
                    }

                    pool.acquire(function (err, connection) {
                      if (err) {
                        reject(err);
                      }

                      var request5 = new Request('fetchEventsForUser', function(err, rowCount, rows) {
                        if (err) {
                          return reject(err);
                        }
                        for (var i = 0; i < rows.length; i++) {
                          if (rows[i][0].value) {
                            user.events.push(rows[i][0].value);
                          }
                        }
                        return resolve(user);
                      });
                      request5.addParameter('username', TYPES.VarChar, username);
                      connection.callProcedure(request5);
                    })
                  });
                  request4.addParameter('username', TYPES.VarChar, username);
                  connection.callProcedure(request4);
                });          
              });
              request3.addParameter('username', TYPES.VarChar, username);
              connection.callProcedure(request3);
            });
          });
          request2.addParameter('username', TYPES.VarChar, username);
          connection.callProcedure(request2);
        });
      });
      request1.addParameter('username', TYPES.VarChar, username);
      connection.callProcedure(request1);
    }); 
  });
}

/*
Signs a user up for a club
Uses the stored procedure 'addUserToClub'
Returns a string notifying the user has been signed up for the club
*/
function signUpForClub(username, clubName) {
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('addUserToClub', function(err) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        return resolve({ message: "Signed user up for club"});
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

/*
Subscribes user to a club
Uses the stored procedure 'subscribeUserToClub'
Returns a string notifying the user has been subscribed to the club
*/
function subscribeToClub(username, clubName) {
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('subscribeUserToClub', function(err) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        return resolve({message: "Subscribed user to club"});
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

/*
Removes the user from a club
Uses the stored procedure 'leaveClub'
Returns a string notifying the user has been removed from the club
*/
function unsignUpForClub(username, clubName) {
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('unsignUpForClub', function(err) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        return resolve({messsage: "User has left club"});
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

/*
Unsubscribes the user from a club
Uses the stored procedure 'unsubscribeClub'
Returns a string notifying the user has been unsubscribed from the club
*/
function unsubscribeClub(username, clubName) {
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('unsubscribeClub', function(err) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        return resolve({message: "User has unsubscribed from club"});
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

/*
Gets the information about a club
Uses the stored procedure 'getOneClubByClubName'
Returns a json of the club information including who is signed up and subscribed for the club
*/
function fetchClub(username, clubName) {
  var clubInfo = {
    club_name: '',
    club_type: '',
    club_description: '',
    members: [],
    subscribers: [],
    officer: false,
    managers: [],
    club_files: []
  };
  // Strategy:
  // 1. Get club name, type, and description - getOneClubByClubName
  // 2. Get members' rose_username, name, email - getAllMembersByClubName
  // 3. Get subscribers' rose_username, name, email - getAllSubscribersByClubName
  // 4. Get managers' rose_username, name, email, title - getAllManagersByClubName
  // 5. Get files' file_id, file_path, file_type - getAllFilesByClubName
  // 6. Get whether the user is an officer of the club
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }
      var request = new Request('getOneClubByClubName', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        
        if (rows.length > 0) {
          clubInfo.club_name = rows[0][0].value;
          clubInfo.club_type = rows[0][1].value;
          clubInfo.club_description = rows[0][2].value;

          return getAllMembersByClubName(clubName).then((members) => {
            clubInfo.members = members;
            return getAllSubscribersByClubName(clubName).then((subscribers) => {
              clubInfo.subscribers = subscribers;
              return getAllManagersByClubName(clubName).then((managers) => {
                clubInfo.managers = managers;
                return getAllFilesByClubName(clubName).then((club_files) => {
                  clubInfo.club_files = club_files;
                  if (username) {
                    return isOfficer(username, clubName).then((is) => {
                      clubInfo.officer = is;
                      resolve(clubInfo);
                    }).catch((err) => {
                      reject(err);
                    });
                  } else {
                    return resolve(clubInfo);
                  }
                }).catch((err) => {
                  reject(err);
                })
              }).catch((err) => {
                reject(err);
              });
            }).catch((err) => {
              reject(err);
            });
          }).catch((err) => {
            reject(err);
          })
        } else {
          reject(new Error('No club of the given name was found'));
        }
      });

      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

function getAllMembersByClubName(clubName) {
  let members = [];
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
        reject(err);
      }

      let request = new Request('getAllMembersByClubName', (err, rowCount, rows) => {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }

        if (rows.length > 0) {
          for (let i = 0; i < rows.length; i++) {
            let member = {};
            member.rose_username = rows[i][0].value;
            member.name = rows[i][1].value;
            member.email = rows[i][2].value;
            members.push(member);
          }
        }

        resolve(members);
      });

      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

function getAllSubscribersByClubName(clubName) {
  let subscribers = [];
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
        reject(err);
      }

      let request = new Request('getAllSubscribersByClubName', (err, rowCount, rows) => {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }

        if (rows.length > 0) {
          for (let i = 0; i < rows.length; i++) {
            let subscriber = {};
            subscriber.rose_username = rows[i][0].value;
            subscriber.name = rows[i][1].value;
            subscriber.email = rows[i][2].value;
            subscribers.push(subscriber);
          }
        }

        resolve(subscribers);        
      });

      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

function getAllManagersByClubName(clubName) {
  let managers = [];
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
        reject(err);
      }

      let request = new Request('getAllManagersByClubName', (err, rowCount, rows) => {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }

        if (rows.length > 0) {
          for (let i = 0; i < rows.length; i++) {
            let manager = {};
            manager.rose_username = rows[i][0].value;
            manager.name = rows[i][1].value;
            manager.email = rows[i][2].value;
            manager.title = rows[i][3].value;
            managers.push(manager);
          }
        }

        resolve(managers);
      });

      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

function getAllFilesByClubName(clubName) {
  let club_files = [];
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
        reject(err);
      }

      let request = new Request('getAllFilesByClubName', (err, rowCount, rows) => {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }

        if (rows.length > 0) {
          for (let i = 0; i < rows.length; i++) {
            let club_file = {};
            club_file.file_id = rows[i][0].value;
            club_file.file_path = rows[i][1].value;
            club_file.file_type = rows[i][2].value;
            club_files.push(club_file);
          }
        }

        resolve(club_files);
      });

      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

/*
This function fetches all clubs in the database. If there is a username provided, select all clubs for that user. If not, select all clubs
Uses the stored procedure 'fetchClubs'
Returns a JSON of all club basic info: Name, Type, and Description
*/
function fetchAllClubs(username) {
  let allClubs = {
    clubs: []
  };
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('fetchClubNames', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          let promise = Promise.resolve();
          for (let i = 0; i < rows.length; i++) {
            let clubName = rows[i][0].value;
            let getResolve = () => {
              return () => {
                return fetchClub(username, clubName).then((club) => {
                  if (club && club.club_name) {
                    allClubs.clubs.push(club);
                  }
                  return club;
                }).catch((err) => {
                  throw err;
                });
              };
            };
            promise = promise.then(() => {
              return fetchClub(username, clubName).then((club) => {
                if (club && club.club_name) {
                  allClubs.clubs.push(club);
                }
                return club;
              }).catch((err) => {
                throw err;
              });
            });
          }
          promise = promise.then(() => {
            resolve(allClubs);
          });
          return promise;
        } else {
          resolve(allClubs);
        }
      });
      connection.callProcedure(request);
    });
  });
}

/*
Signs the user up for an event
Uses the stored procedure 'signUserUpForEvent'
Returns a string signifying the user has signed up for the event
*/
function signUpForEvent(username, eventID) {
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('signUserUpForEvent', function(err) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        return resolve({message: "Signed user up for event"});
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('event_id', TYPES.Int, eventID); 
      connection.callProcedure(request);
    });
  });
}

/*
Removes the user from an event
Uses the stored procedure 'removeUserFromEvent'
Returns a string signifying the user is no longer signed up for the event
*/
function unsignUpForEvent(username, eventID) {
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('removeUserFromEvent', function(err) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        return resolve({message: "User has left club event"});
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('event_id', TYPES.Int, eventID);
      connection.callProcedure(request);
    });
  });
}

/*
Creates an event -> Must be club officer
Uses the stored procedure 'createClubEvent'
Returns a string signifying the event has been created
*/
//TODO: Get username and verify officer
function createEvent(username, clubName, reqBody) {
  let eventID = req.body.eventID;
  let eventTitle = req.body.eventTitel;
  let description = req.body.description;
  let startTime = req.body.startTIme;
  let endTime = req.body.endTime;
  let roomNumber = req.body.roomNumber;
  let building = req.body.building;
  return new Promise((resolve, reject) => {
    return isOfficer(username, clubName).then((officer) => {
      if (!officer) {
        reject(new Error('User is not an officer of this club!'));
      }

      pool.acquire(function (err, connection) {
        if (err) {
            reject(err);
        }

        var request = new Request('createClubEvent', function(err) {
          setImmediate(() => {connection.close();});
          if (err) {
            return reject(err);
          }
          return resolve({message: "The club event has been created"});
        });
        let eventID = Math.round(Math.random() * 1000000);
        request.addParameter('clubName', TYPES.VarChar, clubName);
        request.addParameter('event_id', TYPES.Int, eventID);
        request.addParameter('eventTitle', TYPES.VarChar, eventTitle);
        request.addParameter('eventDescription', TYPES.VarChar, description);
        request.addParameter('startTime', TYPES.SmallDateTime, startTime);
        request.addParameter('endTime', TYPES.SmallDateTime, endTime);
        request.addParameter('roomNumber', TYPES.VarChar, roomNumber);
        request.addParameter('building', TYPES.VarChar, building);
        connection.callProcedure(request);
      });
    });
  });
}

/*
Cancels the event -> Must be club officer
Uses the stored procedure 'cancelEvent'
Returns a string signifying the event has been cancelled
*/
//TODO: Get username and verify officer
function cancelEvent(username, eventID) {
  return new Promise((resolve, reject) => {
    let user = fetchUser(username);
    let club = getClubFromEvent(eventID);
    return isOfficer(username, club).then((officer) => {
      if (!officer) {
        reject(new Error('User is not an officer of this club!'));
      }

      pool.acquire(function (err, connection) {
        if (err) {
            reject(err);
        }

        var request = new Request('cancelEvent', function(err) {
          setImmediate(() => {connection.close();});
          if (err) {
            return reject(err);
          }
          return resolve({message: "The club event has been cancelled"});
        });
        request.addParameter('event_id', TYPES.Int, eventID); 
        request.addParameter('username', TYPES.VarChar, user.rose_username); 
        connection.callProcedure(request);
      });
    });
  });
}

/*
Fetch all events this user can be a part of
Uses the stored procedure 'fetchUserEvents'
Returns a JSON of the events
*/
function fetchAllEvents(username) {
  var events = {
    eventInfo: []
  };
  if (username == null) {
    return new Promise((resolve, reject) => {
      pool.acquire(function (err, connection) {
        if (err) {
            reject(err);
        }

        var request = new Request('fetchAllEvents', function(err, rowCount, rows) {
          setImmediate(() => {connection.close();});
          if (err) {  
            return reject(err);
          }
          event = {
            event_id: '',
            event_title: '',
            event_description: '',
            club_name: ''
          };
          for (var i = 0; i < rows.length; i++) {
            if (rows[i][0].value) {
              event.event_id = (rows[i][0].value);
              event.event_title = (rows[i][1].value);
              event.event_description = (rows[i][2].value);
              event.club_name = rows[i][3].value;
              console.log(event);
              events.eventInfo.push(event);
            }
            console.log(events);
          }
          return resolve(events);
        });
        connection.callProcedure(request);
      });
    });
  }
  else {
    return new Promise((resolve, reject) => {
      pool.acquire(function (err, connection) {
        if (err) {
            reject(err);
        }

        var request = new Request('fetchUserEvents', function(err, rowCount, rows) {
          setImmediate(() => {connection.close();});
          if (err) {
            return reject(err);
          }

          for (var i = 0; i < rows.length; i++) {
            let event = {
              event_id: '',
              event_title: '',
              event_description: '',
              club_name: '',
              signed_up: Boolean
            };
            if (rows[i][0].value) {
              event.event_id = rows[i][0].value;
              event.event_title = rows[i][1].value;
              event.event_description = rows[i][2].value;
              event.club_name = rows[i][3].value;
              event.signed_up = rows[i][4].value;
              events.eventInfo.push(event);
            }
          }
          return resolve(events);
        });
        request.addParameter('username', TYPES.VarChar, username);
        connection.callProcedure(request);
      });
    });
  }
}

/*
Gets information about the events for this club
Uses stored procedure 'fetchEventsByClub'
Returns a json of all event info for the club
*/
function fetchEventsByClub(clubName) {
  var events = {
    eventInfo: []
  };
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }
      var request1 = new Request('fetchEventsByClub', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        for (var i = 0; i < rows.length; i++) {
          event = {
            event_id: '',
            event_title: '',
            event_description: '',
            signed_up: []
          };
          if (rows[i][0].value) {
            event.event_id = rows[i][0].value;
            event.event_title = rows[i][1].value;
            event.event_description = rows[i][2].value;
            events.eventInfo.push(event);
          }
        }
        pool.acquire(function (err, connection) {
          if (err) {
            reject(err);
          }
          var request2 = new Request('fetchEventsSignedUp', function(err, rowCount, rows) {
            setImmediate(() => {connection.close();});
            if (err) {
              return reject(err);
            }
            var signedUp = [];
            for (var i = 0; i < rows.length; i++) {
              let signedUpUsers = {
                rose_username: '',
                name: '',
                email: '',
                event_id: ''
              };
              if (rows[i][0].value) {
                signedUpUsers.rose_username = rows[i][0].value;
                signedUpUsers.name = rows[i][1].value;
                signedUpUsers.email = rows[i][2].value;
                signedUpUsers.event_id = rows[i][3].value;
              }
              signedUp.push(signedUpUsers);
            }
            let j = 1;
            let eventsIndex = 0;
            for (var i = 0; i < signedUp.length; i++) {
              user = {
                rose_username: '',
                name: '',
                email: ''
              };
              user.rose_username = signedUp[i].rose_username;
              user.name = signedUp[i].name;
              user.email = signedUp[i].email;
              console.log(signedUp[i]);
              if (signedUp[i].event_id = j) {
                events.eventInfo[eventsIndex].signed_up.push(user);
              }
              else {
                eventsIndex++;
                j++;
              }
            }
            return resolve(events);
          });
          request2.addParameter('clubName', TYPES.VarChar, clubName);
          connection.callProcedure(request2);
        })
      });
      request1.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request1);
    });
  });
}

/*
Gets information about the event
Uses stored procedure 'getEventInformation'
Returns a json of all event info and who is attending 
*/
function fetchEvent(eventID) {
  let eventInfo = {
    event_id: '',
    event_title: '',
    event_description: '',
    signed_up: []
  };
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }
      var request = new Request('fetchEvent', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        for (var i = 0; i < rows.length; i++) {
          if (rows[i][0].value) {
            eventInfo.event_id = rows[i][0].value;
            eventInfo.event_title = rows[i][1].value;
            eventInfo.event_description = rows[i][2].value;
          }
        }
        pool.acquire(function (err, connection) {
          if (err) {
            reject(err);
          }
          var request2 = new Request('fetchEventByID', function(err, rowCount, rows) {
            setImmediate(() => {connection.close();});
            if (err) {
              return reject(err);
            }
            let signedUp = [];
            for (var i = 0; i < rows.length; i++) {
              let user = {
                rose_usename: '',
                name: '',
                email: ''
              };
              if (rows[i][0].value) {
                user.rose_usename = rows[i][0].value;
                user.name = rows[i][1].value;
                user.email = rows[i][2].value;
                signedUp.push(user);
              }
            }
            eventInfo.signed_up = signedUp;
            return resolve(eventInfo);
          });
          request2.addParameter('event_id', TYPES.Int, eventID);
          connection.callProcedure(request2);
        });
      });
      request.addParameter('event_id', TYPES.Int, eventID);
      connection.callProcedure(request);
    });
  });
}

/*
Gets all rooms and which event it is being used for
Uses the stored procedure 'fetchAllRooms'
Returns the information about the room
*/
function fetchAllRooms() {
  var rooms = {
    roomInfo: []
  };
  return new Promise((resolve, request) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Request('fetchAllRooms', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        var room = {
          room: '',
          building: '',
          reservation: {
            start: '',
            end: '',
            event_name: ''
          }
        }
        for (var i = 0; i < rows.length; i++) {
          if (rows[i][0].value) {
            room.room = rows[i][0].value;
            room.building = rows[i][1].value;
            room.reservation.start = rows[i][2].value;
            room.reservation.end = rows[i][3].value;
            room.eventTitle = rows[i][4].value;
            rooms.roomInfo.push(room);
          }
        }
        return resolve(rooms);
      });
      connection.callProcedure(request);
    });
  });
}

function fetchRoom(roomNumber, date) {
  var roomInfo = {
    start: '',
    end: '',
    event_name: ''
  };
  return new Promise((resolve, request) => {
    pool.acquire(function (err, connection) {
      if (err) {
          reject(err);
      }

      var request = new Requet('fetchSomeRooms', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        for (var i = 0; i < rows.length; i++) {
          if (rows[i][0].value) {
            roomInfo.start = rows[i][0].value;
            roomInfo.end = rows[i][1].value;
            roomInfo.event_name = rows[i][2].value;
          }
        }
        return resolve(roomInfo);
      });
      request.addParameter('roomNumber', TYPES.VarChar, roomNumber);
      request.addParameter('date', TYPES.SmallDateTime, date);
      connection.callProcedure(request);      
    });
  });
}

/*
Sets the filePath given a file_id
Uses the stored procedure 'setFilePath'
Returns a string signifying the file path
*/

// TODO: Finish
function setFilePathById(file_id) {

    return "";
}

/*
Checks if the user is an officer for that club
Uses the stored procedure 'checkIsOfficer'
Returns true if so, false if the user is not an officer
*/
function isOfficer(username, clubName) {
  return new Promise((resolve, reject) => {
    pool.acquire(function (err, connection) {
      if (err) {
        reject(err);
      }

      var request = new Request('checkIsOfficer', function(err, rowCount, rows) {
        setImmediate(() => {connection.close();});
        if (err) {
          return reject(err);
        }
        if (rows.length > 0) {
          return resolve(true);
        }
        return resolve(false);
      });
      request.addParameter('username', TYPES.VarChar, username);
      request.addParameter('clubName', TYPES.VarChar, clubName);
      connection.callProcedure(request);
    });
  });
}

/*
Gets the clubName from the eventID
Uses the stored procedure 'getClubFromEvent'
Returns the name of the club
*/
function getClubFromEvent(eventID) {
  pool.acquire(function (err, connection) {
    if (err) {
      reject(err);
    }

    var request = new Request('getClubFromEvent', function(err, rowCount, rows) {
      setImmediate(() => {connection.close();});
      if (err) {
        return err;
      }
      return rows[0][0].value;
    });
    request.addParameter('event_id', TYPES.Int, eventID);
    connection.callProcedure(request);    
  });
}

// Verify these are all correct and here
module.exports = {
    isRegistered: isRegistered,
    createUser: createUser,
    fetchUser: fetchUser,
    signUpForClub: signUpForClub,
    subscribeToClub: subscribeToClub,
    unsignUpForClub: unsignUpForClub,
    unsubscribeClub: unsubscribeClub,
    fetchClub: fetchClub,
    getAllMembersByClubName: getAllMembersByClubName,
    getAllSubscribersByClubName: getAllSubscribersByClubName,
    getAllManagersByClubName: getAllManagersByClubName,
    getAllFilesByClubName: getAllFilesByClubName,
    fetchAllClubs: fetchAllClubs,
    signUpForEvent: signUpForEvent,
    unsignUpForEvent: unsignUpForEvent,
    createEvent: createEvent,
    cancelEvent: cancelEvent,
    fetchAllEvents: fetchAllEvents,
    fetchEventsByClub: fetchEventsByClub,
    fetchEvent: fetchEvent,
    fetchAllRooms: fetchAllRooms,
    fetchRoom: fetchRoom,
    setFilePathById: setFilePathById
};
