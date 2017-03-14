
import Cocoa
import Foundation
import os.log

var type = "default"
var syst = "oslog"
var mssg = ""
var catg = ""

while case let option = getopt(CommandLine.argc, CommandLine.unsafeArgv, "hs:c:t:m:"), option != -1 {
    switch UnicodeScalar(CUnsignedChar(option)) {
    case "t": type = String(cString: optarg)
    case "c": catg = String(cString: optarg)
    case "s": syst = String(cString: optarg)
    case "m": mssg = String(cString: optarg)
    case "h": print("usage: oslog [-s system] [-c category] [-t (fault|error|default|info|debug)] -m message"); exit(0);
    default:  fatalError("unknown option")
    }
}

var logType = OSLogType.default
switch type {
case "fault": logType = OSLogType.fault
case "error": logType = OSLogType.error
case "debug": logType = OSLogType.debug
case "info":  logType = OSLogType.info
default:      logType = OSLogType.default
}

//os_log("%{public}@", log: OSLog(subsystem: syst, category: catg), type: logType, mssg)

log_public(OSLog(subsystem: syst, category: catg), logType, mssg)
