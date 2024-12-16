/*
 * ===== automation4ical =====
 * 
 * Helper script for iobroker.ical Calendars
 * for details see https://github.com/jbubik/automation4ical
 * copyright jbubik 2024 / MIT license
 * 
 */


const sCalendar = "ical.1"; //set your calendar instance here


// DO NOT TOUCH BELOW!!!
const sConfigObj = "0_userdata.0.automation4" + sCalendar + "cfg";
const sStateObj = "0_userdata.0.automation4" + sCalendar + "state";
let oConfigObj = { "minutesPre": 0, "minutesPost": 0, "onStartState": "", "onStartVal": "", "onEndState": "", "onEndVal": "" };
let oStateObj = { "ID": "", "event": "", "prestart": "", "start": "", "end": "", "postend": "" };

const runAutomation = () => {

    //create new ConfigObj or read it's current value
    if (!existsState(sConfigObj)) {
        console.info("State " + sConfigObj + " does not exist. Creating now.");
        createState(sConfigObj,
            {
                "name": "Event Automation for " + sCalendar + " - CONFIG",
                "desc": "Configuration object, change values manually to suit your needs.",
                "role": "state",
                "type": "json",
                "read": true,
                "write": true
            },
            () => { setState(sConfigObj, JSON.stringify(oConfigObj), true); });
    } else {
        oConfigObj = JSON.parse(getState(sConfigObj).val);
    };

    //create new StateObj or read it's current value
    if (!existsState(sStateObj)) {
        console.info("State " + sStateObj + " does not exist. Creating now.");
        createState(sStateObj,
            {
                "name": "Event Automation for " + sCalendar + " - STATE",
                "desc": "Status of Current Event, no manual changes here.",
                "role": "state",
                "type": "json",
                "read": true,
                "write": true
            },
            () => { setState(sStateObj, JSON.stringify(oStateObj), true); });
    } else {
        oStateObj = JSON.parse(getState(sStateObj).val);
    };

    //remember current ID, so we can compare at the end
    let startID = oStateObj.ID;

    //validate current event hasn't changed in calendar, if changed then delete the state
    if ((oStateObj.ID != "") && (new Date(oStateObj.end) >= new Date())) {
        let oCurEvent = getState(sCalendar + ".data.table").val.find(
            item => ((item._IDID === oStateObj.ID) && (item._date === oStateObj.start) && (item._end === oStateObj.end)));
        if (oCurEvent === undefined) {
            console.info("Current event " + oStateObj.event + " deleted from Calendar or changed the times.");
            oStateObj.ID = "";
            oStateObj.event = "";
            oStateObj.prestart = "";
            oStateObj.start = "";
            oStateObj.end = "";
            oStateObj.postend = "";
        };
    }

    //if current event ended (including post-end delay) then delete the state
    if ((oStateObj.ID != "") && (new Date(oStateObj.postend) <= new Date())) {
        console.info("Current event " + oStateObj.event + " just finished.");
        oStateObj.ID = "";
        oStateObj.event = "";
        oStateObj.prestart = "";
        oStateObj.start = "";
        oStateObj.end = "";
        oStateObj.postend = "";
    };

    //state is empty? look for next event in Calendar and if is already running (including pre-start offset) then fill the State
    if (oStateObj.ID == "") {
        let oNxtEvnt = getState(sCalendar + ".data.table").val.find(item => item._allDay === false);
        if (oNxtEvnt !== undefined) {
            let dStart = new Date(oNxtEvnt._date);
            let dPreStart = dStart;
            dPreStart.setMinutes(dPreStart.getMinutes() - oConfigObj.minutesPre);
            if (dPreStart < new Date()) {
                console.info("Event " + oNxtEvnt.event + " just started.");
                oStateObj.ID = oNxtEvnt._IDID;
                oStateObj.event = oNxtEvnt.event;
                oStateObj.prestart = dPreStart.toISOString();
                oStateObj.start = oNxtEvnt._date;
                let dEnd = new Date(oNxtEvnt._end);
                let dPostEnd = dEnd;
                dPostEnd.setMinutes(dEnd.getMinutes() + oConfigObj.minutesPost);
                oStateObj.end = oNxtEvnt._end;
                oStateObj.postend = dPostEnd.toISOString();
            };
        };
    };

    //compare original State and new State - execute Start action
    if (startID == "" && oStateObj.ID != "" && oConfigObj.onStartState != "") {
        console.info("Executing Start action: " + oConfigObj.onStartState + "=>" + oConfigObj.onStartVal);
        setStateChanged(oConfigObj.onStartState, oConfigObj.onStartVal, false);
    };

    //compare original State and new State - execute Stop action
    if (startID != "" && oStateObj.ID == "" && oConfigObj.onEndState != "") {
        console.info("Executing End action: " + oConfigObj.onEndState + "=>" + oConfigObj.onEndVal);
        setStateChanged(oConfigObj.onEndState, oConfigObj.onEndVal, false);
    };

    //save StateObj to DB
    if (existsState(sStateObj)) {
        setStateChanged(sStateObj, JSON.stringify(oStateObj), true);
    };



};

//run every 5 minutes
schedule('*/5 * * * *', () => { runAutomation(); });
//run on every Calendar change
on({ id: sCalendar + ".data.table", change: 'any' }, async function (data) { runAutomation(); });
