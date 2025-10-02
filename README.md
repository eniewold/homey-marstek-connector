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

- 0.6.3 - Added a property that monitors the number of seconds the last message was received from battery. Added icons for custom capabilities.
- 0.6.2 - Firmware setting was stored as incorrect settings type.
- 0.6.1 - Firmware 154 seems to communicate values with a different multipliers. The app now detects the firmware and corrects this.
- 0.6.0 - Auto re-connect implemented; retry port binding at every broadcast when listener is no longer available. Fixed errors on multiple devices trying to start connecting at the same time. Couple of other minor bugs in several places fixed.
- 0.5.7 - Correctly implemented setting of Homey capabilities as async calls.
- 0.5.6 - Scope seems no longer available during close event handling, so logging close event is now hard-coded to console.
- 0.5.5 - The socket UDP dgram does not have a destroy function, calling this caused a crash during de-installation of the App.
- 0.5.4 - Log structure changed to try to catch connectivity problems. Solved problem in clean-up function.
- 0.5.3 - Applied bug fix to broadcast IP address discovery (caused problems when no address is found).
- 0.5.2 - Added an increment unique id to all messages to battery. Restructured the way details are retrieved from messages into Homey capability values. Additional onUninit handling for removal of UDP listener. Added more capabilities received from battery (unverified).
- 0.5.1 - Handling of errors on socket binding and broadcast flag settings for better debugging of future port binding errors. Removed some mandatory settings that gave problems during discovery.
- 0.5.0 - Added additional readings from the battery API and energy system that are now visualised in Homey as their guideliness for batteries.
(older history details are left out)

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
- Not all transmitted UDP packages are being answered by the battery (it is silently ignoring them).
- Does not seem to work well in conjuction with CT002 or CT003, battery seems to stop communicating. 
