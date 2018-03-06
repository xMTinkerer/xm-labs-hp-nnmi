# HP Network Node Manager i 10


<kbd>
  <img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

# Pre-Requisites
* HP Network Node Manager i 10
* Integration Agent 5.1.8+, [here](https://support.xmatters.com/hc/en-us/articles/201463419-Integration-Agent-for-xMatters-5-x-xMatters-On-Demand)
* xMatters account - If you don't have one, [get one](https://www.xmatters.com)!

# Files
* [NNMi-CommPlan.zip](NNMi-CommPlan.zip) - Communications plan to be uploaded to xMatters
* [NNMi-IAFiles.zip](NNMi-IAFiles.zip) - Integration Agent files to be extracted to `IAHOME/integrationservices/`


# How it works
When the agent starts, it makes a SOAP request into NNMi and creates a Subscription with the `FILTER` criteria and points to the IA http listener port (8081). When a new Incident in NNMi is created that matches the filter criteria, NNMi makes an http request to the integration agent which translates the payload and makes the HTTP request to the Integration Builder. The builder then creates the event and users are notified. 
If a user responds, their response is sent back to the agent, which then makes an http call into NNMi to update the status of the Incident. 


# Installation

## xMatters set up

**Pre-steps**: 
* Install and configure the Integration Agent, including the *Integration agent utilities*. See details [here](https://support.xmatters.com/hc/en-us/articles/201463419-Integration-Agent-for-xMatters-5-x-xMatters-On-Demand).


### xMatters on Demand
1. Login to xMatters as a Developer and create a new user.
2. Create a new REST user. See details [here](https://help.xmatters.com/integrations/xmatters/configuringxmatters.htm#Create)
2. Import the [NNMiCommPlan.zip](NNMiCommPlan.zip) communications plan. 
3. Next to the NNMi comm plan, click Edit > Access Permissions and give access to the user created in step 2. 
4. Click Edit > Forms and next to the `New Incident` form, click Edit > Sender Permissions and give access to the user created in step 2. 
5. Navigate to the Integration Builder tab and expand the Inbound Integrations section. Click on `Inbound from NNMi` and copy the URL at the bottom. 
6. Navigate back to the Developer tab and click Event Domains. If this menu item is not available, open a support ticket [here](https://support.xmatters.com/hc/en-us/requests/new) and request the following step to be performed. 
7. Click on the `applications` event domain. Scroll down to the Integration Services area and click Add New. Enter the following information into the form:

   * Name: hpnnmi
   * Description: HP NNMi Integration Service 
   * Path: `blank`

8. Click Save. 

Next, set up the Outbound Integrations for communications back to the Agent. 
1. Navigate to the Integration Builder inside the NNMi comm plan and expand the Outbound Integrations section. 
2. Click the Add button. Populate the following fields:

| Field | Value |
| ----- | ----- |
| Trigger | Device Delivery Updates | 
| Form | New Incident |
| Action | Send to Integration Agent |
| Integration Service | hpnnmi |
| Specific Agent ID | **Leave blank** |
| Integration Name | New Incident - Device Delivery |

Repeat for trigger values of `Notification Response` and `Event Status` and then make sure the slider switch is "on" (green showing). 


### Integration Agent

**Configuration**
1. Open the `IAHOME/conf/IAConfig.xml` file and navigate to the `<service-configs>` element near the bottom. Add the following line line inside that tag:
```
    <path>hpnnmi/hpnnmi.xml</path>
```
2. Unzip the [NNMi-IAFiles.zip](NNMi-IAFiles.zip) to `IAHOME/integrationservices/`. 
3. Open the `IAHOME/integrationservices/nnmi-config.js` file in a text editor. Populate the following values:

| Setting | Default Value | Description |
| ------- | ------------- | ----------- |
| `SERVICE_URL` | http://localhost:8081/http/applications_hpnnmi | Specifies the call back to the integration agent when subscribing to the WS- Eventing service. <br/> Requires the following format: `http://{service-gateway-host}:{service- gateway-port}/http/{domain}_{name}` |
| `NNMI_HOST` | localhost  | To configure this setting, replace "localhost" with the IP address of your local server on which the WS-Eventing subscription service is installed. |
| `NNMI_PORT` | 80 | To configure this setting, replace "80" with the port number of your local server on which the WS-Eventing subscription service is installed. (For instructions on how to determine the port required, see [Identifying your HP NNMi port](#identifying-your-hp-nnmi-port) below)  |
| `NNMI_USER` | webservices | Specifies the username of the web services client account to use when connecting to the HP NNMi web services. For more information, see "Creating a web services client" on page 19. |
| `NNMI_PASSWORD` | nnm | Specifies the password for the web services account. |
| `FILTER` | `/sys:onNotification/arg0[nature='ROOTCAUSE' and lifecycleState='com.hp.nms.incident.lifecycle.Registered' and severity='CRITICAL' and ( name='AddressNotResponding' or name='ConnectionDown' or name='InterfaceDown' or name='NodeDown' or name='NonSNMPNodeUnresponsive')]` | Specifies the filter to use when determining whether an event should be forwarded to xMatters. <br/> For instructions on how to update this setting, refer to [Updating the event injection filter](#updating-event-injection-filter) below |
| `WEB_SERVICE_URL` | | URL endpoint pointing to the `Inbound from NNMi` integration script |
| `INITIATOR` | nnmi | Username for authenticating to the `WEB_SERVICE_URL`. This should be the user created in xMatters above. |
| `INITIATOR_PASSWORD_FILE` | conf/.initiatorpasswd | Password file for the `INITIATOR` user |

8. To encrypt the password and generate the `INITIATOR_PASSWORD_FILE`, navigate to the `IAHOME/bin` directory and run the following command:
```bash
./iapassword.sh --new MYCOMPLEXPASSWORD --file conf/.initiatorpasswd
```
Replacing `MYCOMPLEXPASSWORD` with the password for the xMatters user. 

**Updating Event Recipients**
Recipients can be determined via one of two ways:
1. By adding if/else conditions to the `Inbound from NNMi` inbound integration script. For example, to target the `Operations` group when the `name` field is `ConnectionDown`: (See the [trigger an event](http://help.xmatters.com/xmAPI/#trigger-an-event) section for details on the recipients element.)
   ```javascript
   if ("ConnectionDown".equals( payload.properties.name ) ){
     payload.recipients = [ "Operations" ];
   }
   ```
2. By creating [subscriptions](http://help.xmatters.com/OnDemand/userguide/receivingalerts/subscriptions/howtousesubscriptions.htm) to dynamically determine who receives a notification. 



### Updating Event Injection Filter
By default, this integration is configured to receive all events in HP NNMi where:
* the nature of the event is ROOTCAUSE;
* the lifecycleState is com.hp.nms.incident.lifecycle.Registered;
* the severity is CRITICAL;
* and, the Event Type is one of AddressNotResponding, ConnectionDown, InterfaceDown, NonSNMPNodeUnresponsive, or NodeDown.

This is specified in the default filter in the `<IAHOME>\integrationservices\hpnnmi\nnmi-config.js` file as follows:

```javascript
// Filtering for subscription.
// Only matching Incidents will trigger the subscription call back 
var FILTER = "/sys:onNotification/arg0[nature='ROOTCAUSE' and lifecycleState='com.hp.nms.incident.lifecycle.Registered' and severity='CRITICAL' and ( name='AddressNotResponding' or name='ConnectionDown' or name='InterfaceDown' or name='NodeDown' or name='NonSNMPNodeUnresponsive')]";
```


The following NNMi incident parameters can be used in this filter expression:

| Data Type | Filter Name | NNMi Web Field | Possible Values |
| ------- | ------- | ------- | ------- | 
| Int | id |  |  | 
| String | uuid |  |  | 
| String | sourceUuid |  |  | 
| String | sourceName | Source Object  |  | 
| String | sourceNodeUuid |  |  | 
| String | sourceNodeName | Node Name  |  | 
| String | name | Name  |  | 
| String | severity | Severity  | NORMAL<br/>WARNING<br/>MINOR<br/>MAJOR<br/>CRITICAL | 
| String | priority | Priority  | com.hp.nms.incident.priority.Low <br/>com.hp.nms.incident.priority.Medium <br/>com.hp.nms.incident.priority.High <br/>com.hp.nms.incident.priority.Top <br/>com.hp.nms.incident.priority.None |
| String | lifecycleState | Lifecycle State | com.hp.nms.incident.lifecycle.Registered <br/>com.hp.nms.incident.lifecycle.InProgress<br/>com.hp.nms.incident.lifecycle.Completed<br/>com.hp.nms.incident.lifecycle.Closed |
| String | category | Category | com.hp.nms.incident.category.Fault<br/>com.hp.nms.incident.category.Status<br/>com.hp.nms.incident.category.Config<br/>com.hp.nms.incident.category.Accounting<br/>com.hp.nms.incident.category.Performance<br/>com.hp.nms.incident.category.Security<br/>com.hp.nms.incident.category.Alert |
| String | family | Family | com.hp.nms.incident.family.Address<br/>com.hp.nms.incident.family.Interface<br/>com.hp.nms.incident.family.Node<br/>com.hp.nms.incident.family.OSPF<br/>com.hp.nms.incident.family.HSRP<br/>com.hp.nms.incident.family.AggregatePort<br/>com.hp.nms.incident.family.Board<br/>com.hp.nms.incident.family.Connection<br/>com.hp.nms.incident.family.Correlation |
| String | origin | Origin | MANAGEMENTSOFTWARE<br/>MANUALLYCREATED<br/>REMOTELYGENERATED<br/>SNMPTRAP<br/>SYSLOG<br/>OTHER |
| String | nature | Correlation Nature | ROOTCAUSE<br/>SECONDARYROOTCAUSE<br/>SYMPTOM<br/>SERVICEIMPACT<br/>STREAMCORRELATION<br/>NONE |
| Int | duplicateCout | Duplicate Cout |  |
| String | formattedMessage | Message |  |
| Boolean | rcaActive | RCA Active |  |
| Date | originOccurrenceTime | Origin Occurrence Time |  |
| Date | firstOccurrenceTime | First Occurrence Time |  |
| Date | lastOccurrenceTime | Last Occurrence Time |  |
| Date | created | Created |  |
| Date | updateTime |  |  |
| String | previousLifecycleState |  |  |
| String | previousRcaActive |  |  |


## NNMi set up
### Creating a web services client

1. Launch the HP NNMi Web Console, and log in as an Administrator.
2. Under the Configuration Workspace, click User Accounts.
3. On the User Accounts tab, click New.
4. On the Account Mapping page, in the Account drop-down list, select New.
5. On the User Account page, specify the Name and Password for the Web Services Client User.
6. Click Save and Close.
   * The “webservices” user is now specified in the Account field on the Role page.
7. In the Role drop-down list, select Web Service Client.
8. Click Save and Close.
   * The Web Service Client will now allow xMatters responses to update NNMi incidents using Web Service Calls. The webservices user is listed on the User Accounts and Roles page
9. Under the Configuration Workspace, click User Account Mappings.
10. Click New, and then associate the web services client account with the NNMi Web Service Clients group.
11. Click Save and Close.


### Identifying your HP NNMi port
You can determine whether the default port setting of 80 is correct for your HP NNMi installation by checking the port information contained in the HP NNMi port configuration file, located in the following folder:

```
<NNM_DATA_DIR>\conf\nnm\props\nms-local.properties
```


# Testing

## Increase the Polling Frequency

The following section describes how the fault polling interval can be decreased to speed up the demonstration.
To adjust the fault polling interval:
If it is not already running, launch HP Network Node Manager i.
1. Log in to the HP NNMi Web Console as an Administrator.
2. Select the Configuration Workspace.
3. Open Monitoring Configuration.
4. On the Default Settings tab, in the Default Fault Monitoring dialog box, set the Fault Polling Interval to 15 seconds.
  * **Note**: A Fault Polling Interval of 15 seconds may be too short an interval on larger deployments, and can consume significant resources on the HP NNMi system. You may need to increase the interval when moving to a production deployment.
5. Click Save and Close.

## Disconnect a Computer from the LAN
If HP NNMi is monitoring a LAN, one of the easiest ways to trigger a notification is to interrupt the communication between HP NNMi and one of the computers on the LAN. The following steps describe how to do this and what to expect.
1. Physically disconnect a computer from the local area network (using a computer other than the xMatters or HP NNMi servers).
2. When the computer goes offline, an incident will be triggered within HP NNMi and can be viewed in the Incidents workspace under Root Cause Incidents (or another category depending on the trigger).
   * The Notes entry for the open incident indicates that this event has successfully notified an xMatters User
3. To display the full Notes for an incident, click the Open Incident button to open the incident, and view the Notes area.
4. The target’s specified contact type will receive a message corresponding to the notification, as shown in the following section.




# Troubleshooting

## Verifying the xMatters – HP NNMi connection:
Enable debug logging:
1. Open the `<IAHOME>\conf\log4j.xml` log configuration file.
2. Uncomment (enable) the section "All Integration Services"; it should now resemble the following:
```xml
<!-- All Integration Services -->
<logger name="com.alarmpoint.integrationagent.services">
   <level value="DEBUG"/>
</logger>
```


1. Open the integration agent log file at `<IAHOME>\log\AlarmPoint.txt`.
2. Locate the following sections:
   * If the Integration Service javascript has successfully started and connected to HP NNMi, the log file should contain a result that resembles the following:
```
2011-03-04 15:19:43,551 [Thread-8] DEBUG - Agent Client: [hpnnmi.js] Subscription with NNMi (http://192.168.170.168:8004
/nms-sdk-notify) has been made with message id (8bbd4e28-f8d0-46b3-896a-bf8d06e6d3a0). Subscription ID: urn:jbwse:266b0871-d966-4d0f-aa18-7b9217aa6da2 Expiry: Fri Mar 04 15:21:43 PST 2011 Renew in: 89449(ms)
```
   * If the Subscription Manager has failed to connect to HP NNMi, the log file should contain an error message that resembles the following:
```
2011-03-04 17:21:46,557 [Thread-12] ERROR - Agent Client: Cannot make web service call. Please check configuration information in nnmi-config.js
```




