const fs = require('fs');
const path = require('path');
const express = require('express');
const PORT = process.env.PORT || 3009;
const app = express();
//provide file path to 'public' folder to allow access to css and js files
app.use(express.static('public'));
//middleware => parse incoming POST data and convert to key/value pair; 
//extended:true says to look as deep as possible for nested sub-arrays
app.use(express.urlencoded({ extended: true}));
//parse incoming JSON data
app.use(express.json());
//require the data for route creation for front-end data request
const  { animals } = require('./data/animals');

//filter by query parameter
function filterByQuery(query, animalsArray){
    let personalityTraitsArray = [];
    // Note that we save the animalsArray as filteredResults here:
    let filteredResults = animalsArray;
    if (query.personalityTraits) {
      // Save personalityTraits as a dedicated array.
      // If personalityTraits is a string, place it into a new array and save.
      if (typeof query.personalityTraits === 'string') {
        personalityTraitsArray = [query.personalityTraits];
      } else {
        personalityTraitsArray = query.personalityTraits;
      }
      // Loop through each trait in the personalityTraits array:
      personalityTraitsArray.forEach(trait => {
        // Check the trait against each animal in the filteredResults array.
        // Remember, it is initially a copy of the animalsArray,
        // but here we're updating it for each trait in the .forEach() loop.
        // For each trait being targeted by the filter, the filteredResults
        // array will then contain only the entries that contain the trait,
        // so at the end we'll have an array of animals that have every one 
        // of the traits when the .forEach() loop is finished.
        filteredResults = filteredResults.filter(
          animal => animal.personalityTraits.indexOf(trait) !== -1
        );
      });
    }
    if(query.diet){
        filteredResults = filteredResults.filter(animal => animal.diet === query.diet);
    }
    if(query.species){
        filteredResults = filteredResults.filter(animal => animal.species === query.species);
    }
    if(query.name){
        filteredResults = filteredResults.filter(animal => animal.name === query.name);
    }
    return filteredResults;
}

function findById(id, animalsArray) {
  const result = animalsArray.filter(animal => animal.id === id)[0];
  return result;
}

//take data from req.body and add to animalsArray
function createNewAnimal(body, animalsArray){
  const animal = body;
  //add created animal to animalsArry
  animalsArray.push(animal);
  //write in new animal data into json file
  fs.writeFileSync(
    //write json file in data subdirectory and join with directory of the file we executed originally
    path.join(__dirname, './data/animals.json'),
    //convert data to json; null = dont edit existing data, 2 = create white space between values
    JSON.stringify({ animals: animalsArray }, null, 2)
  );

  return animal;
}

//add the route to get animal results
app.get('/api/animals', (req, res) => {
    let results = animals;
    if(req.query){
        results=filterByQuery(req.query, results);
    }
    res.json(results);
});

//add the route to search by animal
app.get('/api/animals/:id', (req, res) => {
  const result = findById(req.params.id, animals);
  if (result) {
    res.json(result);
  } else {
    res.send(404);
  }
});

//allow users to post data to server from client
app.post('/api/animals', (req, res) => {
  // add "id" to body and set id based on what the next index of the array will be
  req.body.id = animals.length.toString();

  //run validateAnimal and pass in req.body info as parameter
  //if any data in req.body is incorrect, send error 404 back
  if(!validateAnimal(req.body)){
    res.status(404).send('The animal is not properly formatted.')
  }else{
  //add animal to json file and animals array in this function
  const animal = createNewAnimal(req.body, animals);
  res.json(animal);
  }
});

//validate info for adding animals by adding const animal as parameter
function validateAnimal(animal) {
  //if animal.name doesnt exist, or is not a string, return false
  if(!animal.name || typeof animal.name !== 'string') {
    return false;
  }
  //if animal.species doesnt exist, or is not a string, return false
  if(!animal.species || typeof animal.species !== 'string'){
    return false;
  }
  //if animal.diet doesnt exist, or is not a string, return false
  if(!animal.diet || typeof animal.diet !== 'string'){
    return false;
  }
  //if animal.personalityTraits doesnt exist, or is not an array, return false
  if(!animal.personalityTraits || !Array.isArray(animal.personalityTraits)){
    return false;
  }
  //if any of these are strings, return true and submit info
  return true;
}

//create route to display index.HTML page in the browser
app.get('/', (req, res) => {
  //locate file we want to send to the server to display
  res.sendFile(path.join(__dirname, './public/index.html'));
});
//create route to display animals.HTML page in the browser
app.get('/animals', (req, res) => {
  //locate file we want to send to the server to display
  res.sendFile(path.join(__dirname, './public/animals.html'));
});
//create route to display zookeepers.HTML page in the browser
app.get('/zookeepers', (req, res) => {
  //locate file we want to send to the server to display
  res.sendFile(path.join(__dirname, './public/zookeepers.html'));
});
//create wikdcard route to catch requests for non-existant pages
app.get('*', (req, res) => {
  //locate file we want to send to the server to display
  res.sendFile(path.join(__dirname, './public/index.html'));
});

app.listen(PORT, () => {
  console.log(`API server now on port ${PORT}!`);
});
