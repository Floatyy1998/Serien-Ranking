/*
 * Beispiel für die Verwendung eines 128x64 Pixel OLED-Displays via I2C-Schnittstelle
 *
 * Verdrahtung:
 * ============
 * Display | NodeMCU
 *     GND | GND
 *     VCC | 3.3V
 *     SCL | D1
 *     SDA | D2
 *
 * Dieses Beispiel zeigt einen statischen Begrüßungsbildschirm mit verschiedenen Textelementen und Linien.
 * Danach verändern sich einige Elemente um periodisch auf und ab zu zählen.
 *
 * siehe auch: https://github.com/ThingPulse/esp8266-oled-ssd1306
 */

#include <Wire.h>
#include <SSD1306.h>
#include <OLEDDisplay.h>
#include <Adafruit_NeoPixel.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#define PIXEL_PIN D4
#define NUMPIXELS 2

#define INTERVAL 3000

// Bei den meisten NeoPixel-LEDs ist die Farbreihenfolge Green Red Blue (GRB).
Adafruit_NeoPixel pixels(NUMPIXELS, PIXEL_PIN, NEO_GRB + NEO_KHZ800);

#define SDA_PIN D2 // SDA an D2
#define SCL_PIN D1 // SCL an D1

#define D1 5 // GPIO 5 des ESP ist D1 auf dem Board
#define D2 4 // GPIO 4 des ESP ist D2 auf dem Board

void callback(String topic, byte *message, unsigned int length);

const int DISPLAY_ADDR = 0x3c; // I2C-Addresse des Displays
// WIFI
const char *ssid = "BS-GAST";
const char *password = "bs2020##";

// MQTT
const char *mqtt_server = "nossl.mqtt.rmsites.net";
const char *mqtt_user = "KoHe";
const char *mqtt_password = "KoHe1234";
const char *mqtt_topic_publish = "konrad/getFeuchte";
const char *mqtt_topic_subscribe = "konrad/setFeuchte";

SSD1306Wire *display;

int current = 21; // aktuelle Zahl
int updown = 1;   // Richtung

int last_sensor = 0; // letzte Veränderung des Sensors
String lastMessage = "start";
WiFiClient espClient;
PubSubClient client(espClient);

/**
 * setup
 */
void setup()
{
    // Serial
    Serial.begin(115200);
    Serial.println();
    delay(100);

    connectToWiFi();
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);

    // Display initialisieren
    display = new SSD1306Wire(DISPLAY_ADDR, SDA_PIN, SCL_PIN);
    display->init();
    display->displayOn();
    display->flipScreenVertically();
    display->clear();

    // 'smiley lachend', 64x64px

    display->setFont(ArialMT_Plain_24);
    // display->drawCircle(64, 32, 30);
    pixels.begin();
    // Anzeigewert für alle Pixel auf 0 0 0 stellen
    pixels.clear();
    // aktuelle Anzeigewerte an die Pixel senden
}

/**
 * loop
 */
void loop()
{

    if (!client.connected())
    {
        // MQTT-Verbindung wieder herstellen
        connectToMQTT();
    }

    // regelmäßigen Nachrichtenempfang gewährleisten, false bei Verbindungsabbruch
    if (!client.loop())
    {
        client.connect("aaauaaa", mqtt_user, mqtt_password);
    }

    //<340 nass; 341-681 feucht; >682 trocken
    if (now - last_sensor > INTERVAL)
    {
        last_sensor = now;
        int sensorvalue = analogRead(0);
        char cstr[10];

        itoa(sensorvalue, cstr, 10);
        char *test = cstr;

        client.publish(mqtt_topic_publish, test);
        connectToMQTT();
    }
}

void connectToWiFi()
{
    Serial.println("Verbinde mit WLAN...");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println("WLAN verbunden");
}
void connectToMQTT()
{

    while (!client.connected())
    {
        Serial.println("Verbinde mit MQTT...");

        if (client.connect("aaauaaa", mqtt_user, mqtt_password))
        { // Verwendeter zufälliger Name
            Serial.println("MQTT verbunden");
            client.subscribe(mqtt_topic_subscribe);
        }
        else
        {
            Serial.print("Fehler, rc=");
            Serial.print(client.state());
            Serial.println(" versuche es in 5 Sekunden erneut");
            delay(5000);
        }
    }
}
void nass()
{
    display->drawString(40, 20, "Nicht gießen");
    display->display();
    pixels.clear();
    pixels.setPixelColor(0, pixels.Color(255, 0, 0));
    pixels.show();
    lastMessage = "nass";
}
void feucht()
{
    display->drawString(40, 20, "Leicht gießen");
    display->display();
    pixels.clear();
    pixels.setPixelColor(0, pixels.Color(255, 255, 0));
    pixels.show();
    lastMessage = "feucht";
}
void trocken()
{
    display->drawString(40, 20, "Stark gießen");
    display->display();
    pixels.clear();
    pixels.setPixelColor(0, pixels.Color(0, 255, 0));
    pixels.show();
    lastMessage = "trocken";
}


void callback(String topic, byte *message, unsigned int length)
{
    // Callback-Funktion für MQTT-Subscriptions
    String messageTemp;

    // Message byteweise verarbeiten und auf Konsole ausgeben
    for (int i = 0; i < length; i++)
    {

        messageTemp += (char)message[i];
    }
    Serial.println(messageTemp);

    if (messageTemp.equals(lastMessage))
    {
        return;
    }
    display->clear();
    if (messageTemp.equals("nass"))
    {
        nass();
    }
    else if (messageTemp.equals("feucht"))
    {
        feucht();
    }
    else if (messageTemp.equals("trocken"))
    {
        trocken();
    }
}