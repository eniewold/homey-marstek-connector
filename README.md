# Marstek Venus battery stats in Homey (through WiFi/LAN)

This Homey app connects to a Marstek Venus battery system through WiFi or LAN and retrieves battery statistics.
It allows you to monitor the battery status, charge level, and other relevant information directly from your Homey smart home system.
There is an auto-detect algorithm that tries to find your Marstek Venus battery on the local network.

## Features

When a device is detected and communication is working, the device will display various statistics such as:
- Battery charge level
- Status (charging, discharging, idle)
- Power left (in kilowatts/hours)
- Current power output or intake (Watt)
- Battery Temperature

## Requirements

This app requires Homey, a Marstek Venus battery system, both connected to the same network with enabled local API on the Marstek Venus battery system (see below).
Auto-detection of Marstek Venus batteries is supported on the same local network and when IP range is 192.168.x.y; it will search within the last octet (y) from 1 to 254.

### Enable Local API

The Local API is disabled by default, this needs te be enabled on the Marstek Venus battery system. This can be done in two ways:
- Use the BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) on your smartphone (or laptop) near the battery. Connect and use 'Enable Local API (30000)' button in 'System' tab.
- Contact Marstek support to have them enable the Local API for you. This can take a few days.

*The local API must be enabled for port number 30000 (on each device). Currently no other port numbers are supported.*

## Installation

1. Install the MarstekHomey app from the Homey App Store.
2. After the auto-detection has run, select/check all devices to add and click continue.
3. Devices are added by Homey
4. Watch the magic happen as the battery statistics are retrieved and displayed in the device card(s).

See settings of each battery for additional details. 

## Version History

0.5.1 - Handling of errors on socket binding and broadcast flag settings for better debugging of future port binding errors. Removed some mandatory settings that gave problems during discovery.
0.5.0 - Added additional readings from the battery API and energy system that are now visualised in Homey as their guideliness for batteries.
0.4.2 - he wifi_mac setting returned by the battery is the WiFi access point MAC address, not the MAC address of the battery, since it is the same for batteries connected to same WiFi. Changed unicity checks for this.
0.4.1 - Added a setting for devices that allows you to turn on debugging. This will log send and received data from the battery into the log for Diagnostics reports.
0.4.0 - Some major changes to the polling method, now using broadcast only. Detection of new devices improved. Increased number of messages transmitted. Multiple devices can now be added at once. PLEASE REMOVE YOUR DEVICE AND ADD THEM AGAIN AFTER UPDATING THE APP.
0.3.1 - Device detection in Homey has a timeout of 10 seconds that is a bit tighter than the time it takes for the wait of new device detection. Our wait time has been decreased to 9 seconds.
0.3.0 - Reworked the UDP server and client into separate class that can manage UDP connections and will throttle tranmitted messages to individual batteries. UDP server is now also a singleton instance managed by the Homey App scope. Increased the wait time between messages to 5 seconds. Default polling interval is now 30 seconds.
0.2.2 - Deleted devices kept listening to messages causing crashes, corrected the method to unhook to message events to prevent this.
0.2.1 - Temperatures reported by battery can be in different formats; both are now detected and supported
0.2.0 - Added preliminary support for multiple devices. (I have only a single device, so testing was limited)
0.1.6 - Checks added to UDP listener and better handling for restarting of server and binding errors
0.1.5 - Updated the icon of device so it resembles an actual Marstek Venus E battery
0.1.4 - Addition error detection when creating and sending udp client messages
0.1.3 - Added checks for invalid/missing data from the battery to prevent crashes in Homey
0.1.2 - Cleanup and added files and properties required for publishing
0.1.1 - Added auto-detect feature to find the Marstek Venus battery on the local network
0.1.0 - Initial version (reads basic battery stats)

## Notes

- This app uses the 'API over UDP' features as mentioned in the API documentation. 
- The app is developed and tested with a Venus E battery system (firmware v153, communication module 202409090159). Let me know if any other models work as well!
- When the device can't be auto-detected, please check if the Marstek Venus battery is powered on and connected to the same network as Homey.
- In some occasions the Marstek Venus battery does not respond to the API request. If this happens for a longer period of time, try to restart the battery system. (use the BTE Test Tool)
- Support for multiple Marstek Venus batteries is implemented, but since I only have one battery to test with, some is uncharted.
- It seems opening the Marstek mobile blocks some of the UDP communication periodically.
- Only UDP port 30000 is currently supported on the local API.
- When upgrading the app, it might be needed to remove already added battery devices first and then adding them again. 

## Known issues

- Sometimes UDP communication stops after a while (without any exception, warning).
- Not all transmitted UDP packages are being answered by the battery (it is silently ignoring them)
