#include <Arduino.h>
#include <PxMatrix.h>
#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>

#include <DNSServer.h>
#include <ESP8266WebServer.h>

#include <Ticker.h>

Ticker display_ticker;

#define MAX_COMMAND_ARGUMENTS   4

// Pins for LED MATRIX
#define P_LAT 16
#define P_A 5
#define P_B 4
#define P_C 15
#define P_OE 2
#define P_D 12
#define P_E 0

#define WIDTH   64
#define HEIGHT  32

enum {
  COMMAND_CLEAR,
  COMMAND_WRITE_PIXEL,
  COMMAND_WRITE_TEXT
};

typedef enum STATE {
  STATE_STARTING,
  STATE_CONNECTING_WIFI,
  STATE_WAITING_CLIENT,
  STATE_CLIENT_CONNECTED
} STATE;

char ssid[] = "ssid";
char password[] = "password";

PxMATRIX display(WIDTH, HEIGHT, P_LAT, P_OE, P_A, P_B, P_C, P_D, P_E);
static uint8_t pixels[WIDTH * HEIGHT * 3];
const byte DNS_PORT = 53;
DNSServer dnsServer;

ESP8266WebServer server(80);

IPAddress apIP(192, 168, 4, 1);
IPAddress netMsk(255, 255, 255, 0);

WebSocketsServer webSocket = WebSocketsServer(81);

static STATE state = STATE_STARTING;

static const char* getStateName(STATE state) {
  switch (state) {
    case STATE_STARTING: return "STATE_STARTING";
    case STATE_CONNECTING_WIFI: return "STATE_CONNECTING_WIFI";
    case STATE_WAITING_CLIENT: return "STATE_WAITING_CLIENT";
    case STATE_CLIENT_CONNECTED: return "STATE_CLIENT_CONNECTED";
    default: return "STATE_UNKNOWN";
  }
}

static void setState(STATE newState) {
  Serial.printf("%s => %s\n", getStateName(state), getStateName(newState));
  state = newState;
}

unsigned int convertRGB(String rgb){ //convert 24 bit RGB to 16bit 5:6:5 RGB
  int color = strtol(rgb.c_str(), NULL, 0);
  return(((color&0xf80000)>>8)|((color&0xfc00)>>5)|((color&0xf8)>>3));
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  int x;
  int y;
  String inPayload;
  int command;
  int argumentStart;
  int commaIndex = 0;
  int commas[MAX_COMMAND_ARGUMENTS];
  
  for (int i = 0; i < MAX_COMMAND_ARGUMENTS; i++) {
    commas[i] = -1;
  }

  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      setState(STATE_WAITING_CLIENT);
      break;
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
        webSocket.sendTXT(num, "Connected");
        setState(STATE_CLIENT_CONNECTED);
        display.clearDisplay();
      }
      break;
    case WStype_TEXT:
    {
      /* commands
      0 = clear display
      1:x,y,color
      2:x,y,color,size,text
      */

      inPayload = String((char *) payload);
      Serial.println(inPayload);

      for (size_t i = 0; i < inPayload.length(); i++) {
        if (inPayload[i] ==  ',') {
          commas[commaIndex] = i;
          commaIndex++;
        }
      }

      argumentStart = inPayload.indexOf(":");
      command = inPayload.substring(0, argumentStart).toInt();

      switch (command) {
        case COMMAND_CLEAR:
        {
          display.clearDisplay();
          break;
        }
        case COMMAND_WRITE_PIXEL:
        {
          // 1:x,y,color
          x = inPayload.substring(argumentStart + 1, commas[0]).toInt();
          y = inPayload.substring(commas[0] + 1, commas[1]).toInt();
          String color = inPayload.substring(commas[1] + 1);
          Serial.println(color);
          display.drawPixel(x , y, convertRGB(color));
          break;
        }
        case COMMAND_WRITE_TEXT:
        {
          // 2:x,y,size,color,text
          x = inPayload.substring(argumentStart + 1, commas[0]).toInt();
          y = inPayload.substring(commas[0] + 1, commas[1]).toInt();
          int size = inPayload.substring(commas[1] + 1, commas[2]).toInt();
          String color = inPayload.substring(commas[2] + 1, commas[3]);
          String text = inPayload.substring(commas[3] + 1);
          display.setCursor(x, y);
          display.setTextWrap(true);
          display.setTextColor(convertRGB(color));
          display.setTextSize(size);
          display.print(text);
          break;
        }
      }

      // Ack
      webSocket.sendTXT(num, "Received");
      break;
    }
    case WStype_BIN:
    {
      //rgb
      uint8_t r, g, b;
      uint16_t index = 0;
      //Serial.printf("[%u] get binary length: %u\n", num, length);
      if (length == (WIDTH * HEIGHT * 3)) {
        for (size_t y = 0; y < HEIGHT; y++) {
          for (size_t x = 0; x < WIDTH; x++) {
              boolean write = false;
              r = payload[index];
              if (pixels[index] != r) {
                write = true;
                pixels[index] = r;
              }
              index++;
              g = payload[index];
              if (pixels[index] != g) {
                write = true;
                pixels[index] = g;
              }
              index++;
              b = payload[index];
              if (pixels[index] != b) {
                write = true;
                pixels[index] = b;
              }
              index++;
              if (write) {
                display.drawPixelRGB888(x, y, r, g, b);
              }
          }
          ESP.wdtFeed();
        }
      } else {
        Serial.printf("Length mismtach, expected %d, but was %d\n", WIDTH * HEIGHT * 3, length);
      }
      break;
    }
    default:
      break;
  }

}

void display_updater(void) {
  display.display(70);
}

void setupDisplay(void) {
  display.begin(16);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextWrap(false);

  display_ticker.attach(0.002, display_updater);
  Serial.println("Display set up!");
}

boolean connectWiFi(void) {
  int wifiWaitTime = 5000;

  WiFi.begin(ssid, password);
  while ((WiFi.status() != WL_CONNECTED) && (wifiWaitTime > 0)) {
    Serial.print(".");
    delay(500);
    wifiWaitTime -= 500;
  }
  return WiFi.status() == WL_CONNECTED;
}

void setupAP(void) {
  WiFi.softAP("WebsocketDisplay", "12345678");
  Serial.println();
  Serial.print("IP address: ");
  Serial.println(WiFi.softAPIP());
  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(DNS_PORT, "*", apIP);

  // TODO Set up a webserver to configure wifi credentials
  //server.on("/", handleWifi);
  //server.onNotFound(handleWifi);
  //server.begin(); // Web server start
  //Serial.println("HTTP server started");
}

void setup() {
  Serial.begin(115200);
  setState(STATE_CONNECTING_WIFI);  
  Serial.print("Connecting Wifi: ");
  Serial.println(ssid);
  memset(pixels, 0, sizeof(pixels));

  if (connectWiFi()){
    Serial.println("Connected to WiFi!");
    setState(STATE_WAITING_CLIENT);
    setupDisplay();
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    
    display.printf("Connect to:\nws://\n%s\n", WiFi.localIP().toString().substring(0, 4).c_str());
    display.printf("%s", WiFi.localIP().toString().substring(4).c_str());

  } else {
    setupAP();
  }
}

void loop() {
  if ((WiFi.status() == WL_CONNECTED)) {
    webSocket.loop();
  }
}