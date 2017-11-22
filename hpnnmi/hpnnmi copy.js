importPackage(java.lang);
importPackage(java.util);
importPackage(java.io);
importPackage(java.text);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLMessage);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLMessageImpl);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLToken);
importClass(Packages.com.thoughtworks.xstream.XStream);
importClass(Packages.com.thoughtworks.xstream.converters.reflection.PureJavaReflectionProvider);


importClass(Packages.org.apache.commons.httpclient.Header);
//importClass(Packages.org.apache.commons.httpclient.HttpVersion);
importClass(Packages.org.mule.providers.http.HttpResponse);

var xStream = new XStream(new PureJavaReflectionProvider())

load("integrationservices/hpnnmi/nnmi-config.js");
load("integrationservices/hpnnmi/baseclass.js");
load("integrationservices/hpnnmi/logger.js");
load("integrationservices/hpnnmi/wsutil.js");
load("integrationservices/hpnnmi/nnmi-lifecycle.js");
load("integrationservices/hpnnmi/nnmi-subscription.js");
load("integrationservices/hpnnmi/nnmi-subscription-thread.js");
load("integrationservices/hpnnmi/nnmi-response.js");

load("lib/integrationservices/javascript/event.js");

var log = new Logger();
var preamble = "[hpnnmi.js] ";

var nnmiResponse = new NNMIResponse(NNMI_URL, NNMI_USER, NNMI_PASSWORD);

/**
 * This is the injection point to xMatters from NNMi Subscription
 *  
 * This method will parse the NNMi callback request and generate an APXML Message to be 
 * sent to xMatters via the ServiceAPI.
 *
 * Modify the apxml object to add tokens injected to xMatters.
 * NNMi incident information can be retrieved from the E4X XML object 'content'
 *
 * For example use the following command to retrieve the uuid:
 *   content.uuid.text();
 */
function apia_http( httpRequestProperties, httpResponse )
{
  // create apxml from http request 
  log.debug(preamble+"Incoming HTTP Request: " + httpRequestProperties);


  var requestBody = httpRequestProperties.getProperty("REQUEST_BODY");
  if ( requestBody == null )
  {
    log.debug(preamble+"Received unrecognize Request, no notification was created. (Suppressed)");
    return null;
  }

  log.debug( preamble + 'REQUEST_BODY: ' + requestBody );

  var content = new XML(requestBody)..arg0;
  // build apxml content
  var apxml = new XML("<transaction>" +
                      "  <header><method>Add</method><subclass>Action</subclass></header>" +
                      "  <data></data>" +
                      "</transaction>");
  var data = apxml.data;
  var incidentName = content.name.text();
  if ( incidentName.length() <= 0)
  {
    log.debug(preamble+"Received unrecognize Request, no notification was created. (Suppressed)");
    return "<error>No xMatters Event was generated as the required node <arg0><name/></arg0> was not found in the request body.</error>";
  }
/*
  // determine recipient via name of incident
  if ("AddressNotResponding".equals(incidentName))
  {
    data.appendChild(<recipients>Operations</recipients>);
  }
  else if ("ConnectionDown".equals(incidentName))
  {
    data.appendChild(<recipients>Operations</recipients>);
  }
  else if ("InterfaceDown".equals(incidentName))
  {
    data.appendChild(<recipients>Operations</recipients>);
  }
  else if ("NodeDown".equals(incidentName))
  {
    data.appendChild(<recipients>Operations</recipients>);
  }
  else
  {
    data.appendChild(<recipients>Operations</recipients>);
  }
*/


  data.appendChild(<fyi>no</fyi>);
  // direct copy of incident detail from NNMi request
  data.appendChild(<incident_id>{content.uuid.text()}</incident_id>);
  data.appendChild(<id>{content.id.text()}</id>);
  data.appendChild(<uuid>{content.uuid.text()}</uuid>);
  data.appendChild(<name>{content.name.text()}</name>);
  data.appendChild(<sourceUuid>{content.sourceUuid.text()}</sourceUuid>);
  data.appendChild(<sourceObjectName>{content.sourceName.text()}</sourceObjectName>);
  data.appendChild(<sourceNodeUuid>{content.sourceNodeUuid.text()}</sourceNodeUuid>);
  data.appendChild(<sourceNodeName>{content.sourceNodeName.text()}</sourceNodeName>);
  data.appendChild(<sourceNodeLongName>{content.sourceNodeLongName.text()}</sourceNodeLongName>);
  data.appendChild(<lifecycleState>{content.lifecycleState.text()}</lifecycleState>);
  data.appendChild(<severity>{content.severity.text()}</severity>);
  data.appendChild(<priority>{content.priority.text()}</priority>);
  data.appendChild(<category>{content.category.text()}</category>);
  data.appendChild(<family>{content.family.text()}</family>);
  data.appendChild(<nature>{content.nature.text()}</nature>);
  data.appendChild(<origin>{content.origin.text()}</origin>);
  data.appendChild(<duplicateCount>{content.duplicateCount.text()}</duplicateCount>);
  data.appendChild(<rcaActive>{content.rcaActive.text()}</rcaActive>);
  data.appendChild(<formattedMessage>{content.formattedMessage.text()}</formattedMessage>);
  data.appendChild(<originOccurrenceTime>{content.originOccurrenceTime.text()}</originOccurrenceTime>);
  data.appendChild(<firstOccurrenceTime>{content.firstOccurrenceTime.text()}</firstOccurrenceTime>);
  data.appendChild(<lastOccurrenceTime>{content.lastOccurrenceTime.text()}</lastOccurrenceTime>);
  data.appendChild(<incidentResent>{content.incidentResent.text()}</incidentResent>);
  data.appendChild(<created>{content.created.text()}</created>);
  data.appendChild(<updateTime>{content.updateTime.text()}</updateTime>);
  data.appendChild(<previousLifecycleState>{content.previousLifecycleState.text()}</previousLifecycleState>);
  data.appendChild(<previousRcaActive>{content.previousRcaActive.text()}</previousRcaActive>);

  // include cias
  var cias = content.cias;
  for (var i=0; i < cias.length(); i++)
  {
    var ciasName = cias[i].name.text();
    var ciasValue = cias[i].value.text();
    data.appendChild(new XML("<"+ciasName+">"+ciasValue+"</"+ciasName+">"));
  }

  // add custom tokens
  // data.appendChild(<custom_parameter>{content.incidentResent.text()}</custom_parameter>);
  // data.appendChild(<custom2>static custom token value</custom2>);

  //ServiceAPI.sendAPXML(new APXMLMessageImpl(apxml.toString()));

  var event = {};
  var jsonPayload = APXML.toEventJs( new APXMLMessageImpl(apxml.toString()), event );

  var xmioResp = XMIO.post( JSON.stringify( jsonPayload ), WEB_SERVICE_URL, INITIATOR, XMIO.decryptFile(INITIATOR_PASSWORD_FILE ) );

  httpResponse.setBodyString( xmioResp.body );          
  httpResponse.setHeader( new Header("Content-Type", "application/json" ) );

  return httpResponse;
}

/**
 * This is the main method for handling APXML messages sent to the 
 * Integration Service by APClient.  The messages may be requests to perform 
 * local activity, or they may be requests to make submissions to AlarmPoint.
 * <p>
 * Any APXMLMessage object that this method returns will be sent to AlarmPoint
 * via the Integration Service's outbound queues.
 */
function apia_input(apxml)
{
  // Enrich by adding/updating the timestamp token with the current time.
  // 
  // NOTE: the Date must be converted to a string; otherwise, it gets wrapped
  // in a JavaScript envelope whose toString() method returns an
  // object identifier.
  apxml.setToken("timestamp", (new Date()).toString());  

  // Forward enriched APXML to AlarmPoint.
  return apxml;  
}



function apia_callback(msg) {
  
  
  log.debug( 'callback payload: ' + JSON.stringify( msg ) );
  
  try {
  
    switch (msg.xmatters_callback_type) {

      case "response":
        handleResponse(msg);
        break;
        
      case "status":
        handleEventStatus(msg);
        break;
      
      case "deliveryStatus":
        handleDeliveryStatus(msg);
        break;
    }
    
  } catch (e) {
    log.error("apia_callback(" + msg.eventidentifier + ", " + msg.xmatters_callback_type + "): caught Exception - name: [" + e.name + "], message [" + e.message + "]: " + msg);

    throw e;
  }
}





/**
 * Call appropriate NNMI Webservices based on user response from xMatters notification
 */  
function handleResponse( msg )
{

  var response = msg.response;
  var owner    = msg.recipient;
  
  var messageText = ( msg.annotation == "null" ? null : msg.annotation );

  var additionalTokens = msg.additionalTokens;
  var nnmid = additionalTokens.uuid;
  

  log.debug("response: " + response );
  

  
  if ( !nnmid )
  {
     var errorMessage = "Request Script Failed: Request not associated with an Incident";
     log.error(errorMessage);
     return errorMessage;  
  }
  
  log.info("Processing " + response + " type response");
  
  if (response == "acknowledge")
  {
      log.debug(response);
	  if( !nnmid )
	  {
	    nnmid = nnmiResponse.getNNMiIncidentId( incidentId );
	  }
	  nnmiResponse.acknowledge( nnmid, owner );
	  
	  if(messageText)
	  {
	    nnmiResponse.annotate(nnmid, messageText);
	  }
  }
  else if (requestText == "close")
  {
      log.debug(requestText);
  	  if( !nnmid )
	  {
	    nnmid = nnmiResponse.getNNMiIncidentId( incidentId );
	  }
	  nnmiResponse.close(nnmid);
	  
	  if(messageText)
	  {
	    nnmiResponse.annotate(nnmid, messageText);
	  }
  }
  else
  {
      var errorMessage = "Unexpected request_text value: " + requestText; 
      log.error(errorMessage);
      return errorMessage;
  }
}


