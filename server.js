"use strict";

// Modules

let http = require('http');
let path = require('path');
let socketio = require('socket.io');
let express = require('express');
let crypto = require('crypto');

// Module implementations

let router = express();
let server = http.createServer(router);
let io = socketio.listen(server);

// Set up basic listening for server

router.use(express.static(path.resolve(__dirname, 'client')));

router.get('/admin', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'admin.html'));
})

// Socket stuff

var queue = [];
var robotConsole = [];
var activeUser = '';
let robot_nsp = io.of('/robot');

robot_nsp.on('connection', function(socket) {
  console.log('a robot connected');
  // TODO: Ensure this is actually the robot!
  socket.on('console-message', function(data) {
    io.emit('console-message', data);
  });
  socket.on('color-sample', function(data) {
    io.emit('color-sample', data);
  });
  socket.on('infrared-sample', function(data) {
    io.emit('infrared-sample', data);
  });
});

io.on('connection', function(socket) {
  console.log('a user connected');
  // queue management
  socket.on('admin-auth', function(data) {
    let sha = crypto.createHash('sha256');
    if (sha.update(data.pass).digest('hex') === "c64997986129d7126df491b95d39e3b83d9f738a82ae2a588742cb7564fb4b47") {
      var res = {
        'queue': queue,
        'active': activeUser,
        'status': 'ok'
      }
      socket.emit('admin-res', res);
      socket.join('admins');
      console.log('admin approved');
    } else {
      socket.emit('admin-res', 'incorrect');
      console.log('admin rejected');
    }
  });
  socket.on('queue-applicant', function(data) {
    if (queue.indexOf(data.name) > -1) {
      socket.emit('queue-res', 'Username already in use');
      console.log('denied queue applicant - duplicate username');
    } else if (data.name.trim() === '' || data.name === 'null') {
      socket.emit('queue-res', 'Invalid username entry');
      console.log('denied queue applicant for invalid username ' + data.name);
    } else {
      socket.queueUsername = data.name;
      queue.push(data.name);
      io.to('admins').emit('queue-entrant', data.name);
      console.log('accepted queue applicant ' + socket.queueUsername);
    }
  });
  
  socket.on('accept-user', function(data) {
    if (socket.rooms['admins']) {
      queue.splice(queue.indexOf(data), 1);
      if (activeUser) {
        io.emit('kick-user', activeUser);
        console.log('kicked user ' + activeUser + ' as part of acceptance procedure');
        activeUser = '';
      }
      var enrollData = {
        "name": data,
        "console": robotConsole
      };
      io.emit('enroll-user', enrollData);
      activeUser = data;
      console.log('enrolled user ' + activeUser);
    } else {
      console.log('denied non-admin accept request from user ' + socket.queueUsername + ' for user ' + data);
    }
  });
  socket.on('remove-user', function(data) {
    if (socket.rooms['admins']) {
      queue.splice(queue.indexOf(data), 1);
      if (data === '') {
        io.emit('kick-user', activeUser);
        console.log('kicked user ' + activeUser);
        activeUser = '';
      } else {
        io.emit('kick-user', data);
        console.log('kicked user ' + data);
      }
    } else {
      console.log('denied non-admin kick request from user ' + socket.queueUsername + ' for user ' + data);
    }
  });
  
  // robot handlers
  
  socket.on('emergency-stop', function() {
    robot_nsp.emit('emergency', '');
    console.log('****EMERGENCY STOP RECEIVED—ROBOT PROGRAM TO BE TERMINATED****');
    // TODO: The robot must handle this
  });
  
  socket.on('robot-command', function(data) {
    if (activeUser === socket.queueUsername) {
      robot_nsp.emit('command', data);
      console.log('accepted robot command ' + data);
      // TODO: The robot must handle this
    } else {
      console.log('denied robot command from ' + socket.queueUsername);
    }
  });
  
  socket.on('led-color', function(data) {
    // The data will be the exact number that we can feed to leJOS!
    console.log('set led color to state ' + data)
    robot_nsp.emit('led-color', data);
  })
  
  socket.on('disconnect', function() {
    if (activeUser === socket.queueUsername) {
      console.log('kicking active user ' + socket.queueUsername + ' on disconnect');
      io.emit('clear-active', activeUser);
      activeUser = '';
    }
    var index = queue.indexOf(socket.queueUsername);
    console.log('is ' + socket.queueUsername + ' getting removed?');
    if (index > -1) {
      queue.splice(index, 1);
      socket.emit('refresh-queue', queue);
    }
    if (socket.rooms['admin']) {
      console.log('admin disconnected');
    } else {
      console.log(socket.queueUsername + ' disconnected');
    }
  });
});

// Listen on port

server.listen(3000, function(){
  var addr = server.address();
  console.log('Server listening at', addr.address + ':' + addr.port);
});