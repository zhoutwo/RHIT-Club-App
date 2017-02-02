const TYPES = require('tedious').TYPES;
const connection; // Addd connection here

/*
Checks if the user is already registerd
Uses the stored procedure 'getUserRegistered'
Returns true if the user is registered, false if they are not
*/
function isRegisterd(username) {
    return new Promise((resolve, reject) => {
        var request = new Request('getUserRegistered', function(err) {
            if (err) {
                return reject(err);
            }
        });
        request.addParameter('rose_username', TYPES.VarChar, username);
        connection.callProcedure(request);

        let done = true;
        const value = false;
        while (done) {
            request.on('doneProc', function(rowCount, more, returnStatus, rows) {
                done = more;
                if (!done) {
                    value = !!returnStatus;
                }
            });
        }
        return resolve(value);
    });
}

/*
Adds the user and information to the database
Uses the stored procedure 'createNewUser'
Returns the json of the user created
*/
function createUser(username, password, name) {
    var user = {
        'rose_username': '',
        'name': '',
        'email': ''
    }
    return new Promise((resolve, reject) => {
        var request = new Request('createNewUser', function(err) {
            if (err) {
                return reject(err);
            }
        });
        const email = username += "@rose-hulman.edu";
        request.addParameter('rose_username', TYPES.VarChar, username);
        request.addParameter('name', TYPES.VarChar, name);
        request.addParameter('password', TYPES.VarChar, password);
        request.addParameter('email', TYPES.VarChar, email);
        connection.callProcedure(request);

        let done = true;
        while (done) {
            request.on('doneProc', function(rowCount, more, returnStatus, rows) {
                done = more;
                if (!done) {
                    user.rose_username = returnStatus.rose_username;
                    user.name = returnStatus.name;
                    user.email = returnStatus.email;
                }
            });
        }
        return resolve(user);
    });
}

/*
Fetches the user information from the database
Uses the stored procedure 'fetchRegisteredUser'
Returns the json of the user fetched
*/
function fetchUser(username) {
    var user = {
        'rose_username': '',
        'name': '',
        'email': '',
        'signed_up': [],
        'subscribed': [],
        'manages': [{
            'club_name': '',
            'title': ''
        }]
    };
    return new Promise((resolve, reject) => {
        var request = new Request('fetchRegisteredUser', function(err) {
            if (err) {
                return reject(err);
            }
        });
        request.addParameter('rose_username', TYPES.VarChar, username);
        connection.callProcedure(request);

        let done = true;
        while (done) {
            request.on('doneProc', function(rowCount, more, returnStatus, rows) {
                done = more;
                if (!done) {
                    user.rose_username = returnStatus.rose_username;
                    user.name = returnStatus.name;
                    user.email = returnStatus.email;
                    // We need to run through the 'rows', which is the rows of SQL stored procedure
                    // I am not sure what type it is though, so I am going to assume it is an array
                    // and go from there
                    for (int i = 0; i < rows.length; i++) {
                        user.signed_up.push(rows[i].clubNameSignedUp);
                        user.subscribed.push(rows[i].clubNameSubscribed);
                        user.manages.push(rows[i].manages.club_name, rows[i].manages.title);

                    }
                }
            });
        }
        return resolve(user);
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
            request.addParameter('rose_username', TYPES.VarChar, username);
            request.addParameter('club_name', TYPES.VarChar, clubName);
            connection.callProcedure(request);

            let done = true;
            while (done) {
                request.on('doneproc', function(rowCount, more, returnStatus, rows) {
                    done = more;
                });
            }
        });
        return resolve("Signed user up for club");
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
            request.addParameter('rose_username', TYPES.VarChar, username);
            request.addParameter('club_name', TYPES.VarChar, clubName);
            connection.callProcedure(request);

            let done = true;
            while (done) {
                request.on('doneproc', function(rowCount, more, returnStatus, rows) {
                    done = more;
                });
            }
        });
        return resolve("Subscribed user to club");
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
            request.addParameter('rose_username', TYPES.VarChar, username);
            request.addParameter('club_name', TYPES.VarChar, clubName);
            connection.callProcedure(request);

            let done = true;
            while (done) {
                request.on('doneproc', function(rowCount, more, returnStatus, rows) {
                    done = more;
                });
            }
        });
        return resolve("User has left club");
    });
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
            request.addParameter('rose_username', TYPES.VarChar, username);
            request.addParameter('event_id', TYPES.VarChar, eventID);
            connection.callProcedure(request);

            let done = true;
            while (done) {
                request.on('doneproc', function(rowCount, more, returnStatus, rows) {
                    done = more;
                });
            }
        });
        return resolve("Signed user up for event");
    });
}

/*
Removes the user from an event
Uses the stored procedure 'removeUserFromEvent'
Returns a string signifying the user is no longer signed up for the event
*/
function cancelEventParticipation(username, eventID) {
    return new Promise((resolve, reject) => {
        var request = new Request('removeUserFromEvent', function(err) {
            if (err) {
                return reject(err);
            }
            request.addParameter('rose_username', TYPES.VarChar, username);
            request.addParameter('event_id', TYPES.VarChar, eventID);
            connection.callProcedure(request);

            let done = true;
            while (done) {
                request.on('doneproc', function(rowCount, more, returnStatus, rows) {
                    done = more;
                });
            }
        });
        return resolve("User has left club event");
    });
}

/*
Creates an event -> Must be club officer
Uses the stored procedure 'createClubEvent'
Returns a string signifying the event has been created
*/
function createEvent(clubName, eventID, startTime, endTime, roomNumber, building) {

}

/*
Cancels the event -> Must be club officer
Uses the stored procedure 'cancelClubEvent'
Returns a string signifying the event has been cancelled
*/
function cancelEvent(clubName, eventID) {
    // Not sure if this has to have any other checks, like rose_username, to make sure they are a manager
    // of that club. Shouldn't have to though because the option should only appear for club officers
    return new Promise((resolve, reject) => {
        var request = new Request('cancelClubEvent', function(err) {
            if (err) {
                return reject(err);
            }
            request.addParameter('club_name', TYPES.VarChar, clubName);
            request.addParameter('event_id', TYPES.VarChar, eventID);
            connection.callProcedure(request);

            let done = true;
            while (done) {
                request.on('doneproc', function(rowCount, more, returnStatus, rows) {
                    done = more;
                });
            }
        });
        return resolve("The club event has been cancelled");
    });
}

/*
Sets the filePath given a file_id
Uses the stored procedure 'setFilePath'
Returns a string signifying the file path
*/
function setFilePathById(file_id) {

    return "";
}

module.exports = {
    isRegisterd: isRegistered,
    createUser: createUser,
    fetchUser: fetchUesr,
    signUpForClub: signUpForClub
};
