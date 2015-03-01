using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blockly3PiHost.RemoteLaunch
{
    public class Launcher : MarshalByRefObject
    {
        [Serializable]
        public struct LaunchResult
        {
            public int ResultCode;
            public string Output;
            public string ErrorOutput;
        }

        public LaunchResult Launch(string command, string parameters, string workingDir)
        {
            ProcessStartInfo info = new ProcessStartInfo()
            {
                CreateNoWindow = true,
                UseShellExecute = false,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                Arguments = parameters,
                FileName = command,
                WorkingDirectory = workingDir
            };

            var proc = new Process()
            {
                StartInfo = info
            };

            proc.Start();

            proc.WaitForExit();

            string output = proc.StandardOutput.ReadToEnd();
            string errorText = proc.StandardError.ReadToEnd();


            int result = proc.ExitCode;
            return new LaunchResult() { ResultCode = result, Output = output, ErrorOutput = errorText };
        }

        public void Quit()
        {
            RemoteHost.WaitHandle.Set();
        }
    }
}
