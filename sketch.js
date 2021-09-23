//Declaration.
let mainCam;
let mainStar;
let stars = [];
let planets = [];
let planetTracks = [];

let loadedTextures = [];
let loadedNames = [];
let loadedFont;

//Load resource files.
function preload() {
  
  //Load background music.
  soundFormats('ogg');
  BGM = loadSound('Sound/BGM.ogg');
  
  //Load planet and star names from the text file to an array.
  loadedNames = loadStrings('Data/Names.txt');
  
  //Load font file.
  loadedFont = loadFont('Font/Quicksand.ttf');
  
  //Load multiple textures.
  totalTextures = 16;
  sun = loadImage('Pictures/Sun.jpg');
  for (var i = 0; i < totalTextures; i++) {
    loadedTextures[i] = loadImage('Pictures/' + i + '.jpg');
  }
}

//Initialize settings.
function setup() {

  //Initalize basic settings here.
  mainSettings = {
    FPS: 40,
    FOV: 1.8,
    UIDistance: 8,
    UISize: 15,
    closePlane: 0.01,
    farPlane: 10000,
    sensitivity: new p5.Vector(2, 2, 2),
  };
  
  //Create a canvas that uses WebGL.
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  //Create the UI panel at the bottom.
  DrawUI(windowWidth / 2 - 85, windowHeight - 150);
  
  //Create main camera in the 3D space.
  mainCam = createCamera();
  
  //Current focus planet.
  focusPlanet = -1;
  
  //Set frame rate.
  frameRate(mainSettings.FPS);
  
  //Remove the 3D wireframe on the models.
  noStroke();
  
  //Used when debugging to save time.
  noSplashScreen = false;
  
  // mimics the autoplay policy
  getAudioContext().suspend();
  audioStarted = false;
  audioFrame = 0;
  
  //Play background music.
  BGM.play();
  BGM.loop();
  
  //Generate the first universe.
  GenerateUniverse();
  
  //Set field of view and view distance to create a wider view angle.
  perspective(mainSettings.FOV,
              windowWidth / windowHeight,
              mainSettings.closePlane,
              mainSettings.farPlane);
}

//Start drawing every frame.
function draw() {
  //Seconds that splash screen takes.
  introTime = 15;
  
  //Calculate background color, creating darker color of the light.
  BGColor = color(map(mainStarSettings.lightColor.x, 0, 255, 0, 5),
                  map(mainStarSettings.lightColor.y, 0, 255, 0, 5),
                  map(mainStarSettings.lightColor.z, 0, 255, 0, 5));
  
  //Apply background color.
  background(BGColor);
  
  //Toggle planet camera view.
  if(focusPlanet>=0){PlanetCamera();}
  
  //Skip splash screen if debugging.
  if(noSplashScreen){ introTime = 0; }
  
  if(!audioStarted){
    
    //Make the background white.
    background(255);
    
    //Render text "Click to start".
    push();
      translate(0, -80, 0);
      fill(0);
      textFont(loadedFont);
      textAlign(CENTER, CENTER);
      textSize(windowWidth / 20);
      text("Click on the screen to start", 0, 0);
    pop();
    
  }
  
  //Main drawing loop.
  else if (frameCount - audioFrame > introTime * mainSettings.FPS && audioStarted) {
    
    //Set orbit control so that users can control the viewport using mouse buttons.
    orbitControl(mainSettings.sensitivity.x,
                 mainSettings.sensitivity.y,
                 mainSettings.sensitivity.z);

    //Render main star.
    mainStar.display();
    mainStar.UI();
    
    //Render stars and apply random noise movement.
    for (let i = 0; i < stars.length; i++) {
      stars[i].display();
      stars[i].move();
    }
    
    //Render planets and apply rotation around the main star.
    for (let i = 0; i < planets.length; i++) {
      
      //Orbit the planet with the orbit diameter stored in the same index of the planet track array.
      planets[i].orbit(planetTracks[i].diameter);
      planets[i].display();
      planets[i].UI();
    }
    
    //Render the planet orbit track.
    for (let i = 0; i < planetTracks.length; i++) {
      planetTracks[i].display();
    }
  }
  
  //Splash screen.
  else if (frameCount - audioFrame <= introTime * mainSettings.FPS && audioStarted) {
    
    //Make the background fading to black.
    background(lerpColor(color(255), BGColor, (frameCount - audioFrame) / (introTime * mainSettings.FPS)));
    
    //Keep camera in place.
    ResetCamera();
    
    //Render text "Only in the darkness can you see the stars".
    push();
      translate(0, -250, 0);
      textFont(loadedFont);
      textAlign(CENTER, CENTER);
      textSize(windowWidth / 18);
      text("Only in the darkness can you see the stars", 0, 0);
    pop();
    
    //Render text "Solar by Junyi Han".
    push();
      translate(0, 200, 0);
      textFont(loadedFont);
      textAlign(CENTER, CENTER);
      textSize(windowWidth / 40);
      text("Solar by Junyi Han", 0, 0);
    pop();
    
    //Render the white star in the middle.
    push();
      translate(0, 0, 0);
      sphere(mainStar.diameter,
             mainStarSettings.detailLevel,
             mainStarSettings.detailLevel);
    pop();
  }
}

//Initialize universe settings with values.
function UniverseSettings() {
  
  //Environmental star settings.
  starSettings = {
    
    //Controls the number of vertices on each model, smaller value, better performance, but lower quality.
    detailLevel: 4,
    
    //Sets the size of space in which stars can be generated.
    mapSize: 40,
    
    //Sets the max diameter of each star.
    maxDiameter: 10,
    
    //Sets the total amount of stars in the map.
    amount: 500,
    
    //Sets the smoothness of movement.
    moveIntensity: 0.02,
    
    //Sets the speed of movement, controlled by entropy [SlideBar].
    moveSpeed: entropy.value() * 0.8,
  };
  
  //Planet main settings.
  planetSettings = {
    
    //Controls the number of vertices on each model, smaller value, better performance, but lower quality.
    detailLevel: 40,
    
    //Sets the max diameter of each planet, controlled by entropy [SlideBar].
    maxDiameter: entropy.value() * 40,
    
    //Sets the max self orbit speed of each planet.
    maxOrbitSpeed: 2.5,
    
    //Sets the max distance between planet surfaces, controlled by entropy [SlideBar].
    maxDistance: entropy.value() * 300,
    
    //Sets the max movement speed around the main star.
    maxSpeed: 1.5,
    
    //Sets the total amount of planets, controlled by entropy [SlideBar].
    amount: entropy.value() * 15,
    
    //Controls the brightness of shadows on planets.
    ambientLight: 17,
  };
  
  //Settings for circles that indicate the track of planets.
  planetTrackSettings = {
    
    //Controls the number of vertices on each model, smaller value, better performance, but lower quality.
    detailLevel: 80,
    
    //The thickness of the circle.
    tubeDiameter: 0.5,
    
    //The transpanency of the circle.
    opacity: 20,
    
    //The color of the circle, controlled by track color [SlideBar]
    color: HexToRgb(lineColor.value()),
  };
  
  //Setting for the main star at the center.
  mainStarSettings = {
    
    //Controls the number of vertices on each model, smaller value, better performance, but lower quality.
    detailLevel: 40,
    
    //Sets the max diameter of the main star, controlled by entropy [SlideBar]
    maxDiameter: entropy.value() * 200,
    
    //Sets the max self orbit speed.
    maxOrbitSpeed: 2,
    
    //Sets the default position of the main star here, because planets and camera depends on it.
    position: new p5.Vector(0, 0, 0),
    
    //Sets the main star tint, and also the lighting color.
    //Setting it using vector enables other functions to access its RGB values.
    lightColor: new p5.Vector(random(0, colorfulness.value() * 225),
                              random(0, colorfulness.value() * 225),
                              random(0, colorfulness.value() * 225)),
  };
}

//Generate a universe system in a function.
function GenerateUniverse() {
  
  //Load default values and user settings from the UI panel.
  UniverseSettings();
  
  //Clean the arrays that contain map data.
  CleanMap();
  
  //Create random settings of environment stars, and append them on the star array.
  CreateStarMap();
  
  //Create random settings of planet, and append them on the planet array.
  CreatePlanetMap();
  
  //Create random settings of the main star, and set them on the main star variable.
  CreateMainStarMap();
  
  //Put the camera in place.
  ResetCamera();
}

//Restore all arrays [stars,planets,tracks]
function CleanMap() {
  stars = [];
  planets = [];
  planetTracks = [];
}

//Create a new map of environment stars.
function CreateStarMap() {
  
  for (let i = 0; i < starSettings.amount; i++) {
    newSize = starSettings.mapSize * 100;
    
    //Set random position for each star.
    RanX = random(-newSize, newSize);
    RanY = random(-newSize, newSize);
    RanZ = random(-newSize, newSize);
    
    //Apply random location and diameter to each star.
    stars[i] = new Star(RanX, RanY, RanZ, random(0, starSettings.maxDiameter));
  }
}

//Create a new map of planets.
function CreatePlanetMap() {
  
  //Set the first x value away from the main star, so they will never collide.
  currentX = mainStarSettings.position.x + mainStarSettings.maxDiameter;
  
  //Initialize the planets by placing them randomly and correctly in a line next to the main star.
  for (let i = 0; i < planetSettings.amount; i++) {
    
    //Set a random diameter according to the maximum settings.
    newDiameter = random(0, planetSettings.maxDiameter);
    
    //An optimized calculation that will add random distances between planets without colliding.
    currentX += newDiameter * 2 + random(0, planetSettings.maxDistance);
    
    //Apply position and size to the planet array.
    planets[i] = new Planet(currentX - newDiameter,
                            mainStarSettings.position.y,
                            mainStarSettings.position.z,
                            newDiameter);
    
    //Create a map that shows the track of this planet.
    CreatePlanetTrackMap(i, currentX - newDiameter);
  }
}

//Create a new map of planet tracks.
function CreatePlanetTrackMap(index, diameter) {
  planetTracks[index] = new PlanetTrack(diameter);
}

//Create a new map of the main star.
function CreateMainStarMap() {
  
  //Apply random diameter to the main star variable.
  mainStar = new MainStar(mainStarSettings.position.x,
                          mainStarSettings.position.y,
                          mainStarSettings.position.z,
                          random(planetSettings.maxDiameter / 2, mainStarSettings.maxDiameter));
}

//Define the format of one star in the array.
class Star {
  
  //Constructing basic elements.
  constructor(x, y, z, diameter) {
    
    //Position.
    this.x = x;
    this.y = y;
    this.z = z;
    
    //Varible for smooth movement.
    this.xPrevious = 0;
    this.yPrevious = 0;
    this.zPrevious = 0;
    
    //Diameter.
    this.diameter = diameter;
  }

  //Move the star randomly according to the noise function.
  move() {
    
    //Move every axis towards a random direction [noise] and distance [moveSpeed].
    this.x += map(noise(this.xPrevious), 0, 1, -starSettings.moveSpeed, starSettings.moveSpeed);
    this.y += map(noise(this.yPrevious), 0, 1, -starSettings.moveSpeed, starSettings.moveSpeed);
    this.z += map(noise(this.zPrevious), 0, 1, -starSettings.moveSpeed, starSettings.moveSpeed);
    
    //Creates smooth movement [moveIntensity] by moving on the noise.
    this.xPrevious += random(0, starSettings.moveIntensity);
    this.yPrevious += random(0, starSettings.moveIntensity);
    this.zPrevious += random(0, starSettings.moveIntensity);
  }

  display() {
    
    //Show stars with the settings given.
    push();
    
      //Set the material with a lighter color according to the main star. The material will not be affected by lightings.
      emissiveMaterial(map(mainStarSettings.lightColor.x, 0, 255, 200, 255),
                       map(mainStarSettings.lightColor.y, 0, 255, 200, 255),
                       map(mainStarSettings.lightColor.z, 0, 255, 200, 255));

      //Set the position.    
      translate(this.x,
                this.y,
                this.z);

      //Set the sphere.
      sphere(this.diameter,
             starSettings.detailLevel,
             starSettings.detailLevel);
    
    pop();
  }
}

//Define the format of one planet in the array.
class Planet {
  
  //Constructing basic elements.
  constructor(x, y, z, diameter) {
    
    //Position.
    this.x = x;
    this.y = y;
    this.z = z;
    
    //Orbit angle.
    this.angle = 0;
    
    //Set a diameter.
    this.diameter = diameter;
    
    //Set a random name.
    this.name = random(loadedNames);
    
    //Set a random texture.
    this.texture = int(random(0, loadedTextures.length));
    
    //Set a random self orbit speed.
    this.orbitSpeed = random(0, planetSettings.maxOrbitSpeed);
    
    //Set a random orbit speed around main star.
    this.speed = random(-planetSettings.maxSpeed, planetSettings.maxSpeed) / mainSettings.FPS;

  }

  display() {
    
    //Show the planet according to the given settings.
    push();
    
      //Set the shadow color.
      ambientLight(planetSettings.ambientLight);

      //Set the position.
      translate(this.x,
                this.y,
                this.z);

      //Self rotate with the speed and time scale given.
      rotateY(millis() / (500 / (this.orbitSpeed * timeScale.value())));

      //Set the random texture of the planet.
      texture(loadedTextures[this.texture]);

      //Render the planet.
      sphere(this.diameter,
             planetSettings.detailLevel,
             planetSettings.detailLevel);
    
    pop();
  }

  UI() {
    
    //Show the text UI on the top of each planet.
    push();
    
      //Set the location of the UI.
      translate(this.x, 
                //Set the height of the text, and ensure that the UI is always above the planet with a certain distance.
                this.y - this.diameter - mainSettings.UISize - mainSettings.UIDistance,
                this.z);
    
      //Display a random name of the planet.
      textFont(loadedFont);
      textAlign(CENTER, CENTER);
      textSize(mainSettings.UISize);
      text(this.name, 0, 0);
    
    pop();
  }

  orbit(radius) {
    
    //Make the planet orbit around the main star. Continously adding angle according to the speed to orbit.
    this.angle += this.speed;
    
    //Calculate the position using cosine and sine function. Disable orbit on Y axis.
    this.x = radius * cos(timeScale.value() * this.angle) + mainStarSettings.position.x;
    this.y = mainStarSettings.position.y;
    this.z = radius * sin(timeScale.value() * this.angle) + mainStarSettings.position.z;
  }
}

//Define the format of one orbit indicator in the array.
class PlanetTrack {
  
  //Constructing basic elements.
  constructor(diameter) {
    
    //The orbit diameter of the planet.
    this.diameter = diameter;
  }

  display() {
    
    //Display the orbit indicator
    push();
    
      //Set the position to the center of the main star.
      translate(mainStarSettings.position.x,
                mainStarSettings.position.y, 
                mainStarSettings.position.z);

      //Rotate X axis to match the orbit plane.
      rotateX(PI / 2);

      //Set the color of the track with color and opacity values given. 
      //Using emissive material makes it unaffected by the lightings.
      emissiveMaterial(planetTrackSettings.color.x,
                       planetTrackSettings.color.y,
                       planetTrackSettings.color.z,
                       planetTrackSettings.opacity);

      //Render the orbit indicator.
      torus(this.diameter,
            planetTrackSettings.tubeDiameter,
            planetTrackSettings.detailLevel,3);
    
    pop();
  }
}

//Define the format of the main star.
class MainStar {
  
  //Constructing basic elements.
  constructor(x, y, z, diameter) {
    
    //Position.
    this.x = x;
    this.y = y;
    this.z = z;
    
    //Diameter.
    this.diameter = diameter;
    
    //Set a random name.
    this.name = random(loadedNames);
    
    //Set a random self orbit speed.
    this.orbitSpeed = random(0, mainStarSettings.maxOrbitSpeed);
  }

  display() {
    
    //Apply the light color of the main star.
    let lightColor = color(mainStarSettings.lightColor.x,  
                           mainStarSettings.lightColor.y,
                           mainStarSettings.lightColor.z);
    
    //Render the main star.
    push();
    
      //Self rotate with the speed and time scale given.
      rotateY(millis() / (500 / (this.orbitSpeed * timeScale.value())));

      //Set the color of the texture same as the light source color.
      tint(lightColor);

      //Set the texture.
      texture(sun);

      //Render the main star.
      sphere(this.diameter,
             mainStarSettings.detailLevel,
             mainStarSettings.detailLevel);
    
    pop();

    //Place a point light as a main light source in the center of the main star.
    //By placing it at the last line of the render code, the main star will remain unaffected by the light source.
    //In this way, the emissive effect is created. Also, we use the previous variable to set the light color.
    pointLight(lightColor, this.x, this.y, this.z);
  }

  UI() {
    
    //Display the name above the main star.
    push();
    
      //Set the location of the text UI.
      translate(this.x, 
                //Set the height of the text, and ensure that the UI is always above the planet with a certain distance.
                this.y - this.diameter - mainSettings.UISize - mainSettings.UIDistance,
                this.z);

      //Render the text UI.
      textFont(loadedFont);
      textAlign(CENTER, CENTER);
      textSize(mainSettings.UISize);
      text(this.name, 0, 0);
    
    pop();
  }
}

//Start audio when clicked.
function mousePressed() { 
  
  //Start audio because of the browser policy.
  if(!audioStarted) {
    userStartAudio(); 
    audioStarted = true;
    audioFrame = frameCount;
  }
  
}

//Reset camera to default.
function ResetCamera() {
  
  //Reset the planet view to none.
  focusPlanet = -1;
  
  //Reset position according to the system size.
  mainCam.setPosition(0, entropy.value() * -400, entropy.value() * 1500);
  
  //Reset angle, facing camera toward the main star.
  mainCam.lookAt(mainStarSettings.position.x,
                 mainStarSettings.position.y,
                 mainStarSettings.position.z);
}



function PlanetCamera(){
  
  //Camera follow speed [Must >1, larger value, smoother movement].
  followSpeed = 10;
  
  //Camera follow distance, controlled by the slide bar.
  followDistance = p_CamDistance.value();
  
  //Set position following the planet.
  mainCam.setPosition(mainCam.eyeX+(planets[focusPlanet].x-mainCam.eyeX)/followSpeed,
                      mainCam.eyeY+(planets[focusPlanet].y-mainCam.eyeY)/followSpeed - 
                                    planets[focusPlanet].diameter*followDistance - mainSettings.UISize/3,
                      mainCam.eyeZ+(planets[focusPlanet].z-mainCam.eyeZ)/followSpeed + 
                                    planets[focusPlanet].diameter*followDistance + mainSettings.UISize/3);
  
  //Keep the angle facing toward the planet.
  mainCam.lookAt(planets[focusPlanet].x,
                 planets[focusPlanet].y,
                 planets[focusPlanet].z);
}

function SwitchPlanetCamera(){
  
  //Set view target to a random planet.
  focusPlanet=int(random(0,planets.length));
}

//A function to convert hex value to rgb values.
function HexToRgb(hexValue) {
  hexValue = hexValue.replace('#', '');
  i = parseInt(hexValue, 16);
  r = (i >> 16) & 255;
  g = (i >> 8) & 255;
  b = i & 255;
  return new p5.Vector(r, g, b);
}

//Create control panel for users to operate.
function DrawUI(x, y) {
  
  //Draw the logo.
  logo = createImg('Pictures/Logo.png', 'Logo');
  logo.position(windowWidth / 2 - 150, 20);

  //Draw the time scale text next to the slide bar.
  lable_0 = createElement('Label', 'Time Scale');
  lable_0.position(x + 115, y + 2);
  lable_0.style('color', '#ffffff');
  lable_0.style('font-size', '12px');
  lable_0.style('font-family', 'Quicksand');
  
  //Draw the entropy text next to the slide bar.
  lable_1 = createElement('Label', 'Entropy');
  lable_1.position(x + 115, y + 22);
  lable_1.style('color', '#ffffff');
  lable_1.style('font-size', '12px');
  lable_1.style('font-family', 'Quicksand');
  
  //Draw the colorfulness next to the slide bar.
  lable_2 = createElement('Label', 'Colorfulness');
  lable_2.position(x + 115, y + 42);
  lable_2.style('color', '#ffffff');
  lable_2.style('font-size', '12px');
  lable_2.style('font-family', 'Quicksand');
  
  //Draw the track color next to the color picker.
  lable_3 = createElement('Label', 'Track Color');
  lable_3.position(x + 115, y + 70);
  lable_3.style('color', '#ffffff');
  lable_3.style('font-size', '12px');
  lable_3.style('font-family', 'Quicksand');
  
  //Draw the view distance next to the view distance.
  lable_4 = createElement('Label', 'View Distance');
  lable_4.position(x + 115, y - 50);
  lable_4.style('color', '#ffffff');
  lable_4.style('font-size', '12px');
  lable_4.style('font-family', 'Quicksand');
  
  //Draw the time scale slide bar.
  timeScale = createSlider(0, 5, 0.5, 0);
  timeScale.position(x, y);
  timeScale.style('width', '100px');
  
  //Draw the entropy slide bar.
  entropy = createSlider(0.02, 1, 0.5, 0);
  entropy.position(x, y + 20);
  entropy.style('width', '100px');

  //Draw the colorfullness slide bar.
  colorfulness = createSlider(0, 5, 4, 0);
  colorfulness.position(x, y + 40);
  colorfulness.style('width', '100px');

  //Draw the camera distance slide bar.
  p_CamDistance = createSlider(0, 5, 0.1, 0);
  p_CamDistance.position(x, y - 52);
  p_CamDistance.style('width', '100px');
  
  //Draw the line color picker
  lineColor = createColorPicker('#969696');
  lineColor.position(x, y + 65);
  lineColor.style('width', '100px');

  //Draw the generate universe button
  generate = createButton('Generate Universe');
  generate.position(x, y + 100);
  generate.style('width', '180px');
  generate.style('background-color', color(200, 200, 200, 200));
  generate.style('font-family', 'Quicksand');
  generate.style('color', '#ffffff');
  //Apply button listener with a callback.
  generate.mousePressed(GenerateUniverse);

  //Draw the rest camera button.
  look = createButton('Reset Camera');
  look.position(x, y - 25);
  look.style('width', '180px');
  look.style('background-color', color(200, 200, 200, 200));
  look.style('font-family', 'Quicksand');
  look.style('color', '#ffffff');
  //Apply button listener with a callback.
  look.mousePressed(ResetCamera);
  
  //Draw the view planet button.
  look = createButton('View Planets');
  look.position(x, y - 80);
  look.style('width', '180px');
  look.style('background-color', color(200, 200, 200, 200));
  look.style('font-family', 'Quicksand');
  look.style('color', '#ffffff');
  //Apply button listener with a callback.
  look.mousePressed(SwitchPlanetCamera);
}