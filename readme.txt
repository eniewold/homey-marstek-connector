The Marstek Battery Connector app integrates your Marstek home battery with Homey.
It allows you to monitor the state of charge, track charging and discharging power, view total energy flow, and use battery data in Homey Flows to automate your smart home.
The app communicates directly with your battery over the local network. No cloud services are required.

NOTE: No Modbus or MQTT connection is needed. The app uses the battery's built-in LAN interface.

Features
The app supports automatic discovery of your Marstek battery on the local network. It provides real time updates of charge level and power usage. Battery data can be used in Homey Flows to automate your smart home.

Installation and Setup
1) Install the app from the Homey App Store.
2) Start the pairing wizard in Homey by adding a new device from the Marstek Battery Connector.
3) The app will scan your local network to discover your Marstek battery (if not found, retry once more).
4) Select your battery from the list to complete pairing (or select 'undetected' device)
5) Once added, the device tile will display the battery charge level in percent, the current power in watts, and the total energy in kilowatt hours.

Usage in Flows
Battery data can be used in Flows as triggers and conditions. For example, create a Flow that turns on an appliance when the battery state of charge is above 80 percent. Charging is represented by positive power values, discharging is represented by negative power values.

Notes
The battery must be connected to the same local network as Homey. Only Marstek models supporting LAN communication are supported. Multiple batteries can be paired if they are on the same network. Power values follow Homey convention. Positive values mean charging or consuming power. Negative values mean discharging or supplying power.

Support
If you encounter issues, first check that your battery is online and connected to the same LAN as Homey. Restart the app from Homey App Settings if necessary. For further assistance, contact the developer through the Homey Community Form link on bottom of App page.