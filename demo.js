//import the library
const Rosalina = require('rosalina');

//Define an instance with a remote base url.
const app = new Rosalina('http://localhost:7654');

// Define which headers will be sent to the backend.
// Only the defined headers will be sent, anything else is ignored.
app.map_headers({
 'Auth-Token': function(value) {
   return {
     'Authorization': `Token=${value}`
   }
 },
 'X-Header-Field': 'X-Header-Backend'
});

// Defining body mappings from the local Rosalina app to the remote endpoint.
// Only the defined fields will be sent, anything else is ignored.
app.from('/').to('/').post({
  field_name_received: 'field_name_sent',
  rosalina_field: 'backend_field'
});

//Ready and serve.
app.listen(3000);
