"""
Simple MQTT Broker using Python
This is a lightweight MQTT broker for development/testing purposes.
"""

import socket
import threading
import json
from collections import defaultdict
import time

class SimpleMQTTBroker:
    """
    A basic MQTT broker implementation for development.
    Supports: CONNECT, PUBLISH, SUBSCRIBE
    """
    
    def __init__(self, host='0.0.0.0', port=1883):
        self.host = host
        self.port = port
        self.clients = {}
        self.subscriptions = defaultdict(list)
        self.running = False
        
    def start(self):
        """Start the MQTT broker."""
        self.running = True
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        
        try:
            server_socket.bind((self.host, self.port))
            server_socket.listen(5)
            print(f"[MQTT Broker] Started on {self.host}:{self.port}")
            print(f"[MQTT Broker] Ready to accept connections...")
            
            while self.running:
                try:
                    client_socket, address = server_socket.accept()
                    print(f"[MQTT Broker] New connection from {address}")
                    
                    client_thread = threading.Thread(
                        target=self.handle_client,
                        args=(client_socket, address)
                    )
                    client_thread.daemon = True
                    client_thread.start()
                    
                except Exception as e:
                    if self.running:
                        print(f"[MQTT Broker] Error accepting connection: {e}")
                        
        except Exception as e:
            print(f"[MQTT Broker] Failed to start: {e}")
        finally:
            server_socket.close()
            
    def handle_client(self, client_socket, address):
        """Handle MQTT client connection."""
        client_id = f"client_{address[0]}:{address[1]}"
        self.clients[client_id] = client_socket
        
        try:
            while self.running:
                try:
                    # Read MQTT packet
                    data = client_socket.recv(4096)
                    if not data:
                        break
                        
                    # Parse MQTT packet type
                    packet_type = (data[0] >> 4) & 0x0F
                    
                    if packet_type == 1:  # CONNECT
                        self.handle_connect(client_socket, client_id, data)
                    elif packet_type == 3:  # PUBLISH
                        self.handle_publish(client_socket, client_id, data)
                    elif packet_type == 8:  # SUBSCRIBE
                        self.handle_subscribe(client_socket, client_id, data)
                    elif packet_type == 12:  # PINGREQ
                        self.handle_ping(client_socket)
                        
                except Exception as e:
                    print(f"[MQTT Broker] Error handling client {client_id}: {e}")
                    break
                    
        finally:
            print(f"[MQTT Broker] Client {client_id} disconnected")
            if client_id in self.clients:
                del self.clients[client_id]
            client_socket.close()
            
    def handle_connect(self, client_socket, client_id, data):
        """Handle MQTT CONNECT packet."""
        # Send CONNACK
        connack = bytes([0x20, 0x02, 0x00, 0x00])  # Connection accepted
        client_socket.send(connack)
        print(f"[MQTT Broker] Client {client_id} connected")
        
    def handle_publish(self, client_socket, client_id, data):
        """Handle MQTT PUBLISH packet."""
        try:
            # Parse remaining length (variable length encoding)
            multiplier = 1
            value = 0
            pos = 1
            while True:
                byte = data[pos]
                value += (byte & 127) * multiplier
                multiplier *= 128
                if (byte & 128) == 0:
                    break
                pos += 1
            remaining_length = value
            pos += 1
            
            # Topic length
            if pos + 1 >= len(data):
                return
            topic_length = (data[pos] << 8) | data[pos + 1]
            pos += 2
            
            # Topic
            if pos + topic_length >= len(data):
                return
            topic = data[pos:pos + topic_length].decode('utf-8')
            pos += topic_length
            
            # QoS and packet identifier
            qos = (data[0] >> 1) & 0x03
            if qos > 0:
                if pos + 1 >= len(data):
                    return
                packet_id = (data[pos] << 8) | data[pos + 1]
                pos += 2
                # Send PUBACK for QoS 1
                if qos == 1:
                    puback = bytes([0x40, 0x02, (packet_id >> 8) & 0xFF, packet_id & 0xFF])
                    client_socket.send(puback)
            
            # Payload
            payload = data[pos:]
            
            print(f"[MQTT Broker] PUBLISH from {client_id}")
            print(f"              Topic: {topic}")
            try:
                payload_str = payload.decode('utf-8', errors='ignore')[:200]
                print(f"              Payload: {payload_str}")
            except:
                print(f"              Payload: <binary data>")
            
            # Forward to subscribers
            self.forward_message(topic, payload, client_id)
            
        except Exception as e:
            print(f"[MQTT Broker] Error in PUBLISH: {e}")
            import traceback
            traceback.print_exc()
            
    def handle_subscribe(self, client_socket, client_id, data):
        """Handle MQTT SUBSCRIBE packet."""
        try:
            pos = 2
            packet_id = (data[pos] << 8) | data[pos + 1]
            pos += 2
            
            # Topic filter length
            topic_length = (data[pos] << 8) | data[pos + 1]
            pos += 2
            
            # Topic filter
            topic_filter = data[pos:pos + topic_length].decode('utf-8')
            pos += topic_length
            
            # QoS
            requested_qos = data[pos]
            
            # Store subscription
            if client_id not in self.subscriptions[topic_filter]:
                self.subscriptions[topic_filter].append(client_id)
            
            print(f"[MQTT Broker] Client {client_id} subscribed to: {topic_filter}")
            
            # Send SUBACK
            suback = bytes([0x90, 0x03, (packet_id >> 8) & 0xFF, packet_id & 0xFF, requested_qos])
            client_socket.send(suback)
            
        except Exception as e:
            print(f"[MQTT Broker] Error in SUBSCRIBE: {e}")
            
    def handle_ping(self, client_socket):
        """Handle MQTT PINGREQ."""
        # Send PINGRESP
        pingresp = bytes([0xD0, 0x00])
        client_socket.send(pingresp)
        
    def forward_message(self, topic, payload, sender_id):
        """Forward published message to subscribers."""
        for topic_filter, subscribers in self.subscriptions.items():
            # Simple wildcard matching
            if self.topic_matches(topic, topic_filter):
                for client_id in subscribers:
                    if client_id != sender_id and client_id in self.clients:
                        try:
                            # Encode topic
                            topic_bytes = topic.encode('utf-8')
                            topic_length = len(topic_bytes)
                            
                            # Variable header (topic length + topic)
                            var_header = bytes([(topic_length >> 8) & 0xFF, topic_length & 0xFF])
                            var_header += topic_bytes
                            
                            # Full message = variable header + payload
                            message = var_header + payload
                            remaining_length = len(message)
                            
                            # Encode remaining length (variable length encoding)
                            encoded_length = []
                            while True:
                                byte = remaining_length % 128
                                remaining_length = remaining_length // 128
                                if remaining_length > 0:
                                    byte |= 0x80
                                encoded_length.append(byte)
                                if remaining_length == 0:
                                    break
                            
                            # Build packet: fixed header + remaining length + message
                            packet = bytearray([0x30])  # PUBLISH, QoS 0
                            packet.extend(encoded_length)
                            packet.extend(message)
                            
                            self.clients[client_id].send(bytes(packet))
                            
                        except Exception as e:
                            print(f"[MQTT Broker] Error forwarding to {client_id}: {e}")
                            
    def topic_matches(self, topic, topic_filter):
        """Check if topic matches topic filter (with wildcards)."""
        # Simple implementation: exact match or single-level wildcard (+)
        if topic_filter == topic:
            return True
            
        filter_parts = topic_filter.split('/')
        topic_parts = topic.split('/')
        
        if len(filter_parts) != len(topic_parts):
            # Check for multi-level wildcard (#)
            if filter_parts[-1] == '#':
                filter_parts = filter_parts[:-1]
                if len(topic_parts) >= len(filter_parts):
                    topic_parts = topic_parts[:len(filter_parts)]
                else:
                    return False
            else:
                return False
                
        for f_part, t_part in zip(filter_parts, topic_parts):
            if f_part != '+' and f_part != t_part:
                return False
                
        return True

if __name__ == "__main__":
    broker = SimpleMQTTBroker(host='0.0.0.0', port=1883)
    
    print("=" * 60)
    print("Simple MQTT Broker for IoT Dashboard")
    print("=" * 60)
    print("This is a lightweight MQTT broker for development.")
    print("For production, use Mosquitto or another full-featured broker.")
    print("=" * 60)
    print()
    
    try:
        broker.start()
    except KeyboardInterrupt:
        print("\n[MQTT Broker] Shutting down...")
        broker.running = False
