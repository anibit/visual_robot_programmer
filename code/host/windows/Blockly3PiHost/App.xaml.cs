using Blockly3PiHost.Properties;
using Gecko;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Remoting;
using System.Threading.Tasks;
using System.Windows;

namespace Blockly3PiHost
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {

        public RemoteLaunch.Launcher Launcher
        {
            get;
            private set;
        }

        private void App_Startup(object sender, StartupEventArgs e)
        {
            //perform settings upgrade, if needed.
            if (Settings.Default.SettingsNeedUpgrade)
            {
                Settings.Default.Upgrade();
                Settings.Default.SettingsNeedUpgrade = false;
                Settings.Default.Save();
            }
            RemotingConfiguration.Configure("arduino.launcher.client.config", false);

            var launcher = new RemoteLaunch.Launcher();

            bool isProxy = RemotingServices.IsTransparentProxy(launcher);

            if (!isProxy)
            {
                MessageBox.Show("The part of me that talks to the Arduino could not be started.", "There seems to be a problem");
            }
            else
            {
                Launcher = launcher;
            }


            string dir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);

            Gecko.Xpcom.Initialize(Path.Combine(dir, "xulrunner"));
            //from http://stackoverflow.com/questions/26853571/how-to-use-getusermedia-with-geckofx
            GeckoPreferences.User["plugin.state.flash"] = true;
            GeckoPreferences.User["browser.xul.error_pages.enabled"] = true;
            GeckoPreferences.User["media.navigator.enabled"] = true;
            GeckoPreferences.User["security.fileuri.strict_origin_policy"] = false;
            /* The following line is the key: */
            GeckoPreferences.User["media.navigator.permission.disabled"] = true;
            //This prevents the local app from using local storage, it's too flaky, or there is something not right about how we interact with gecko
            GeckoPreferences.User["dom.storage.enabled"] = false;

        }

        private void Application_Exit(object sender, ExitEventArgs e)
        {
            if (Launcher != null)
            {
                Launcher.Quit();
            }
        }
    }
}
