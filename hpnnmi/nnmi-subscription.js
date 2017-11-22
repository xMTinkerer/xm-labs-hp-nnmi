var NNMI = WSUtil.extend({

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
  subscribe: function(serviceEndPoint, expiryDate, filter)
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "SubscribeOp", "SubscribeOp", this.SOAP_VERSION);
  
    // Set the parameter values
    var messageId = UUID.randomUUID().toString();
    msg.setParameter("message_id", messageId);
    msg.setParameter("service_endpoint", serviceEndPoint);
    msg.setParameter("expiry_date", expiryDate);
    if (filter != null && filter.length > 0)
    {
      msg.setParameter("filter", filter);
    }

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+"/subscribe", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    var expiryDateString = response.*::SubscribeResponse.*::Expires;
    return { subscriptionId : response.*::SubscribeResponse.*::SubscriptionManager.*::ReferenceParameters.*::Identifier,
             expiryDate     : this.parseDateString(expiryDateString),
             messageId      : messageId
           };
  },

  /**
   * Renew subscription with NNMi
   * @param subscriptionId
   * @param expiryDate XML date for subscription expiry ie 2011-02-25T11:58:05-08:00
   * @return an object containing expiryDate and messageId if successful
   */
  renew: function(subscriptionId, expiryDate)
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "RenewOp", "RenewOp", this.SOAP_VERSION);
  
    // Set the parameter values
    var messageId = UUID.randomUUID().toString();
    msg.setParameter("message_id", messageId);
    msg.setParameter("subscription_id", subscriptionId);
    msg.setParameter("expiry_date", expiryDate);

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    try
    {
      var response = this.sendReceive(this.endPoint+"/manage", msg, requestProperties);
    }
    catch ( e )
    {
      log.error("Cannot make web service call. Please check configuration information in nnmi-config.js");
      throw e;
    }
    var expiryDateString = response.*::RenewResponse.*::Expires;
    return { expiryDate : this.parseDateString(expiryDateString),
             messageId  : messageId
           };
  },

  /**
   * Unsubscribe subscription with NNMi
   * @param subscriptionId
   * @return messageId if successful
   */
  unsubscribe: function(subscriptionId)
  {
    var msg = new SOAPMessage(this.SOAP_PROJECT_FILE, "UnsubscribeOp", "UnsubscribeOp", this.SOAP_VERSION);
  
    // Set the parameter values
    var messageId = UUID.randomUUID().toString();
    msg.setParameter("message_id", messageId);
    msg.setParameter("subscription_id", subscriptionId);

    // Set the request properties
    var requestProperties = new HashMap();
    requestProperties.put("Content-Type", this.CONTENT_TYPE);
    requestProperties.put("Authorization", "Basic " + this.authorization);

    // Post the message to the SOAP endpoint
    var response = this.sendReceive(this.endPoint+"/manage", msg, requestProperties);
    var expiryDateString = response.*::RenewResponse.*::Expires;
    return messageId;
  },

  parseDateString: function(dateString)
  {
    // Reformat the string to remove the : from the timezone
    var ds = new String(dateString);
    var tzEnd = ds.substring(ds.length - 2);
    var tzStart = ds.substring(0, ds.length - 3);
    ds = new String(tzStart + tzEnd);
    var date = null;
    try { date = this.XMLFORMAT1.parse(ds); } catch(e) { }
    if(date == null)
    {
      date = this.XMLFORMAT2.parse(ds);
    }
    return date;
  }
});

