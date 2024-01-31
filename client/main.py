from paho.mqtt import client as mqtt_client
import time
import threading


broker = 'test.mosquitto.org'
port = 1883
client_id = f'python-mqtt-S001'
topic_to_sub = "/cloud/request/S001"
topic_to_pub = "/station/state/"
username=""
password=""
data_received=""
client = None

notificaciones = {
    0 : "{\"type\":0,\"id\":\"S001\",\"value\":32,\"unidad\":\"C\",\"alerta\":true,\"chatId\":\"1468952524\"}",
    1 : "{\"type\":1,\"id\":\"S001\",\"value\":10,\"unidad\":\"cm\",\"alerta\":true,\"chatId\":\"1468952524\"}",
    2 : "{\"type\":2,\"id\":\"S001\",\"value\":false,\"unidad\":\"\",\"alerta\":true,\"chatId\":\"1468952524\"}"
}

respuestas = {
    "temp":"{\"type\":0,\"id\":\"S001\",\"value\":17,\"unidad\":\"C\",\"alerta\":false,\"chatId\":\"1468952524\"}",
    "distance":"{\"type\":1,\"id\":\"S001\",\"value\":10,\"unidad\":\"cm\",\"alerta\":false,\"chatId\":\"1468952524\"}",
    "switch":"{\"type\":2,\"id\":\"S001\",\"value\":true,\"unidad\":\"\",\"alerta\":false,\"chatId\":\"1468952524\"}",
    "light=OFF":"{\"type\":3,\"id\":\"S001\",\"value\":false,\"unidad\":\"\",\"alerta\":false,\"chatId\":\"1468952524\"}",
    "light=ON":"{\"type\":3,\"id\":\"S001\",\"value\":true,\"unidad\":\"\",\"alerta\":false,\"chatId\":\"1468952524\"}",
}

def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", rc)
    # Set Connecting Client ID
    client = mqtt_client.Client(client_id)
    #client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client

def publish(client, msg):
    result = client.publish(topic_to_pub, msg)
    status = result[0]
    if status == 0:
        print(f"Send `{msg}` to topic `{topic_to_pub}`")
    else:
        print(f"Failed to send message to topic {topic_to_pub}")


def subscribe(client: mqtt_client):
    def on_message(client, userdata, msg):
        global data_received
        data_received = msg.payload.decode()
        print(f"Received `{data_received}` from `{msg.topic}` topic")

    client.subscribe(topic_to_sub)
    client.on_message = on_message

def notification_task(client,run_event):
    #publish(client)
    while run_event.is_set():
        time.sleep(1)
        n = int(input("inserte tipo de notificacion"))
        try:
            msg = f"{notificaciones[n]}"
            publish(client, msg)
        except:
            msg = f"{respuestas['temp']}"
        print(n)

def main():
    global data_received
    global client
    print("conectando...")
    client = connect_mqtt()
    client.loop_start()
    subscribe(client)

    run_event = threading.Event()
    run_event.set()
    task = threading.Thread(target=notification_task, args = (client,run_event))
    task.start()
    try:
        while True:
            #loop forever
            if data_received != "":
                try:
                    msg = f"{respuestas[data_received]}"
                except:
                    msg = f"{respuestas['temp']}"
                finally:
                    publish(client, msg)
                    data_received = ""

    except KeyboardInterrupt:
        run_event.clear()
        task.join()


if __name__ == "__main__":
    main()