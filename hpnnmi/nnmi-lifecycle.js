/**
 * This file defines the life cycle hooks for the Integration Service JS
 */

/**
 * This is the method called when the Integration Agent starts
 * this Integration Service.
 * 
 * <p>
 * For the NNMi integration we will start the thread which makes periodic
 * subscription to NNMi.
 */
function apia_startup()
{
  log.debug(preamble+"Entered Startup Hook.");
  pollingThread = spawn(polling_method);
  return true;
}

/**
 * This is the method called when the Integration Agent shut down
 * this Integration Service.
 * <p>
 * For the NNMi integration we will stop the thread which makes periodic
 * subscription to NNMi.
 */
function apia_shutdown()
{
  log.debug(preamble+"Entered Shutdown Hook.");
  shouldContinuePolling = false;
  keepPollThreadAlive = false;
  return true;
}

/**
 * This is the method called when the Integration Agent suspends
 * this Integration Service. For example when the below command is executed.
 *   iadmin.sh suspend hpnnmi
 * <p>
 * For the NNMi integration we will suspend the thread which makes periodic
 * subscription to NNMi.
 */
function apia_suspend()
{
  log.debug(preamble+"Entered Suspend Hook.");
  shouldContinuePolling = false;
  apia_interrupt();
  return true;
}

/**
 * This is the method called when the Integration Agent suspends
 * this Integration Service. For example when the below command is executed.
 *   iadmin.sh resume hpnnmi
 * <p>
 * For the NNMi integration we will resume the thread which makes periodic
 * subscription to NNMi.
 */
function apia_resume()
{
  log.debug(preamble+"Entered Resume Hook.");
  shouldContinuePolling = true;
  return true;
}

/**
 * This is the method called when the Integration Agent interrupts
 * this Integration Service. For example when the below command is executed.
 *   iadmin.sh suspend-now hpnnmi
 * <p>
 * For the NNMi integration we will interrupt the thread which makes periodic
 * subscription to NNMi. This will cause the thread to wake before the sleep duration
 * is over.
 */
function apia_interrupt()
{
  log.debug(preamble+"Entered Interrupt Hook.");
  if (pollingThread != null)
  {
    pollingThread.interrupt();
  }
  return true;
}
