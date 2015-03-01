using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blockly3PiHost
{
    class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            if (args != null && args.Length > 0 && args.Any(a => a == "doremote") ) {
                RemoteLaunch.RemoteHost host = new RemoteLaunch.RemoteHost();
                int parentID;
                if (!int.TryParse(args[0], out parentID))
                {
                    parentID = 0;
                }

                host.StartUp(parentID);
            } else {
                //we also need to spawn another instance of the app to handle launching the arduino
                //This is a work-around for conflicts casue in the process/subprocess environments between GeckoFX and the Arduino IDE
                if (args == null || args.Length == 0 || args.All(a => a != "skipremote"))
                {
                    LaunchOtherInstance();
                }
                App.Main();
            }

        }

        /// <summary>
        /// Launches another instance of this application, with command line options that cause it to become a remoting server
        /// that accepts RPC calls to launch the Arduino IDE. The server loads minimal dlls, so to avoid conflicts with dlls and dynamic 
        /// symbols in this processes's environment.
        /// </summary>
        static void LaunchOtherInstance()
        {
            string command = System.Reflection.Assembly.GetExecutingAssembly().Location;


            string args = Process.GetCurrentProcess().Id.ToString() + " doremote ";


            ProcessStartInfo info = new ProcessStartInfo()
            {
                CreateNoWindow = true,
                UseShellExecute = false,
                Arguments = args,
                FileName = command,
            };

            var proc = new Process()
            {
                StartInfo = info
            };

            proc.Start();

        }
    }
}
