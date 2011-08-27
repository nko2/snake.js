// server.js 
var http = require('http'),
    nko = require('nko')('ERgE+tx6AIvYXqIr');

var app = http.createServer(function (req, res) { 
res.writeHead(200, { 'Content-Type': 'text/html' }); 
res.end('Hello, World<br/><br/><br/><br/><br/>We are the swarm'); 
});

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000, function() {
  console.log('Ready');

  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0)
    require('fs').stat(__filename, function(err, stats) {
      if (err) return console.log(err)
      process.setuid(stats.uid);
    });
});
console.log('Listening on ' + app.address().port);
