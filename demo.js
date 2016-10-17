//import the library
const Rosalina = require('./lib');

//Define an instance with a remote base url.
const app = new Rosalina('http://localhost:7654');

//Define which headers will be sent to the backend.
app.map_headers({
 'Auth-Token': function(value) {
   return {
     'Authorization': `Token=${value}`
   }
 }
});

app.from('/').to('/').post({
  a: 'a',
  b: 'b'
});

app.ready().listen(3000);
