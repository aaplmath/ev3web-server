$(document).foundation();
$('button').attr('disabled', true);
if (document.body.style.webkitFilter === undefined && document.body.style.filter === undefined) {
    alert('You are using a browser incapable of rendering certain stylistic effects. As a result, your experience of this website will be diminished. Please use a modern browser (Firefox, Safari, or Google Chrome) for an optimal experience.');
}
var name = prompt("Please enter your name (this will only be used to identify you in the queue):");
$('#waiting-name').text(name);

var socket = io();
socket.emit('queue-applicant', {"name": name});
socket.on('queue-res', function(res) {
    if (res !== 'ok') {
        name = "";
        alert(res);
    }
    errorMessage('Unable to register username. Reload the page to try again.');
});
socket.on('kick-user', function(data) {
    if (data === name) {
        errorMessage('You have been kicked by an administrator.');
    }
});
socket.on('enroll-user', function(data) {
    if (data.name === name) {
        $('button').prop('disabled', false);
        $('.waiting').css('display', 'none');
        $('.control-panel').css('webkit-filter', 'none');
        $('.control-panel').css('filter', 'none');
        for (var i = 0; i < data.console.length; i++) {
          prependConsole(data.console[i]);
        }
    }
});
socket.on('console-message', function(data) {
  prependConsole(data);
});
socket.on('gyro-sample', function(data) {
  $('#gyro').text(data);
});
socket.on('infrared-sample', function(data) {
  $('#infrared').text(data);
  if (parseFloat(data) < 0.2) {
    $('#infrared').css('color', 'red');
  } else {
    $('#infrared').css('color', 'black');
  }
});
socket.on('color-sample', function(data) {
  $('#red').text(data[0]);
  $('#green').text(data[1]);
  $('#blue').text(data[2]);
});

$('.control-button').click(function(e) {
  e.preventDefault();
  socket.emit('robot-command', $(this).attr('id'));
});
$('#led-color-picker').change(function(e) {
  e.preventDefault();
  socket.emit('led-color', this.selectedIndex);
});

function prependConsole(data) {
  var p = $('<p>');
  $(p).text(data);
  $('#console').prepend(p);
}

function errorMessage(message) {
    $('.control-panel').css('display', 'none');
    $('.waiting').css('display', 'block');
    $('#waiting-text').css('color', 'red');
    $('#waiting-text').text(message);
}
