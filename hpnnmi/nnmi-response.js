var NNMIResponse = WSUtil.extend({
  INCIDENT_SERVICE: "/IncidentBeanService",
  NODE_SERVICE: "/NodeBeanService",
  
  SOAP_PROJECT_FILE: "integrationservices/hpnnmi/soap/NNMi-9-1-xMatters-Integration-soapui-project.xml",

  SOAP_VERSION: "1_1",

  XMLFORMAT1: new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ"),
  XMLFORMAT2: new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ"),

  CONTENT_TYPE: "application/soap+xml;charset=UTF-8;action=\"urn:processDocument\"",

  init: function(endPoint, login, password)
  {
    this._super();
    this.endPoint = endPoint;
    this.authorization = "" + java.util.Base64.getEncoder().encodeToString( new java.lang.String(NNMI_USER+":"+NNMI_PASSWORD).getBytes() );
  },
  
  /**
   * Make subscription with NNMi
   * @param serviceEndPoint The Integration Agention HTTP end point
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @param filter NNMi filter for Incidents
   * @return an object containing subscriptionID, expiryDate and messageId if successful
   */
  getNNMiIncidentId: function( incidentId )
  {
    var response = this.getIncident( "uuid" , "EQ" , incidentId );
	  var nnmid = response.*::getIncidentsResponse['return'].item.id;
    return nnmid;
  },
  
  /**
   * Make subscription with NNMi
   * @param serviceEndPoint The Integration Agention HTTP end point
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @param filter NNMi filter for Incidents
   * @return an object containing subscriptionID, expiryDate and messageId if successful
   */
  getIncidentNotes: function( nnmid )
  {
    var response = this.getIncident( "id" , "EQ" , nnmid );
	  var notes = response.*::getIncidentsResponse['return'].item.notes;
    return notes;
  },
  
  /**
   * Make subscription with NNMi
   * @param serviceEndPoint The Integration Agention HTTP end point
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @param filter NNMi filter for Incidents
   * @return an object containing subscriptionID, expiryDate and messageId if successful
   */
  getIncident: function(name, operator, value)
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "getIncidents", "getIncidents", this.SOAP_VERSION);
  
    // Set the parameter values
    msg.setParameter("name", name);
    msg.setParameter("operator", operator);
    msg.setParameter("value", value);

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+this.INCIDENT_SERVICE+"/IncidentBean", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    return response;
  },
  

  /**
   * Renew subscription with NNMi
   * @param subscriptionId
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @return an object containing expiryDate and messageId if successful
   */
  acknowledge: function( nnmid, targetName )
  {
    var success = this.updateLifecycleState(nnmid, targetName, "com.hp.nms.incident.lifecycle.InProgress");
    
    if( !success )
    {
      return false;
    }
    
    return this.ownIncident( nnmid, targetName );
  },
  
  /**
   * Unsubscribe subscription with NNMi
   * @param subscriptionId
   * @return messageId if successful
   */
  ownIncident: function( nnmid, targetName )
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "updateAssignedTo", "updateAssignedTo", this.SOAP_VERSION);
  
    // Set the parameter values
    msg.setParameter("arg0", nnmid);
    msg.setParameter("arg1", targetName);

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+this.INCIDENT_SERVICE+"/IncidentBean", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    
    return true;
  },
  
  /**
   * Renew subscription with NNMi
   * @param subscriptionId
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @return an object containing expiryDate and messageId if successful
   */
  close: function(nnmid, targetName)
  {
    return this.updateLifecycleState(nnmid, targetName, "com.hp.nms.incident.lifecycle.Closed");
  },
  
  /**
   * Renew subscription with NNMi
   * @param subscriptionId
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @return an object containing expiryDate and messageId if successful
   */
  changePriority: function( nnmid, priority )
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "updatePriority", "updatePriority", this.SOAP_VERSION);
  
    // Set the parameter values
    msg.setParameter("arg0", nnmid);
    
    if (priority.startsWith("com.hp.nms.incident.priority.")) {
      msg.setParameter("arg1", priority);
    } else {
      msg.setParameter("arg1", "com.hp.nms.incident.priority." + priority);
    }

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+this.INCIDENT_SERVICE+"/IncidentBean", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    
    return true;
  },
  
  /**
   * Renew subscription with NNMi
   * @param subscriptionId
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @return an object containing expiryDate and messageId if successful
   */
  annotate: function( nnmid, message )
  {
    var oldNotes = this.getIncidentNotes( nnmid );
    var notes = oldNotes + "\n";
	  var now = new Date();
    notes += now.toString() + " xMatters: " + message;
	
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "updateNotes", "updateNotes", this.SOAP_VERSION);
  
    // Set the parameter values
    msg.setParameter("arg0", nnmid);
    msg.setParameter("arg1", notes);

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);
	
    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+this.INCIDENT_SERVICE+"/IncidentBean", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    
    return true;
  },
  
  /**
   * Renew subscription with NNMi
   * @param subscriptionId
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @return an object containing expiryDate and messageId if successful
   */
  updateLifecycleState: function( nnmid, targetName, lifecycleState )
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "updateLifecycleState", "updateLifecycleState", this.SOAP_VERSION);
  
    // Set the parameter values
    msg.setParameter("arg0", nnmid);
    msg.setParameter("arg1", lifecycleState);

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+this.INCIDENT_SERVICE+"/IncidentBean", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    
    return true;
  },

    /**
   * Renew subscription with NNMi
   * @param subscriptionId
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @return an object containing expiryDate and messageId if successful
   */
  getNodes: function()
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "getNodes", "getNodes", this.SOAP_VERSION);

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+this.NODE_SERVICE+"/NodeBean", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    
	return response;
  },

});
