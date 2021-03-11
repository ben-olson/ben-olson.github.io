/*
 * Ben Olson
 * 03/01/21
 * This program communicates with the Arduino serial monitor to draw a pseudo-cursor made using 
 * coordinates from a microcontroller joystick. If a switch is pressed, the program extacts RGB 
 * values from the pixel using the pseudo-cursor's position on the page. The program then sends the 
 * RGB values back to Arduino via serial.
 */

var serial; // variable to hold an instance of the serialport library
var portName = '/dev/tty.usbmodem144101' // port that is connected to my microcontroller
var dataarray = []; // some data coming in over serial!
var click = false; // boolean tracking if the switch has been pressed


function setup() {
  serial = new p5.SerialPort();       // make a new instance of the serialport library
  serial.on('list', printList);       // set a callback function for the serialport list event
  serial.on('connected', serverConnected); // callback for connecting to the server
  serial.on('open', portOpen);        // callback for the port opening
  serial.on('data', serialEvent);     // callback for when new data arrives
  serial.on('error', serialError);    // callback for errors
  serial.on('close', portClose);      // callback for the port closing
 
  serial.list();                      // list the serial ports
  serial.open(portName);              // open a serial port
  createCanvas(1023, 1023);           // creates a canvas 1023px by 1023px
}
 
// get the list of ports:
function printList(portList) {
 // portList is an array of serial port names
 for (var i = 0; i < portList.length; i++) {
 // Display the list the console:
   print(i + " " + portList[i]);
 }
}

// prints server connection success
function serverConnected() {
  print('connected to server.');
}

// prints the serial port opened
function portOpen() {
  print('the serial port opened.')
}
 
// prints if there's an error connecting to the serial port
function serialError(err) {
  print('Something went wrong with the serial port. ' + err);
}
 
// prints that the port is closed
function portClose() {
  print('The serial port closed.');
}


// main function that checks for serial input, on a loop
function serialEvent() {
  // checks if there is data to be read
  if (serial.available()) {

    var datastring = serial.readLine(); // readin some serial
    let dataparsed;                     // temp variable for processed serial data

    // if the data = "HIGH", meaning the switch is turned on
    if (datastring === "HIGH") {
      click = true; // sets click to true
    } else {
    // else, the data is is coordinate form
      try {
        dataparsed = JSON.parse(datastring); // tries to parse the serial and assigns it to temp
      } catch(err) {
        console.log(err); // catches and prints errors to console
      }
    }

    // if there is a coordinate and it's a valid object
    if (dataparsed && typeof(dataparsed) == 'object') {
      dataarray = dataparsed; // assigns values to processed array variable
      // if the switch is on
      if (click) {
        sendPixel(dataarray);   // sends pixel RGB values to Arduino
        click = false;          // resets switch tracker
      }
    }

  } 
}

// graphs the position of the pseudo-cursor using coordinates read from serial
function graphPosition(position) {
  image(img, 0, 0, width, height);            // redraws the image to avoid duplicating cursors
  ellipse(position[0], position[1], 10, 10);  // draws the pseudo-cursor using coordinate array
}

// predefines image variable
let img;

// preloads the image for faster processing when redrawing
function preload() {
  img = loadImage('color-wheel-2.png'); // loads defined image in directory
}

// infinite loop that draws the pseudo-cursor
function draw() {
  graphPosition(dataarray); // graphs position using the global coordinate array
}

// targets pixel based on pseudo-cursor position, then extracts RGB values from pixel and sends to Arduino
function sendPixel(position) {
  // if the pixel color selected is not white (can omit for images not in full saturation)
  if (get(position[0] - 10, position[1] - 10).toString() != [0,0,0,0].toString()) {
    // grabs pixel from position
    let pixel = get(position[0] - 10, position[1] - 10); 
    // offsets from pseudo-cursor position to avoid grabbing the cursor's color
    
    serial.write(pixel[0] + ',' + pixel[1] + ',' + pixel[2]);         // writes RGB values from pixel to the serial, values separated by commas
    console.log(pixel[0] + '\n' + pixel[1] + '\n' + pixel[2] + '\n'); // logs RGB values to console

  }
}
