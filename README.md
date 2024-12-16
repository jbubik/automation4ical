# automation4ical.js
A helper script for ioBroker

## Description
A helper script written in javascript language to set a state or trigger a scene in ioBroker based on events imported to ioBroker with iCal adapter.
The script is configurable by JSON properties of the configuration Object. While ioBroker.ical adapter supports Events, those are limited.
This helper script can trigger the start **before** the Calendar event starts (configurable pre-start offset); the end can trigger **after** the Calendar event ends (configurable post-end offset).

## Installation
### 1. Install and configure ioBroker.ical <img src="https://github.com/iobroker-community-adapters/ioBroker.ical/raw/master/admin/ical.png" height="30">
See [ioBroker.ical adapter](https://github.com/iobroker-community-adapters/ioBroker.ical/). You will need at least one working iCal instance (referenced as `ical.1` further on).
Several iCal instances are possible, create one helper script for each such instance.

### 2. Install ioBroker.javascript <img src="https://github.com/ioBroker/ioBroker.javascript/raw/master/admin/javascript.png" height="30">
See [ioBroker.javascript adapter](https://github.com/ioBroker/ioBroker.javascript/). The helper script is not an adapter itself, therefore you need the ioBroker.javascript adapter (aka Script Engine).

### 3. Create a new helper script
Create a new Script in the `Scripts` menu. Select `JavaScript` as the the programming language.
Copy the source code of [automation4ical.js](./automation4ical.js) and paste it into the source code editor.
Check line 11 - your iCal instance must be specified there (e.g. `ical.1`).
Save the script. The Script Engine will start it immediately.

### 4. Configure the settings
Once the helper script is run at least once, it will create the **Configuration object**.
Open menu `Objects` and navigate to `0_userdata` | `0` | `automation4ical` | `1cfg` (the number in `1cfg` will change based on your iCal instance).
Edit values in that Configuration Object. An example of the JSON settings is:
```
{
  "minutesPre": 180,
  "minutesPost": 60,
  "onStartState": "scene.0.room_baseline.mainhall_used",
  "onStartVal": true,
  "onEndState": "scene.0.room_baseline.mainhall_empty",
  "onEndVal": true
}
```
#### minutesPre
Pre-start offset in minutes. In example above, the starting scene is triggered 3 hours before the Calendar event starts.
#### minutesPost
Post-end offset in minutes. In example above, the ending scene is triggered 1 hour after the Calendar event finishes.
#### onStartState, onStartVal
The State specified in `onStartState` will be set to `onStartVal` by the helper script at the calculated start time.
#### onEndState, onEndVal
The State specified in `onEndState` will be set to `onEndVal` by the helper script at the calculated end time.

## Possible use case
Heating of several different areas (rooms) in a community center can be automated with ioBroker.
There is a main (public) Google calendar with all events in the center.
For each area a Google account was created with a (non-public) Calendar. Automatic acceptance of new invitations was enabled for such a Calendar.
When we create an Event in the public Calendar, we also invite the Google account(s) of areas, that should be heated before the event starts.
There are several iCal instances in our ioBroker (`ical.1` to `ical.N`) - one for each (non-public) Calendar of the respective areas.
For each iCal instance there is a helper script and a Configuration Object. Some rooms start heating 1 hour in advance of an event, some start 2 hours in advance and the big ones 3 hours in advance.
We use Scenes for the setup of each of the Rooms 'modes of operation' because this helper script can only assign a Value to a single State at the start or at the finish.

## Further development
Nothing really planned, but some ideas include:
 - The offsets are fixed numbers now, but could be probably calculated dynamically.
 - Whole-day events in the Calendar are skipped by the helper script. That is our decision. Could be probably a configurable option.
 - Configuration Object is created once (with current set of options), but never updated in case we add new options.
 - Vales are written to States with ACK=false. Could be probably a configurable option.

## License
The MIT License (MIT)
