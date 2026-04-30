#include <WiFi.h>
#include <HTTPClient.h>

// ================= CONFIG =================
// same wifi name and password of basestation and website if running locally
const char* ssid = "<name>";
const char* password = "<password>";

// const char* serverUrl = "http://172.16.11.208:8000/v1/data";
const char* serverUrl = "http://<backend_api_of_website>:8000/v1/data";
const char* device_id = "Basestation-Alpha";

// LoRa UART pins
#define LORA_RX 3   // ESP32 receives from LoRa TX
#define LORA_TX 2   // ESP32 transmits to LoRa RX

// ==========================================


// ---------- WiFi ----------
void connectWiFi()
{
    Serial.print("Connecting to WiFi");

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nConnected!");
    Serial.println(WiFi.localIP());
}


// ---------- Telemetry ----------
struct Telemetry
{
    String label;
    float confidence;
    float amplitude;
    int battery;
};


// ---------- Send AT Command ----------
void sendAT(String cmd)
{
    Serial.println(">> " + cmd);
    Serial1.println(cmd);

    delay(500);

    while (Serial1.available())
    {
        Serial.write(Serial1.read());
    }
}


// ---------- LoRa Init ----------
void initLoRa()
{
    Serial.println("Initializing LoRa...");

    Serial1.begin(115200, SERIAL_8N1, LORA_RX, LORA_TX);
    delay(1000);

    sendAT("AT");            // check module
    sendAT("AT+ADDRESS=2");  // set address
    sendAT("AT+NETWORKID=5");
    sendAT("AT+BAND=865000000");  // or 915000000
}


// ---------- Parse LoRa ----------
Telemetry parseLoRa(String raw)
{
    Telemetry t;

    // Expected format:
    // +RCV=addr,len,data,RSSI,SNR

    int firstComma = raw.indexOf(',');
    int secondComma = raw.indexOf(',', firstComma + 1);
    int thirdComma = raw.indexOf(',', secondComma + 1);

    String data = raw.substring(secondComma + 1, thirdComma);

    // Your payload format:
    // label,confidence,amplitude,battery

    int p1 = data.indexOf(',');
    int p2 = data.indexOf(',', p1 + 1);
    int p3 = data.indexOf(',', p2 + 1);

    t.label = data.substring(0, p1);
    t.confidence = data.substring(p1 + 1, p2).toFloat();
    t.amplitude = data.substring(p2 + 1, p3).toFloat();
    t.battery = data.substring(p3 + 1).toInt();

    return t;
}


// ---------- Read LoRa ----------
bool readLoRaTelemetry(Telemetry &t)
{
    if (Serial1.available())
    {
        String raw = Serial1.readStringUntil('\n');
        raw.trim();

        Serial.println("RAW: " + raw);

        if (raw.startsWith("+RCV="))
        {
            t = parseLoRa(raw);
            return true;
        }
    }

    return false;
}


// ---------- JSON ----------
String buildJSON(Telemetry t)
{
    String json = "{";
    json += "\"device_id\":\"" + String(device_id) + "\",";
    json += "\"label\":\"" + t.label + "\",";
    json += "\"confidence\":" + String(t.confidence, 2) + ",";
    json += "\"amplitude\":" + String(t.amplitude, 2) + ",";
    json += "\"battery\":" + String(t.battery);
    json += "}";

    return json;
}


// ---------- HTTP ----------
void sendTelemetry(String json)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi not connected");
        return;
    }

    HTTPClient http;

    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int code = http.POST(json);

    Serial.print("POST → ");
    Serial.print(json);
    Serial.print(" | Response: ");
    Serial.println(code);

    http.end();
}


// ---------- Setup ----------
void setup()
{
    Serial.begin(115200);
    delay(1000);

    connectWiFi();
    initLoRa();
}


// ---------- Loop ----------
void loop()
{
    Telemetry t;

    if (readLoRaTelemetry(t))
    {
        String json = buildJSON(t);
        sendTelemetry(json);
    }

    delay(100);
}