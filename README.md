# Websocket Matrix Display

<img src="/images/startup_ip.jpg"  />
<img src="/images/case_cad.png"  />

## Client
|Drawing with color|Showing static images from url|
|------|---|
|  <img src="/images/drawing.gif"  />    |  <img src="/images/image_from_url.gif"  /> |
<p float="center">
Client interface
<img src="/images/client_screen.PNG"  />
Livestreaming from phone webcam
<img src="/images/streaming_camera.gif"  width="100%"/>

</p>

## Commands
```
0 // clear display
1:x,y,color // Set pixel color
2:x,y,color,size,text // Write text 
```

Or you can send the values for each pixel as a byte array.
For example with this you can stream the content of a canvas over the websocket, see [this function](https://github.com/jakkra/WebsocketDisplay/blob/8ff4ded9b15b2b3e8ff5f109df35b8f456531c31/src/DisplayCanvas.js#L140)

## Code
### WebsocketDisplay/
ESP8266 code for receiving either byte data for each all pixels. Or for receiving commands to set idividuals pixels and writing text. At startup it shows it's ip address.

### client/
Website for controlling the display. Includes:
- Connecting to the display.
- Drawing with configureable color and draw width.
- Showing a static image from a provided url (jpg, png...).
-  Streaming video from a camera to the display.

## Wiring
[See the PxMatrix library](https://github.com/2dom/PxMatrix)

## Running
```
cd client 
npm i
npm start
```
For flashing esp8266 easiest is to open project in Platform IO, otherwise manually downloading the libraries and flashing using Arduino IDE also works.
