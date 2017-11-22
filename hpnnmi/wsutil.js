importClass(Packages.com.alarmpoint.integrationagent.soap.SOAPMessage);
importClass(Packages.com.alarmpoint.integrationagent.soap.SOAPRequest);
importClass(Packages.com.alarmpoint.integrationagent.soap.exception.SOAPRequestException);
importClass(Packages.org.apache.commons.lang.StringEscapeUtils);
//importClass(Packages.org.apache.commons.codec.binary.Base64);

// Add trim functionality to the JavaScript String prototype
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
}

var WSUtil = BaseClass.extend({

  /**
   * Constructor
   */
  init: function()
  {
    this.log = new Logger();
  },

  /**
   * Sends the request to the SOAP endpoint and returns the response
   * @param url EndPoint for the webservice request
   * @param msg SOAPMessage instance containing the SOAPEnvelope to post
   * @param headers array of SOAP Headers to be added to the SOAP Request
   * @return SOAP Response Body
   */
  sendReceive: function(url, msg, headers)
  {
    // These variables are used by E4X to access nodes prefixed with a namespace. These namespaces are defined
    // in the SOAP Response that is parsed by E4X
    var soap = new Namespace("http://schemas.xmlsoap.org/soap/envelope/");

    var request = new SOAPRequest(url, msg.getAction());
    
    if (headers != null)
    {
      for (var it = headers.keySet().iterator(); it.hasNext();)
      {
        var key = it.next();
        var value = headers.get(key);
        this.log.debug(key + "=" + value);
        request.getSoapHeaders().put(key, value);
      }
    }
    return new XML(request.post(msg.getSoapEnvelope(msg.getRequest()))).soap::Body;
  },

  /**
   * Encodes the given string using the base64 algorithm
   * @param msg String to encode
   * @return a base64 encrypted String
   */
   /*
  base64Encode: function(msg)
  {
    var encoder = new Base64();
    return new java.lang.String(encoder.encodeBase64(new java.lang.String(msg).getBytes("UTF8")), "UTF8");
  }
  */
});
