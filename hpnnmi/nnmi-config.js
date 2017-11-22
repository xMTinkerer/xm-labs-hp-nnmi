/**
 * This file defines configuration variables for the NNMi Integration Service JS
 */

// Entry to this integration service, it is used when registering with NNMi.
// The URL serves as the callback to xMatters from NNMi.
var SERVICE_URL = "http://localhost:8081/http/applications_hpnnmi"; 

// URL to NNMi 
var NNMI_HOST = "localhost";
var NNMI_PORT = "80";
var NNMI_URL = "http://" + NNMI_HOST + ":" + NNMI_PORT;

// NNMi User to make web service calls with
var NNMI_USER = "webservices";

// Password for the NNMi User
var NNMI_PASSWORD = "nnm";

// Filtering for subscription.
// Only matching Incidents will trigger the subscription call back 
var FILTER = "/sys:onNotification/arg0[nature='ROOTCAUSE' and lifecycleState='com.hp.nms.incident.lifecycle.Registered' and severity='CRITICAL' and ( name='AddressNotResponding' or name='ConnectionDown' or name='InterfaceDown' or name='NodeDown' or name='NonSNMPNodeUnresponsive')]";


var WEB_SERVICE_URL = "<Web Service URL of NNMi Inbound Integration>"; 


var INITIATOR = "nnmi";
var INITIATOR_PASSWORD_FILE = "conf/.initiatorpasswd";
var INITIATOR_USER_ID = INITIATOR;

