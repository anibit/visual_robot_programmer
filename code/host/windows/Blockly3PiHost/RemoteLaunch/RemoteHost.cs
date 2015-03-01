using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Remoting;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Blockly3PiHost.RemoteLaunch
{
    public class RemoteHost
    {
        public static EventWaitHandle WaitHandle
        {
            get;
            private set;
        }

        public void StartUp(int parentID)
        {
            WaitHandle = new EventWaitHandle(false, EventResetMode.AutoReset);

            RemotingConfiguration.Configure("arduino.launcher.config", false);

            bool quit = false;
            while (!quit)
            {
                if (WaitHandle.WaitOne(1000))
                {
                    //give time for remoting to complete.
                    Thread.Sleep(1000);
                    quit = true;
                }
                else
                {
                    if (parentID != 0)
                    {
                        var parentProc = Process.GetProcessById(parentID);
                        if (parentProc.HasExited)
                        {
                            quit = true;
                        }
                    }
                }
            }


            
        }

    }
}
