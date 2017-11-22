/**
 * This file defines subscription thread for the NNMi Integration Service JS
 */
var EVENTING_ENDPOINT = "/nms-sdk-notify";
var EXPIRY_INTERVAL = 1000 * 60 * 2; // ms before subscription expires
var SLEEP_PERIOD_SAFETY = 1000 * 30; // ms to wake before actual subscription expiration

var sleep_duration = 60000; // in unit of ms
var keepPollThreadAlive = true;
var shouldContinuePolling = true;
var pollingThread = null;

var nnmiSub = new NNMI(NNMI_URL + EVENTING_ENDPOINT, NNMI_USER, NNMI_PASSWORD);

/**
 * This is the main method for the NNMi subscription thread.
 * Creation of this thread is performed in the NNMi Integration Service's startup hook.
 *   nnmi-lifecycle.js --> apia_startup()
 * 
 * The thread loop is controlled by two variables:
 *   keepPollThreadAlive  : If value is false then the loop does not continue. 
 *   shouldContinuePolling: If value is true then a subscription or renew 
 *                          web service request is made to NNMi. Otherwise the
 *                          loop will continue with NOOP.
 * 
 * When a subscription is made with NNMi the subscription ID is kept in the variable
 * subscriptionId. This variable is checked to determine if a renew or subscribe request
 * should be made.
 * 
 * Sleep Duration is controlled by the subscription expiry date returned from the request
 * to NNMi. The logic is: Expiry Date - Current Time - Safety
 * 
 */
function polling_method()
{
  var xmlUtcFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
  xmlUtcFormat.setTimeZone(java.util.TimeZone.getTimeZone("GMT+00:00"));

  var subscriptionId = null;
  var expiresOn = null;

  while (keepPollThreadAlive)
  {
    if (shouldContinuePolling)
    {
      var messageId = null;

      // send subscription request
      var expiryDateTime = new java.util.Date();
      expiryDateTime.setTime(expiryDateTime.getTime() + EXPIRY_INTERVAL);

      if (subscriptionId == null)
      { // initial subscription
        log.debug(preamble + "Making initial subscription");
        var subscriptionDetails = nnmiSub.subscribe( SERVICE_URL, xmlUtcFormat.format(expiryDateTime), FILTER );
        subscriptionId = subscriptionDetails.subscriptionId;
        expiresOn = subscriptionDetails.expiryDate;
        messageId = subscriptionDetails.messageId;
      }
      else
      { // renew subscription
        log.debug(preamble + "Renewing subscription: " + subscriptionId);
        var renewDetails = nnmiSub.renew(subscriptionId, xmlUtcFormat.format(expiryDateTime));
        expiresOn = renewDetails.expiryDate;
        messageId = renewDetails.messageId;
      }

      var now = new Date();
      // should wake up thread before expiry, the exact #of ms to wake before is defined by the variable
      // SLEEP_PERIOD_SAFETY
      sleep_duration = expiresOn.getTime() - now.getTime() - SLEEP_PERIOD_SAFETY;
      log.debug(preamble + "Subscription with NNMi ("+NNMI_URL + EVENTING_ENDPOINT + ") has been made with message id (" +
                messageId + "). Subscription ID: " +
                subscriptionId + " Expiry: " + expiresOn + " Renew in: " + sleep_duration + "(ms)");
      try
      {
        pollingThread.sleep(sleep_duration);
      }
      catch( e )
      {
        if (e instanceof java.lang.InterruptedException)
        { // we are not worried about interrupted sleep
          log.info(preamble+"Polling thread was interrupted.");
        }
      }
    }
    // If polling thread is suspended ie shouldContinuePolling is false and we already have a subscription
    // with NNMi, ie subscriptionId != null then send an unsubscribe request to NNMi
    else if (subscriptionId != null)
    { // unsubscribe on suspend
      log.debug("Unsubscribe subscription (" + subscriptionId + ") due to service suspension.");
      nnmiSub.unsubscribe(subscriptionId);
      subscriptionId = null;
    }
  }
  if (subscriptionId != null)
  { // unsubscribe on shut down
    log.debug("Unsubscribe subscription (" + subscriptionId + ") due to service shut down.");
    nnmiSub.unsubscribe(subscriptionId);
    subscriptionId = null;
  }
  log.info(preamble+"Polling thread is shut down.");
}
