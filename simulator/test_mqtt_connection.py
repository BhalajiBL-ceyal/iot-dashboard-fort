"""
Quick MQTT Connection Test
This will verify if MQTT broker is accessible
"""
import paho.mqtt.client as mqtt
import time

print("=" * 60)
print("MQTT Connection Test")
print("=" * 60)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ SUCCESS: Connected to MQTT broker!")
        print("   Connection is working properly")
    else:
        print(f"❌ FAILED: Connection failed with code {rc}")
        print("   Possible issues:")
        print("   - MQTT broker not running")
        print("   - Port 1883 blocked")
        print("   - Firewall issue")

def on_disconnect(client, userdata, rc):
    print("⚠️  Disconnected from broker")

# Create client
client = mqtt.Client(client_id="test_client")
client.on_connect = on_connect
client.on_disconnect = on_disconnect

print("\nAttempting to connect to localhost:1883...")
print("(Make sure MQTT Broker is running)")
print()

try:
    client.connect("localhost", 1883, 60)
    client.loop_start()
    
    # Wait for connection
    time.sleep(3)
    
    # Test publish
    print("\nAttempting to publish test message...")
    result = client.publish("test/topic", "Hello MQTT!", qos=1)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print("✅ Publish successful!")
    else:
        print(f"❌ Publish failed with code {result.rc}")
    
    time.sleep(1)
    client.loop_stop()
    client.disconnect()
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)
    
except ConnectionRefusedError:
    print("❌ ERROR: Connection refused")
    print("   The MQTT broker is not running or not accepting connections")
    print("   Please make sure the MQTT Broker window is open and running")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("\nPress Enter to exit...")
input()
