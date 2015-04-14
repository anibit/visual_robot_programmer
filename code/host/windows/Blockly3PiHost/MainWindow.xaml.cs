using Blockly3PiHost.Properties;
using Gecko;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.IO.Ports;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Xml;
using IOPath = System.IO.Path;

namespace Blockly3PiHost
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window, INotifyDataErrorInfo
    {

        #region Private Data
        //IEnumerable<ProgrammerInfo> _programmerInfo;
        List<string> _tempPathsCreated = new List<string>();
        string _updateDownloadUrl;
        #endregion

        #region Properties
        /// <summary>
        /// A list of temporary files and folders created that should be cleaned up on exit
        /// </summary>
        #endregion

        //This application is really too small, IMHO, to warrant a full MVVM implementation, this is my compromise. 
        #region Dependency Properties

        static readonly DependencyProperty AppVersionProperty = DependencyProperty.Register("AppVersion", typeof(string), typeof(MainWindow));
        public string AppVersion
        {
            get
            {
                return GetValue(AppVersionProperty) as string;
            }
            set
            {
                SetValue(AppVersionProperty, value);
            }
        }

        static readonly DependencyProperty WebAppVersionProperty = DependencyProperty.Register("WebAppVersion", typeof(string), typeof(MainWindow));
        public string WebAppVersion
        {
            get
            {
                return GetValue(WebAppVersionProperty) as string;
            }
            set
            {
                SetValue(WebAppVersionProperty, value);
            }
        }

        static readonly DependencyProperty ArduinoPathProperty = DependencyProperty.Register("ArduinoPath", typeof(string), typeof(MainWindow));
        public string ArduinoPath
        {
            get
            {
                return GetValue(ArduinoPathProperty) as string;
            }
            set
            {
                SetValue(ArduinoPathProperty, value);
            }

        }

        static readonly DependencyProperty ProgrammersProperty = DependencyProperty.Register("Programmers", typeof(ProgrammerInfo[]), typeof(MainWindow));
        public ProgrammerInfo[] Programmers
        {
            get
            {
                return GetValue(ProgrammersProperty) as ProgrammerInfo[];
            }
            set
            {
                SetValue(ProgrammersProperty, value);
            }
        }

        static readonly DependencyProperty SelectedProgrammerProperty = DependencyProperty.Register("SelectedProgrammer", typeof(ProgrammerInfo), typeof(MainWindow));
        public ProgrammerInfo SelectedProgrammer
        {
            get
            {
                return GetValue(SelectedProgrammerProperty) as ProgrammerInfo;
            }

            set
            {
                SetValue(SelectedProgrammerProperty, value);
            }
        }


        static readonly DependencyProperty ProgrammerPortsProperty = DependencyProperty.Register("ProgrammerPorts", typeof(string[]), typeof(MainWindow));
        public string[] ProgrammerPorts
        {
            get
            {
                return GetValue(ProgrammerPortsProperty) as string[];
            }
            set
            {
                SetValue(ProgrammerPortsProperty, value);
            }
        }

        static readonly DependencyProperty SelectedPortProperty = DependencyProperty.Register("SelectedPort", typeof(string), typeof(MainWindow));
        public string SelectedPort
        {
            get
            {
                return GetValue(SelectedPortProperty) as string;

            }
            set
            {
                SetValue(SelectedPortProperty, value);
            }
        }

        public static readonly DependencyProperty OptionHeaderTextProperty = DependencyProperty.Register("OptionHeaderText", typeof(string), typeof(MainWindow));
        public string OptionHeaderText
        {
            get
            {
                return GetValue(OptionHeaderTextProperty) as string;
            }
            set
            {
                SetValue(OptionHeaderTextProperty, value);
            }
        }
        #endregion


        public MainWindow()
        {
            DataContext = this;
            InitializeComponent();
            var descriptor = DependencyPropertyDescriptor.FromProperty(ArduinoPathProperty, typeof(Control));
            //NOTE this would be a concerning memory leak, if this was not the main window that ran the entire lifetime of the app anyways.
            //essentially, it attaches a reference to this window to the static dependency property, which prevents garbage collection. If this were a helper window,
            //we'd have to wrap this in a weak reference. 
            descriptor.AddValueChanged(this, delegate {
                ProgrammerInfo[] programmers = GetAllProgrammers(ArduinoPath).ToArray();
                ProgrammerInfo oldSelectedProgrammer = SelectedProgrammer;
                Programmers = programmers;
                SelectedProgrammer = oldSelectedProgrammer != null ? Programmers.FirstOrDefault(p => p.Name == oldSelectedProgrammer.Name) : null;
                UpdateValidationState();
            });


            descriptor = DependencyPropertyDescriptor.FromProperty(SelectedProgrammerProperty, typeof(Control));
            descriptor.AddValueChanged(this, delegate
            {
                UpdateValidationState();
            });


            descriptor = DependencyPropertyDescriptor.FromProperty(SelectedPortProperty, typeof(Control));
            descriptor.AddValueChanged(this, delegate
            {
                UpdateValidationState();
            });


        }

        #region Property Validation
        List<KeyValuePair<string, string>> errors = new List<KeyValuePair<string, string>>();
        public event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;

        void UpdateValidationState()
        {
            var newErrors = new List<KeyValuePair<string, string>>();
            if (string.IsNullOrWhiteSpace(ArduinoPath) || !File.Exists(ArduinoPath))
            {
                newErrors.Add(new KeyValuePair<string, string>("ArduinoPath", "The path to your Arduino IDE is invalid"));
            }
            else
            {
                if (new FileInfo(ArduinoPath).Extension.ToLowerInvariant() != ".exe")
                {
                    newErrors.Add(new KeyValuePair<string, string>("ArduinoPath", "The path to your Arduino IDE must point to 'Arduino.exe'"));
                }
                else
                {
                    //Check the arduino version
                    string arduinoDir = IOPath.GetDirectoryName(ArduinoPath);
                    string revisionsPath = IOPath.Combine(arduinoDir, "revisions.txt");
                    if (File.Exists(revisionsPath))
                    {
                        List<string> lines = new List<string>();
                        using (var s = File.OpenText(revisionsPath))
                        {
                            while (!s.EndOfStream)
                            {
                                string line = s.ReadLine().Trim();
                                int arduinoKeyIndex = line.ToUpper().IndexOf("ARDUINO");
                                if (arduinoKeyIndex >= 0)
                                {
                                    var version = line.Substring(8);
                                    var versions = version.Split('.');
                                    int major;
                                    int minor;
                                    if (int.TryParse(versions[0], out major) && int.TryParse(versions[1], out minor))
                                    {
                                        if (major == 1 && minor < 6)
                                        {
                                            newErrors.Add(new KeyValuePair<string, string>("ArduinoPath", "Your Arduino version is too old, please use version 1.6 or higher!"));
                                        }
                                    }
                                    break;
                                }
                                lines.Add(s.ReadLine().Trim());
                            }
                        }
                    }   


                            
                }

            }
            //not all programmers require ports, 
            if (SelectedProgrammer == null || string.IsNullOrWhiteSpace(SelectedProgrammer.Name) || !Programmers.Any(s => s.Name == SelectedProgrammer.Name))
            {
                newErrors.Add(new KeyValuePair<string, string>("Programmers", "Please select a programmer that matches your hardware"));
                
            }
            else
            {
                if (SelectedProgrammer.UsesSerial)
                {
                    if (string.IsNullOrWhiteSpace(SelectedPort) || !ProgrammerPorts.Contains(SelectedPort))
                    {
                        newErrors.Add(new KeyValuePair<string,string>("SelectedPort", "You need to set a port to use with the selected programmer"));
                    }

                }
            }
            var oldErrors = errors;
            errors = newErrors;
            if (errors.Count > 0 )
            {
                errors.Add(new KeyValuePair<string, string>("OptionHeaderText", "There are problems with your setup!"));
                OptionHeaderText = "Options [PROBLEMS DETECTECTED]";
            }
            else
            {
                OptionHeaderText = "Options";
            }
            if (ErrorsChanged != null)
            {
                foreach (var property in (from e in errors select e.Key).Concat(from e in oldErrors select e.Key).Distinct())
                {
                    ErrorsChanged(this, new DataErrorsChangedEventArgs(property));
                }
            }

        }

        public System.Collections.IEnumerable GetErrors(string propertyName)
        {
            return from e in errors where e.Key == propertyName select e.Value;
        }

        public bool HasErrors
        {
            get 
            {
                return errors.Count > 0;
            }
        }
        private void Expander_Error(object sender, ValidationErrorEventArgs e)
        {
            Console.WriteLine(e);
        }
        
        #endregion

        #region UI Event handlers

        void Window_Loaded(object sender, RoutedEventArgs e)
        {
            if (Settings.Default.CheckForUpdates)
            {
                CheckForUpdates();
            }
            //Temp
            ProgrammerInfo[] programmers = GetAllProgrammers(Settings.Default.ArduinoPath).ToArray();
            Programmers = programmers;
            string[] ports = SerialPort.GetPortNames();
            ProgrammerPorts = ports;
            //end temp

            if (Settings.Default.WindowWidth > 0)
            {
                Width = Settings.Default.WindowWidth;
            }

            if (Settings.Default.WindowHeight > 0)
            {
                Height = Settings.Default.WindowHeight;
            }

            if (Settings.Default.WindowIsMaximized)
            {
                WindowState = WindowState.Maximized;
            }

            AppVersion = Assembly.GetExecutingAssembly().GetName().Version.ToString();

            ArduinoPath = Settings.Default.ArduinoPath;

            SelectedProgrammer = Programmers.FirstOrDefault(p => p.Name == Settings.Default.SelectedPogrammer);
            SelectedPort = Settings.Default.SelectedPort;

            _browser.UseHttpActivityObserver = true;

            _browser.AddMessageEventListener("isAppHosted", (string s) => NotifyWebAppisHosted(s)); 
            _browser.CreateWindow += _browser_CreateWindow;

            _browser.EnableJavascriptDebugger();
            string fullWebRoot = 
                IOPath.Combine(IOPath.GetDirectoryName( Assembly.GetExecutingAssembly().Location), StaticConfig.LocalWebRootPath);

            _browser.Navigate("file:///" + fullWebRoot);
        }

        void _browser_CreateWindow(object sender, GeckoCreateWindowEventArgs e)
        {
            //Console.WriteLine(e);
            if (!string.IsNullOrWhiteSpace( e.Uri))
            {
                string browserUrl = _browser.Url.GetLeftPart(UriPartial.Path);
                string browserRoot = browserUrl.Substring(0, browserUrl.LastIndexOf('/'));
                if (e.Uri.StartsWith(browserRoot) && false)
                {
                    //then we're opening a local file
                }
                else
                {

                    var uri = e.Uri == "https://www.paypal.com/cgi-bin/webscr" ?
                        "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DXBL3RF9PNXJU" :   //donate button was clicked. then we change the URL from a form submit
                        e.Uri;

                    //Create a temporary file to open in the browser. This is hackish, but gives us a ton more control
                    //of how the page loads, in a platform and browser-agnostic way. Without this, we'd have a hard time
                    //opening to anchors.
                    string template = 
@"<html>
    <head>
        <meta http-equiv='refresh' content='0;url={0}' />
    </head>
</html>
";
                    string tempFileContents = string.Format(template, uri);
                    string tempPath = IOPath.Combine(IOPath.GetTempPath(), IOPath.GetRandomFileName());
                    string browseTempFile = IOPath.Combine(tempPath, "temp.html");

                    Directory.CreateDirectory(tempPath);

                    using (var f = File.OpenWrite(browseTempFile))
                    using (var sw = new StreamWriter(f))
                    {
                        sw.Write(tempFileContents);
                        _tempPathsCreated.Add(tempPath);
                    }

                    ProcessStartInfo info = new ProcessStartInfo()
                    {
                        UseShellExecute = true,
                        FileName = "file:///" + new FileInfo(browseTempFile).FullName
                    };

                    var proc = new Process()
                    {
                        StartInfo = info
                    };

                    proc.Start();
                    
                }
                
                e.Cancel = true;
                Console.WriteLine(e.Uri);
            }
        }

        void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            string jsResults;
            using (var context = new AutoJSContext(_browser.Window.JSContext))
            using (new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
            {
                context.EvaluateScript("(Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace)))", out jsResults);
            }
            _browser.Navigate("");
            _browser.Dispose();

            Settings.Default.WindowWidth = Width;
            Settings.Default.WindowHeight = Height;
            Settings.Default.WindowIsMaximized = WindowState == WindowState.Maximized;
            Settings.Default.ArduinoPath = ArduinoPath;
            Settings.Default.SelectedPogrammer = SelectedProgrammer != null ? SelectedProgrammer.Name : "";
            Settings.Default.SelectedPort = SelectedPort;



            Settings.Default.SavedProgram = jsResults;


            Settings.Default.Save();

            foreach (var tempPath in _tempPathsCreated)
            {
                if (File.Exists(tempPath))
                {
                    File.Delete(tempPath);
                }
                else if (Directory.Exists(tempPath))
                {
                    Directory.Delete(tempPath, true);

                }
            }
        }

        #endregion

        void _browser_ConsoleMessage(object sender, ConsoleMessageEventArgs e)
        {
            Console.WriteLine(e.Message);
        }

        void _browser_ShowContextMenu(object sender, GeckoContextMenuEventArgs e)
        {
            
        }

        void Upload_Click(object sender, RoutedEventArgs e)
        {
            string message;
            if (ValidateArduinoSetup(ArduinoPath, Programmers, SelectedProgrammer, ProgrammerPorts, SelectedPort, true, out message))
            {
                string jsResults;

                using (AutoJSContext context = new AutoJSContext(_browser.Window.JSContext))
                using (JSAutoCompartment compartment = new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
                {
                    context.EvaluateScript("(Blockly.Generator.workspaceToCode('Arduino'))", out jsResults);
                }

                System.Drawing.Bitmap bmp = new System.Drawing.Bitmap(_browser.ClientRectangle.Width, _browser.ClientRectangle.Height);
                _browser.DrawToBitmap(bmp, _browser.ClientRectangle);

                var screenshot = System.Windows.Interop.Imaging.CreateBitmapSourceFromHBitmap(
                    bmp.GetHbitmap(),
                    IntPtr.Zero,
                    System.Windows.Int32Rect.Empty,
                    BitmapSizeOptions.FromWidthAndHeight(bmp.Width, bmp.Height));

                //The following is like 3 card Monty with threads and contexts, but it does work ;)
                var loadingWindow = new UploadingWindow() { Owner = this, WindowStartupLocation = System.Windows.WindowStartupLocation.CenterOwner};

                loadingWindow.BlocksImage.Source = screenshot;
                IsEnabled = false;

                loadingWindow.Loaded += (s, ev) => {
                    Task.Run(() =>
                    {
                        string errorText;
                        bool result = SendToArduino(true, jsResults, out errorText);
                        Dispatcher.InvokeAsync(() =>
                        {
                            loadingWindow.Close();
                            IsEnabled = true;
                            if (result)
                            {
                                MessageBox.Show(this, "Success!" ,"Upload Complete!",MessageBoxButton.OK,MessageBoxImage.Information);

                            }
                            else
                            {                                
                                MessageBox.Show(this, "There were problems:\n" + errorText ?? "UNKNOWN ERROR","Upload Failed :(", MessageBoxButton.OK,
                                    MessageBoxImage.Error);
                            }
                        } );
                    
                    });

                };
                loadingWindow.ShowDialog();
            }

        }


        void OpenInIDE_Click(object sender, RoutedEventArgs e)
        {
            string message;
            if (ValidateArduinoSetup(ArduinoPath, Programmers, SelectedProgrammer, ProgrammerPorts, SelectedPort, false, out message))
            {
                string jsResults;

                using (AutoJSContext context = new AutoJSContext(_browser.Window.JSContext))
                using (JSAutoCompartment compartment = new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
                {
                    context.EvaluateScript("(Blockly.Generator.workspaceToCode('Arduino'))", out jsResults);
                }
                string errorText;
                SendToArduino(false, jsResults, out errorText);
            }
            else
            {
                MessageBox.Show(message, "There is a problem with your setup");
            }

        }

        void Update_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrWhiteSpace( _updateDownloadUrl))
            {
                ProcessStartInfo info = new ProcessStartInfo()
                {
                    UseShellExecute = true,
                    FileName = _updateDownloadUrl
                };

                var proc = new Process()
                {
                    StartInfo = info
                };

                proc.Start();
                
            }
        }

        public static bool ValidateArduinoSetup(string arduinoPath,ProgrammerInfo[] programmers, ProgrammerInfo selectedProgrammer,
            string[] ports, string selectedPort, bool forUpload, out string message)
        {
            if (string.IsNullOrWhiteSpace( arduinoPath) || !File.Exists(arduinoPath) )
            {
                message = "The path to your Arduino IDE is invalid";
                return false;
            }
            var ardPathInfo = new FileInfo(arduinoPath);
            if (ardPathInfo.Extension.ToLowerInvariant() != ".exe")
            {
                message = "The path to your Arduino IDE must point to 'Arduino.exe'";
                return false;
            }

            if (forUpload)
            { 
                //not all programmers require ports, 
                if (selectedProgrammer == null || string.IsNullOrWhiteSpace(selectedProgrammer.Name) || !programmers.Any(s => s.Name == selectedProgrammer.Name))
                {
                    message = "The Selected";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(selectedPort) || !ports.Contains(selectedPort))
                {

                }
            }
            message = "";
            return true;
        }

        //This function may or may not be executing in the main application thread.
        //Any access to "this" object must be asynchronously invoked
        bool SendToArduino(bool upload, string arduinoCode, out string errorText)
        {
            string tempPath = IOPath.GetTempPath();
            string makeTempRoot = IOPath.Combine(tempPath, IOPath.GetRandomFileName(), "maketemp");
            string makeBuildRoot = IOPath.Combine(makeTempRoot, "build");

            if (!Directory.Exists(makeTempRoot))
            {
                Directory.CreateDirectory(makeTempRoot);
                if (!Directory.Exists(makeBuildRoot))
                {
                    Directory.CreateDirectory(makeBuildRoot);
                }
            }

            //files that may be open in the IDE are not marked for deletion!
            if (upload)
            {
                Dispatcher.InvokeAsync(() =>
                {
                    _tempPathsCreated.Add(makeTempRoot);
                });
            }

            string inoFilePath = IOPath.Combine(makeTempRoot, "maketemp.ino");

            using (var stream = new FileStream(inoFilePath, FileMode.Create))
            using (var sr = new StreamWriter(stream))
            {
                sr.Write(arduinoCode);
            }
            
            //To get the value from any thread.
            string arduinoCommand = Dispatcher.Invoke(() => ArduinoPath);
            string workingDir = new FileInfo(arduinoCommand).Directory.FullName;

            string args = "";
            if (upload)
            {
                string boardQualifiedName = GetBoardQualifiedName(arduinoCommand, "orangutan_328");
                //For some reason, the Arduino launch4j app REFUSES to do anything when the no-splash parameter is called.
                //I've wasted too many hours trying to crack this, so I'm just going to live with the stupid splash screen for now.
                //args += "--l4j-no-splash ";
                //This is a potential work-around...
                //Start hack
                string arduinoDirectoy = IOPath.GetDirectoryName(arduinoCommand);
                string alternateArduinoExe = IOPath.Combine(arduinoDirectoy, "arduino_debug.exe");
                if (File.Exists(alternateArduinoExe))
                {
                    arduinoCommand = alternateArduinoExe;
                }
                //end hack
                string port = Dispatcher.Invoke(() => SelectedPort);
                string programmer = Dispatcher.Invoke(() => SelectedProgrammer != null ? SelectedProgrammer.Name : "unknown");
                args += string.Format("--board {0} --upload --port {1} --pref build.path={2} --pref programmer={3}  ",
                    boardQualifiedName, port, IOPath.GetFullPath(makeBuildRoot), programmer);
            }
            
            args = args + new FileInfo(inoFilePath).FullName;
            bool waitOnProcess = upload;
            var result = (Application.Current as App).Launcher.Launch(arduinoCommand, args, workingDir, waitOnProcess);
            errorText = result.ErrorOutput;
            return result.ResultCode == 0 && ! (errorText != null && (errorText.Contains("error") || errorText.Contains("fail") ));
        }



        private void IDE_Browse_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog dlg = new OpenFileDialog() 
            { 
                Title = "Select The location of your Arduino IDE..",
                Filter = "Arduino executable|arduino.exe"
            };

            if (dlg.ShowDialog(this) ?? false)
            {
                ArduinoPath = dlg.FileName;
            }
        }


        private void Discard_Click(object sender, RoutedEventArgs e)
        {
            string jsResults;
            using (var context = new AutoJSContext(_browser.Window.JSContext))
            using (new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
            {
                context.EvaluateScript("discard();", out jsResults);
            }

        }

        void Save_Click(object sender, RoutedEventArgs e)
        {
            SaveFileDialog dlg = new SaveFileDialog()
            {
                Filter = "Robot Block Files | *.blocks"
            };
            if (dlg.ShowDialog(this) ?? false)
            {
                string jsResults;
                using (var context = new AutoJSContext(_browser.Window.JSContext))
                using (new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
                {
                    context.EvaluateScript("(Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace)))", out jsResults);                    
                }
                using (var stream = dlg.OpenFile())
                using (var sw = new StreamWriter(stream))
                {
                    sw.Write(jsResults);
                }

            }

        }

        void Load_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog dlg = new OpenFileDialog()
            {
                Filter = "Robot Block Files | *.blocks"
            };

            if (dlg.ShowDialog(this) ?? false)
            {
                string tempPath = IOPath.Combine(IOPath.GetTempPath(), IOPath.GetRandomFileName());
                Directory.CreateDirectory(tempPath);
                string tempLoadingFile = IOPath.Combine(tempPath, "temp_blocks.xml");
                File.Copy(dlg.FileName, tempLoadingFile, true);
                _tempPathsCreated.Add(tempPath);
                string fileUri = "file://" + new FileInfo(tempLoadingFile).FullName;

                using (var context = new AutoJSContext(_browser.Window.JSContext))
                using (var compartment = new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
                {
                    string output;
                    context.EvaluateScript("load_by_url('" + fileUri.Replace("\\", "/") + "');", out output);
                }

            }

        }

        private void _browser_JavascriptError(object sender, JavascriptErrorEventArgs e)
        {
            Console.WriteLine("{0}, {1}:{2}", e.Message, e.Filename, e.Line);

        }

        void NotifyWebAppisHosted(string webAppVersionString)
        {
            WebAppVersion = webAppVersionString;
            string jsResults;
            using (var context = new AutoJSContext(_browser.Window.JSContext))
            using (new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
            {
                context.EvaluateScript("hostedAppSetup();", out jsResults);
            }

            //This loads the last saved program. We know at this point that everything should be working in Blockly.
            if (!string.IsNullOrWhiteSpace(Settings.Default.SavedProgram))
            {
                string tempPath = IOPath.Combine(IOPath.GetTempPath(), IOPath.GetRandomFileName());
                Directory.CreateDirectory(tempPath);
                string tempLoadingFile = IOPath.Combine(tempPath, "temp_blocks.xml");
                using (var file = File.OpenWrite(tempLoadingFile))
                using (var sw = new StreamWriter(file))
                {
                    sw.Write(Settings.Default.SavedProgram);
                }
                _tempPathsCreated.Add(tempPath);
                string fileUri = "file://" + new FileInfo(tempLoadingFile).FullName;

                using (var context = new AutoJSContext(_browser.Window.JSContext))
                using (var compartment = new JSAutoCompartment(context, (nsISupports)_browser.Window.DomWindow))
                {
                    string output;
                    context.EvaluateScript("load_by_url('" + fileUri.Replace("\\", "/") + "');", out output);
                }
            }

        }

        IEnumerable<ProgrammerInfo> GetAllProgrammers(string arduinoIDEPath)
        {
            string programmersFile = GetCommonProgrammersTextPath(arduinoIDEPath);

            foreach ( var progInfo in GetProgrammersFromFile(programmersFile) )
            {
                yield return progInfo;
            }

            IEnumerable<string> userProgrammersFiles = GetUserProgrammersFiles();
            
            foreach (var file in userProgrammersFiles)
            {
                foreach ( var progInfo in GetProgrammersFromFile(file))
                {
                    yield return progInfo;
                }
            }
        }


        static List<ProgrammerInfo> GetProgrammersFromFile(string programmersFile)
        {
            List<ProgrammerInfo> retVal = new List<ProgrammerInfo>();
            List<string> lines = new List<string>();
            try
            {
                using (var stream = new FileStream(programmersFile, FileMode.Open, FileAccess.Read))
                using (var sr = new StreamReader(stream))
                {
                    while (!sr.EndOfStream)
                    {
                        lines.Add(sr.ReadLine().Trim());
                    }
                }

                var meaningfulLines = (from l in lines where l.Length > 0 && l[0] != '#' select l);

                var programmerLines = (from l in
                                           meaningfulLines
                                       let index = l.IndexOf('.')
                                       where index > 0
                                       select l.Substring(0, index)).Distinct();

                foreach (string programmerLine in programmerLines)
                {
                    var programmerSettingsLines = from l in meaningfulLines
                                                  let index = l.IndexOf(".")
                                                  where index > 0 && l.StartsWith(programmerLine)
                                                  select l;

                    bool usesSerial = programmerSettingsLines.Any(s => s.Contains("serial.port"));
                    ProgrammerInfo info = new ProgrammerInfo() { Name = programmerLine, UsesSerial = usesSerial };
                    retVal.Add(new ProgrammerInfo() { Name = programmerLine, UsesSerial = usesSerial });
                }

            }
            catch (Exception e)
            {
                Trace.WriteLine("Crash! " + e.ToString());
            }
            return retVal;
        }


        string GetCommonProgrammersTextPath(string arduinoExePath)
        {
            if (!string.IsNullOrWhiteSpace(arduinoExePath))
            {
                string arduinoPath = IOPath.GetDirectoryName(arduinoExePath);

                string programmersPath = IOPath.Combine(arduinoPath, "hardware//arduino//avr//programmers.txt");

                if (new FileInfo(programmersPath).Exists)
                {
                    return programmersPath;
                }

                programmersPath = IOPath.Combine(arduinoPath, "hardware//arduino//programmers.txt");

                if (new FileInfo(programmersPath).Exists)
                {
                    return programmersPath;
                }

            }

            return null;

        }


        IEnumerable<string> GetUserProgrammersFiles()
        {
            string sketchbookLocation = GetUserSketchbookLocation();
            if (!string.IsNullOrWhiteSpace(sketchbookLocation))
            {
                var hardwareLocaiton = IOPath.Combine(sketchbookLocation, "hardware");
                DirectoryInfo di = new DirectoryInfo(sketchbookLocation);


                foreach (var name in di.EnumerateFiles("programmers.txt", SearchOption.AllDirectories).Select(f => f.FullName))
                {
                    yield return name;
                }

            }

        }


        string GetBoardQualifiedName(string arduinoIDEPath, string boardName)
        {
            var boardPath = FindBoardFilePath(arduinoIDEPath, boardName);

            if (!string.IsNullOrWhiteSpace(boardPath))
            {
                var pathInfo = new FileInfo(boardPath);
                string archName = pathInfo.Directory.Name;
                string packageName = pathInfo.Directory.Parent.Name;
                return string.Format("{0}:{1}:{2}", packageName, archName, boardName);
            }
            return boardName;
        }

        /// <summary>
        /// This hunts for the "boards.txt" file containing the particular board definition
        /// </summary>
        /// <param name="arduinoIDEPath"></param>
        /// <returns></returns>
        string FindBoardFilePath(string arduinoIDEPath, string boardName)
        {
            if (!string.IsNullOrWhiteSpace(arduinoIDEPath))
            {
                string arduinoPath = IOPath.GetDirectoryName(arduinoIDEPath);

                string boardsPath = IOPath.Combine(arduinoPath, "hardware\\arduino\\avr\\boards.txt");

                if (ContainsBoardDefinition(boardsPath, boardName))
                {
                    return boardsPath;
                }

            }

            var sketchbookLocation = GetUserSketchbookLocation();
            if (!string.IsNullOrWhiteSpace(sketchbookLocation))
            {
                var hardwareLocaiton = IOPath.Combine(sketchbookLocation, "hardware");
                DirectoryInfo di = new DirectoryInfo(sketchbookLocation);


                foreach (var name in di.EnumerateFiles("boards.txt", SearchOption.AllDirectories).Select(f => f.FullName))
                {
                    if (ContainsBoardDefinition(name, boardName))
                    {
                        return name;
                    }
                }

            }
            return null;

        }

        static bool ContainsBoardDefinition(string boardsFile, string boardname)
        {
            if (new FileInfo(boardsFile).Exists)
            {
                var lines = new List<string>();
                using (var stream = new FileStream(boardsFile, FileMode.Open, FileAccess.Read))
                using (var sr = new StreamReader(stream))
                {
                    while (!sr.EndOfStream)
                    {
                        lines.Add(sr.ReadLine().Trim());
                    }
                }
                var meaningfulLines = (from l in lines where l.Length > 0 && l[0] != '#' select l);

                var boardLines = (from l in
                                           meaningfulLines
                                       let index = l.IndexOf('.')
                                       where index > 0
                                       select l.Substring(0, index)).Distinct();

                if (boardLines.Contains(boardname))
                {
                    return true;
                }

            }
            return false;
        }

        static string GetUserSketchbookLocation()
        {
            var roamingAppDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            //TODO, maybe find a better way? 
            var arduinoDataPath = IOPath.Combine(roamingAppDataPath, "Arduino15\\preferences.txt");
            if (File.Exists(arduinoDataPath))
            {
                var lines = File.ReadAllLines(arduinoDataPath);
                var sketchbookLocaitonLine = lines.First(s => s.StartsWith("sketchbook.path"));
                if (sketchbookLocaitonLine != null)
                {
                    var sketchbookLocation = sketchbookLocaitonLine.Substring(sketchbookLocaitonLine.IndexOf('=') + 1);
                    return sketchbookLocation;
                }
            }

            return "";

        }

        void CheckForUpdates()
        {
            var now = DateTime.Now;
            if (Settings.Default.LastUpdateNotice == null || (now - Settings.Default.LastUpdateNotice).Duration().TotalHours >= 1.0)
            { 
                Task.Run(() => 
                {
                    try
                    {
                        XmlDocument config = new XmlDocument();
                        config.Load("https://anibit.com/webtools/3pi/winversion.xml");
                        var node = config.SelectSingleNode("/dist_config/latest_info/edition[@name = 'b3pi']");
                        if (node != null)
                        {
                            var versionNode = node.SelectSingleNode("version");
                            if (versionNode != null)
                            {
                                string nodeText = versionNode.InnerText;
                                Version ver = Version.Parse(nodeText);
                                string dlUrl = node.SelectSingleNode("download_page").Attributes["url"].Value;
                                if (ver > Assembly.GetExecutingAssembly().GetName().Version)
                                {
                                    Dispatcher.InvokeAsync(() =>
                                    {
                                        _updateDownloadUrl = dlUrl;
                                        UpdateButton.Content = "Update!";
                                        UpdateButton.ToolTip = "New Version " + ver + " available!";
                                        UpdateButton.Visibility = System.Windows.Visibility.Visible;
                                        Settings.Default.LastUpdateNotice = now;
                                    });
                                }
                            }
                        }
                    }
                    catch (Exception)
                    {
                        //TODO issue some sort of alert or debug warning.
                    }

                });
                

            }
            
        }
            
    }

}

