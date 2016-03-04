var express = require('express');
var app = express();
var http = require('http');
var exec = require('child_process').exec;
var fs = require('fs');
var htmlToText = require('html-to-text');

var options = {
      host: 'open.canada.ca',
      port: 80,
      path: '/data/api/action/package_show?id=e5f4a98e-0ccf-4e5e-9912-d308b46c5a7f',
      method: 'GET',
      headers: {'Accept': 'application/json','Accept-Language': 'en'}
};

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));

app.use(express.bodyParser({ keepExtensions:true, uploadDir: __dirname + '/public/downloads' }));
app.use(app.router);
app.use(express.static(__dirname + '/public'));

var __servings = __dirname + "/en/servings_per_day-en.json";
var __foods = __dirname + "/en/foods-en.json";
var __groups = __dirname + "/en/foodgroups-en.json";
var __direction = __dirname + "/en/fg_directional_satements-en.json";

var fileGet = function(url, callback) {
  var arr = url.split("/");
  var filename = arr[arr.length -1];
  child = exec('wget ' +url, function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    callback(filename);
  });
}

app.get('/',function(req,res){
  var done = function(pd, vd, gd, dd, md) {
    res.render("index", {pd: pd, vd: vd, gd: gd, dd: dd, md:md})
  }
  var servings = fs.readFileSync(__servings);
  var foods = fs.readFileSync(__foods);
  var groups = fs.readFileSync(__groups);
  var direction = fs.readFileSync(__direction);
  var jsonFoods = JSON.parse(foods);
  var jsonServings = JSON.parse(servings);
  var jsonGroups = JSON.parse(groups);
  var jsonDirection = JSON.parse(direction);
  //console.log('FOOD: '+JSON.stringify(jsonFoods,null,2,true));
  foodData(jsonFoods, done);
});

var gather = function() {
  var serverReq = http.request(options, function(res) {
    var body = '';
    res.on('error', function(e) {
      console.log('ERROR: '+e)
    });
    res.on('data', function(d) {
      body  += d;
    });
    res.on('end', function() {
      jsonBody = JSON.parse(body);
      
      for (i=0;i<jsonBody.result.resources.length;i++) { 
        console.log('THE FORMAT: '+jsonBody.result.resources[i].format);
        if (jsonBody.result.resources[i].format == "JSON") {
          fileGet(jsonBody.result.resources[i].url, function(file) {
            console.log('FILENAME: '+file);
            child = exec('unzip -o ' +file, function (error, stdout, stderr) {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if (error !== null) {
                console.log('exec error: ' + error);
              }
            });
          });         
        } 
      }
    });
  });
  serverReq.end();
};

if (!fs.existsSync(__servings)) {
   console.log('GOT HERE: '+__servings);
   gather();
}
  
var foodData = function(jsonFoods, done) {
  //console.log('FOOD: '+JSON.stringify(jsonFoods,null,2,true));
  var name = '';
  var vegData = {};
  vegData.cols = [];
  vegData.rows = [];
  vegData.cols[0] = {"food":"","label":"Food Name","type":"string"};
  vegData.cols[1] = {"subject":"","label":"Serving Size","type":"string"};

  var grainData = {};
  grainData.cols = [];
  grainData.rows = [];
  grainData.cols[0] = {"food":"","label":"Food Name","type":"string"};
  grainData.cols[1] = {"subject":"","label":"Serving Size","type":"string"};

  var dairyData = {};
  dairyData.cols = [];
  dairyData.rows = [];
  dairyData.cols[0] = {"food":"","label":"Food Name","type":"string"};
  dairyData.cols[1] = {"subject":"","label":"Serving Size","type":"string"};

  var meatData = {};
  meatData.cols = [];
  meatData.rows = [];
  meatData.cols[0] = {"food":"","label":"Food Name","type":"string"};
  meatData.cols[1] = {"subject":"","label":"Serving Size","type":"string"};

  var id = {};
  var pieFood = {};
  pieFood.cols = [];
  pieFood.rows = [];
  pieFood.cols[0] = {"id":"","label":"Category","type":"string"};
  pieFood.cols[1] = {"id":"","label":"Count","type":"number"};

  var v=0; var g=0; var d=0; var m=0;

  for (i=0; i<jsonFoods.foods.length; i++) {
    if (jsonFoods.foods[i].fgid in id) {
      id[jsonFoods.foods[i].fgid] += 1;
    } else {
      id[jsonFoods.foods[i].fgid] = 1;
    }
    switch(jsonFoods.foods[i].fgid) {
      case 'vf': 
        vegData.rows[v] = {"c":[{"v":jsonFoods.foods[i].food,"f":null},{"v":htmlToText.fromString(jsonFoods.foods[i].srvg_sz),"f":null}]};
        v++;
        break;
      case 'gr':
        grainData.rows[g] = {"c":[{"v":jsonFoods.foods[i].food,"f":null},{"v":htmlToText.fromString(jsonFoods.foods[i].srvg_sz),"f":null}]};
        g++;
        break;
      case 'da':
        dairyData.rows[d] = {"c":[{"v":jsonFoods.foods[i].food,"f":null},{"v":htmlToText.fromString(jsonFoods.foods[i].srvg_sz),"f":null}]};
        d++;
        break;
      case 'me':
        meatData.rows[m] = {"c":[{"v":jsonFoods.foods[i].food,"f":null},{"v":htmlToText.fromString(jsonFoods.foods[i].srvg_sz),"f":null}]};
        m++;
        break;
    }
  }

  for (i=0;i<Object.keys(id).length;i++) {
    switch(Object.keys(id)[i]) {
      case 'vf': 
        console.log('THE KEY: '+Object.keys(id)[i]);
        name='Vegetables';
        pieFood.rows[i] = {"c":[{"v":name,"f":null},{"v":id[Object.keys(id)[i]],"f":null}]};
        break;
      case 'gr':
        name='Grains and Pulses';
        pieFood.rows[i] = {"c":[{"v":name,"f":null},{"v":id[Object.keys(id)[i]],"f":null}]};
        break;
      case 'da':
        name='Dairy';
        pieFood.rows[i] = {"c":[{"v":name,"f":null},{"v":id[Object.keys(id)[i]],"f":null}]};
        break;
      case 'me':
        name='Meat';
        pieFood.rows[i] = {"c":[{"v":name,"f":null},{"v":id[Object.keys(id)[i]],"f":null}]};
        break;
    }
    
  }
  console.log('THE PIE: '+JSON.stringify(pieFood,null,true,2));
  done(pieFood, vegData, grainData, dairyData, meatData);    
}


app.listen(3000);