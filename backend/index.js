const TYPES = require('tedious').TYPES;
const Request = require('tedious').Request;
var Connection = require('tedious').Connection;
var config = {
    userName: 'clubUser',
    password: 'clubPassword',
    server: 'titan.csse.rose-hulman.edu',
    options: {
        database: 'RHIT_Club_App',
        rowCollectionOnRequestCompletion: true
    }
};
var connection = new Connection(config, function(err) {
  if (err) {
    console.log("Issue connecting to database: ", err);
    connection.close();
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
    var request = new Request('getUserRegistered', function(err, rowCount, rows) {
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
    var request = new Request('createNewUser', function(err, rowCount, rows) {
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
    manages: {
      clubName: [],
      title: []
    }
  };
  return new Promise((resolve, reject) => {
    var request1 = new Request('fetchRegisteredUser', function(err, rowCount, rows) {
      if (err) {
        return reject(err);
      }
      for (var i = 0; i < rows.length; i++) {
        user.rose_username = rows[i][0].value;
        user.name = rows[i][1].value;
        user.email = rows[i][2].value;
      }

      var request2 = new Request('fetchUserClubMember', function(err, rowCount, rows) {
        if (err) {
          return reject(err);
        }
        for (var i = 0; i < rows.length; i++) {
          user.signed_up.push(rows[i][0].value);
        }

        var request3 = new Request('fetchUserClubSubscribe', function(err, rowCount, rows) {
          if (err) {
            return reject(err);
          }
          for (var i = 0; i < rows.length; i++) {
            user.subscribed.push(rows[i][0].value);
          }

          var request4 = new Request('fetchUserOfficer', function(err, rowCount, rows) {
            if (err) {
              return reject(err);
            }
            for (var i = 0; i < rows.length; i++) {
              user.manages.clubName.push(rows[i][0].value);
              user.manages.title.push(rows[i][1].value);
              return resolve(user);
            }
          });
          request4.addParameter('username', TYPES.VarChar, username);
          connection.callProcedure(request4);
        });
        request3.addParameter('username', TYPES.VarChar, username);
        connection.callProcedure(request3);
      });
      request2.addParameter('username', TYPES.VarChar, username);
      connection.callProcedure(request2);
    });
    request1.addParameter('username', TYPES.VarChar, username);
    connection.callProcedure(request1);   
  });
}

/*
Signs a user up for a club
Uses the stored procedure 'addUserToClub'
Returns a string notifying the user has been signed up for the club
*/
function signUpForClub(username, clubName) {
  return new Promise((resolve, reject) => {
    var request = new Request('addUserToClub', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({ message: "Signed user up for club"});
    });
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('clubName', TYPES.VarChar, clubName);
    connection.callProcedure(request);
  });
}

/*
Subscribes user to a club
Uses the stored procedure 'subscribeUserToClub'
Returns a string notifying the user has been subscribed to the club
*/
function subscribeToClub(username, clubName) {
  return new Promise((resolve, reject) => {
    var request = new Request('subscribeUserToClub', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({message: "Subscribed user to club"});
    });
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('clubName', TYPES.VarChar, clubName);
    connection.callProcedure(request);
  });
}

/*
Removes the user from a club
Uses the stored procedure 'leaveClub'
Returns a string notifying the user has been removed from the club
*/
function leaveClub(username, clubName) {
  return new Promise((resolve, reject) => {
    var request = new Request('leaveClub', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({messsage: "User has left club"});
    });
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('clubName', TYPES.VarChar, clubName);
    connection.callProcedure(request);
  });
}

/*
Unsubscribes the user from a club
Uses the stored procedure 'unsubscribeClub'
Returns a string notifying the user has been unsubscribed from the club
*/
function unsubscribeClub(username, clubName) {
  return new Promise((resolve, reject) => {
    var request = new Request('unsubscribeClub', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({message: "User has unsubscribed from club"});
    });
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('clubName', TYPES.VarChar, clubName);
    connection.callProcedure(request);
  });
}

/*
Gets the information about a club
Uses the stored procedure 'getClubInformation'
Returns a json of the club information including who is signed up and subscribed for the club
*/
function fetchClub(clubName) {
  var clubInfo = {
    clubName: '',
    clubType: '',
    clubDescription: '',
    signedUpUser: [],
    subscribedUser: [],
    officers: {
      username: [],
      title: []
    }
  };
  return new Promise((resolve, reject) => {
    var request = new Request('getClubInformation', function(err, rowCount, rows) {
      if (err) {
        return reject(err);
      }
      for (var i = 0; i < rows.length; i++) {
        clubInfo.clubName = rows[i][0].value;
        clubInfo.clubType = rows[i][1].value;
        clubInfo.clubDescription = rows[i][2].value;
        clubInfo.signedUpUser.push(rows[i][3].value);
        clubInfo.subscribedUser.push(rows[i][4].value);
        clubInfo.officers.username.push(rows[i][5].value);
        clubInfo.officers.title.push(rows[i][6].value);
      }
      return resolve(clubInfo);
    });
    request.addParameter('clubName', TYPES.VarChar, clubName);
    connection.callProcedure(request);
  });
}

/*
This function fetches all clubs in the database. If there is a username provided, select all clubs for that user. If not, select all clubs
Uses the stored procedure 'fetchClubs'
Returns a JSON of all club basic info: Name, Type, and Description
*/
function fetchAllClubs(username) {
  var clubInfo = {
    clubName: [], 
    clubType: [],
    clubDescription: []
  };
  if (username == null) {
      return new Promise((resolve, reject) => {
        var request = new Request('fetchClubs', function(err, rowCount, rows) {
          if (err) {
            return reject(err);
          }
          for (var i = 0; i < rows.length; i++) {
            clubInfo.clubName.push(rows[i][0].value);
            clubInfo.clubType.push(rows[i][1].value);
            clubInfo.clubDescription.push(rows[i][2].value);
          }
          return resolve(clubInfo);
        });
        connection.callProcedure(request);
    });
  }
  else {
    return new Promise((resolve, reject) => {
        var request = new Request('fetchUserClubs', function(err, rowCount, rows) {
          if (err) {
            return reject(err);
          }
          for (var i = 0; i < rows.length; i++) {
            clubInfo.clubName.push(rows[i][0].value);
            clubInfo.clubType.push(rows[i][1].value);
            clubInfo.clubDescription.push(rows[i][2].value);
          }
          return resolve(clubInfo);
        });
        connection.callProcedure(request);
    });
  }
}

/*
Deletes a club given the club name
Uses the stored procedure 'deleteClub'
Returns a message signifying the club has been deletd
*/
function deleteClub(clubName) {
  return new Promise((resolve, reject) => {
    var request = new Request('deleteClub', function(err) {
      if (err) {
        return reject(err)
      }
      return resolve({message: "Deleted Club"});
    });
    request.addParameter('clubName', TYPES.VarChar, clubName);
    connection.callProcedure(request);
  })
}

/*
Signs the user up for an event
Uses the stored procedure 'signUserUpForEvent'
Returns a string signifying the user has signed up for the event
*/
function signUpForEvent(username, eventID) {
  return new Promise((resolve, reject) => {
    var request = new Request('signUserUpForEvent', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({message: "Signed user up for event"});
    });
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('event_id', TYPES.VarChar, eventID); 
    connection.callProcedure(request);
  });
}

/*
Removes the user from an event
Uses the stored procedure 'removeUserFromEvent'
Returns a string signifying the user is no longer signed up for the event
*/
function unsignUpForEvent(username, eventID) {
  return new Promise((resolve, reject) => {
    var request = new Request('removeUserFromEvent', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({message: "User has left club event"});
    });
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('event_id', TYPES.VarChar, eventID);
    connection.callProcedure(request);
  });
}

/*
Creates an event -> Must be club officer
Uses the stored procedure 'createClubEvent'
Returns a string signifying the event has been created
*/
function createEvent(clubName, reqBody) {
  // Need to ensure that only a club officer is doing this  ------------------------------------------------------------------
  // Need to pass through username too then ----------------------------------------------------------------------------------
  let eventID = req.body.eventID;
  let eventTitle = req.body.eventTitel;
  let description = req.body.description;
  let startTime = req.body.startTIme;
  let endTime = req.body.endTime;
  let roomNumber = req.body.roomNumber;
  let building = req.body.building;
  return new Promise((resolve, reject) => {
    var request = new Request('createClubEvent', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({message: "The club event has been created"});
    });
    let eventID = Math.round(Math.random() * 1000000);
    request.addParameter('clubName', TYPES.VarChar, clubName);
    request.addParameter('event_id', TYPES.VarChar, eventID);
    request.addParameter('eventTitle', TYPES.VarChar, eventTitle);
    request.addParameter('eventDescription', TYPES.VarChar, description);
    request.addParameter('startTime', TYPES.SmallDateTime, startTime);
    request.addParameter('endTime', TYPES.SmallDateTime, endTime);
    request.addParameter('roomNumber', TYPES.VarChar, roomNumber);
    request.addParameter('building', TYPES.VarChar, building);
    connection.callProcedure(request);
  });
}

/*
Cancels the event -> Must be club officer
Uses the stored procedure 'cancelEvent'
Returns a string signifying the event has been cancelled
*/
function cancelEvent(eventID) {
  // Need to ensure that only a club officer is doing this  ------------------------------------------------------------------
  // Need to pass through username too then ----------------------------------------------------------------------------------
  return new Promise((resolve, reject) => {
    var request = new Request('cancelEvent', function(err) {
      if (err) {
        return reject(err);
      }
      return resolve({message: "The club event has been cancelled"});
    });
    request.addParameter('event_id', TYPES.VarChar, eventID);  
    connection.callProcedure(request);
  });
}

/*
Fetch all events this user can be a part of
Uses the stored procedure 'fetchUserEvents'
Returns a JSON of the events
*/
function fetchAllEvents(username) {
  var eventInfo = {
    eventTitle: [],
    eventDescription: [],
    attending: []
  };
  if (username == null) {
    return new Promise((resolve, reject) => {
      var request = new Request('fetchAllEvents', function(err, rowCount, rows) {
        if (err) {  
          return reject(err);
        }
        for (var i = 0; i < rows.length; i++) {
          eventInfo.eventTitle.push(rows[i][0].value);
          eventInfo.eventDescription.push(rows[i][1].value);
          eventInfo.attending.push(rows[i][2].value)
        }
        return resolve(eventInfo);
      });
      connection.callProcedure(request);
    })
  }
  else {
    return new Promise((resolve, reject) => {
      var request = new Request('fetchUserEvents', function(err, rowCount, rows) {
        if (err) {
          return reject(err);
        }
        for (var i = 0; i < rows.length; i++) {
          eventInfo.eventTitle.push(rows[i][0].value);
          eventInfo.eventDescription.push(rows[i][1].value);
        }
        return resolve(eventInfo);
      });
      request.addParameter('username', TYPES.VarChar, username);
      connection.callProcedure(request);
    })
  }
}

/*
Gets information about the events for this club
Uses stored procedure 'fetchEventsByClub'
Returns a json of all event info for the club
*/
function fetchEventsByClub(clubName) {
  var eventInfo = {
    eventTitle: [],
    eventDescription: []
  };
  return new Promise((resolve, reject) => {
    var request = new Request('fetchEventsByClub', function(err, rowCount, rows) {
      if (err) {
        return reject(err);
      }
      for (var i = 0; i < rows.length; i++) {
        eventInfo.eventTitle.push(rows[i][0].value);
        eventInfo.eventDescription.push(rows[i][1].value);
      }
      return resolve(eventInfo);
    });
    request.addParameter('clubName', TYPES.VarChar, clubName);
    connection.callProcedure(request);
  })
}

/*
Gets information about the event
Uses stored procedure 'getEventInformation'
Returns a json of all event info and who is attending 
*/
function fetchEvent(eventID) {
  var eventInfo = {
    eventTitle: [],
    eventDescription: []
  };
  return new Promise((resolve, reject) => {
    var request = new Request('fetchEvent', function(err, rowCount, rows) {
      if (err) {
        return reject(err);
      }
      for (var i = 0; i < rows.length; i++) {
        eventInfo.eventTitle.push(rows[i][0].value);
        eventInfo.eventDescription.push(rows[i][1].value);
      }
      return resolve(eventInfo);
    });
    request.addParameter('event_id', TYPES.VarChar, eventID);
    connection.callProcedure(request);
  })
}

/*
Gets all rooms and which event it is being used for
Uses the stored procedure 'fetchAllRooms'
Returns the information about the room
*/
function fetchAllRooms() {
  var roomInfo = {
    roomNumber: [],
    building: [],
    eventTitle: []
  };
  return new Promise((resolve, request) => {
    var request = new Request('fetchAllRooms', function(err, rowCount, rows) {
      if (err) {
        return reject(err);
      }
      for (var i = 0; i < rows.length; i++) {
        roomInfo.roomNumber.push(rows[i][0].value);
        roomInfo.building.push(rows[i][1].value);
        roomInfo.eventTitle.push(rows[i][2].value);
      }
      return resolve(roomInfo);
    });
    connection.callProcedure(request);
  })
}

function fetchRoom(roomNumber, date) {
  var roomInfo = {
    roomNumber: [],
    building: [],
    eventTitle: []
  };
  return new Promise((resolve, request) => {
    var request = new Requet('fetchSomeRooms', function(err, rowCount, rows) {
      if (err) {
        return reject(err);
      }
      for (var i = 0; i < rows.length; i++) {
        roomInfo.roomNumber.push(rows[i][0].value);
        roomInfo.building.push(rows[i][1].value);
        roomInfo.eventTitle.push(rows[i][2].value);
      }
      return resolve(roomInfo);
    });
    request.addParameter('roomNumber', TYPES.VarChar, roomNumber);
    request.addParameter('date', TYPES.SmallDateTime, date);
    connection.callProcedure(request);
  })
}

/*
Sets the filePath given a file_id
Uses the stored procedure 'setFilePath'
Returns a string signifying the file path
*/
function setFilePathById(file_id) {

    return "";
}

// Verify these are all correct and here
module.exports = {
    isRegistered: isRegistered,
    createUser: createUser,
    fetchUser: fetchUser,
    signUpForClub: signUpForClub,
    subscribeToClub: subscribeToClub,
    leaveClub: leaveClub,
    unsubscribeClub: unsubscribeClub,
    fetchClub: fetchClub,
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