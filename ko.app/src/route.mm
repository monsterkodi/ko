/*
  00000000    0000000   000   000  000000000  00000000
  000   000  000   000  000   000     000     000     
  0000000    000   000  000   000     000     0000000 
  000   000  000   000  000   000     000     000     
  000   000   0000000    0000000      000     00000000
*/

#import "fs.h"
#import "js.h"
#import "app.h"
#import "route.h"
#import "bundle.h"

@implementation Route

// 00000000   00000000   0000000   000   000  00000000   0000000  000000000  
// 000   000  000       000   000  000   000  000       000          000     
// 0000000    0000000   000 00 00  000   000  0000000   0000000      000     
// 000   000  000       000 0000   000   000  000            000     000     
// 000   000  00000000   00000 00   0000000   00000000  0000000      000     

+ (void) request:(WKScriptMessage*)msg callback:(Callback)callback win:(Win*)win
{
    // NSLog(@"%@ %@", msg.name, msg.body);
    
    id reply = @"???";
    
    NSString* route = [msg.body valueForKey:@"route"];
    NSArray*  args  = [msg.body valueForKey:@"args"];

         // if ([route isEqualToString:@"log"    ]) { NSLog(@"%ld %@ %@", (long)win.windowNumber, msg.name, msg.body); }
         if ([route isEqualToString:@"log"    ]) { NSLog(@"%@", [args componentsJoinedByString:@" "]); }
    else if ([route isEqualToString:@"now"    ]) { reply = [NSNumber numberWithDouble:CFAbsoluteTimeGetCurrent()]; }
    else if ([route isEqualToString:@"open"   ]) { reply = [Route open:[args objectAtIndex:0]]; }
    else if ([route isEqualToString:@"finder" ]) { reply = [Route finder:[args objectAtIndex:0]]; }
    else if ([route hasPrefix:@"bundle."      ]) { reply = [Route bundle:     [route substringFromIndex:7]    args:args win:win]; }
    else if ([route hasPrefix:@"window."      ]) { reply = [Route window:     [route substringFromIndex:7]    args:args win:win]; }
    // else if ([route hasPrefix:@"win."         ]) { reply = [Route window:     [route substringFromIndex:4]    args:args win:win]; }
    else if ([route hasPrefix:@"clipboard."   ]) { reply = [Route clipboard:  [route substringFromIndex:10]   args:args win:win]; }
    else if ([route hasPrefix:@"app."         ]) {         [Route app:        [route substringFromIndex:4]    args:args win:win callback:callback]; return; }
    else if ([route hasPrefix:@"status."      ]) { reply = [Route status:     [route substringFromIndex:7]    args:args win:win]; }
    else if ([route hasPrefix:@"fs."          ]) { reply = [FS    fs:         [route substringFromIndex:3]    args:args win:win]; }
    else if ([route hasPrefix:@"js."          ]) { reply = [JS    js:         [route substringFromIndex:3]    args:args        ]; }
    else if ([route hasPrefix:@"test."        ]) { reply = [Route test:       [route substringFromIndex:5]    args:args        ]; }
    else NSLog(@"unknown request %@ %@", msg.name, msg.body);
    
    if (callback) callback(reply, nil);
}

// 00000000  000  000   000  0000000    00000000  00000000   
// 000       000  0000  000  000   000  000       000   000  
// 000000    000  000 0 000  000   000  0000000   0000000    
// 000       000  000  0000  000   000  000       000   000  
// 000       000  000   000  0000000    00000000  000   000  

+ (id) finder:(id)args
{
    if ([args isKindOfClass:[NSArray class]])
    {
        if ([args count] == 1)
        {
            NSString* path = [args objectAtIndex:0];
            [[NSWorkspace sharedWorkspace] selectFile:path inFileViewerRootedAtPath:[path stringByDeletingLastPathComponent]];
        }
        else if ([args count] > 1)
        {
            NSMutableArray* urls = [NSMutableArray array];
            for (NSString* arg in args)
            {
                [urls addObject:[NSURL fileURLWithPath:arg]];
            }
            [[NSWorkspace sharedWorkspace] activateFileViewerSelectingURLs:urls];
        }
    }
    else if ([args isKindOfClass:[NSString class]])
    {
        [[NSWorkspace sharedWorkspace] selectFile:args inFileViewerRootedAtPath:[args stringByDeletingLastPathComponent]];
    }
    return nil;
}

//  0000000   00000000   00000000  000   000  
// 000   000  000   000  000       0000  000  
// 000   000  00000000   0000000   000 0 000  
// 000   000  000        000       000  0000  
//  0000000   000        00000000  000   000  

+ (id) open:(id)args
{
    if ([args isKindOfClass:[NSString class]])
    {
        NSURL* url; 
        
        if ([args hasPrefix:@"/"])
        {
            url = [NSURL fileURLWithPath:args];
        }
        else
        {
            url = [NSURL URLWithString:args];
        }
        NSWorkspaceOpenConfiguration* configuration = [NSWorkspaceOpenConfiguration configuration];
        [[NSWorkspace sharedWorkspace] openURL:url configuration:configuration completionHandler:^(NSRunningApplication *app, NSError *error) {}];
    }
    else if ([args isKindOfClass:[NSArray class]])
    {
        for (NSString* item in args)
        {
            [Route open:item];
        }
    }
    return nil;
}

// 000   000  000  000   000  0000000     0000000   000   000  
// 000 0 000  000  0000  000  000   000  000   000  000 0 000  
// 000000000  000  000 0 000  000   000  000   000  000000000  
// 000   000  000  000  0000  000   000  000   000  000   000  
// 00     00  000  000   000  0000000     0000000   00     00  

+ (id) window:(NSString*)req args:(NSArray*)args win:(Win*)win
{    
    id arg0 = nil;
    id arg1 = nil;
    if (args && [args count] > 0) arg0 = [args objectAtIndex:0];    
    if (args && [args count] > 1) arg1 = [args objectAtIndex:1];    
    
    //NSLog(@"%d ▸ %@ %@", win.windowNumber, req, arg0 ? arg0 : @"");

    if ([req isEqualToString:@"focusNext"     ]) { return [win focusNext]; }
    if ([req isEqualToString:@"focusPrev"     ]) { return [win focusPrev]; }
    if ([req isEqualToString:@"focus"         ]) { return [win focus];     }
    if ([req isEqualToString:@"frame"         ]) { return [win frameInfo]; }
    if ([req isEqualToString:@"frameInfo"     ]) { return [win frameInfo]; }
    if ([req isEqualToString:@"new"           ]) { return [NSNumber numberWithLong:[win new:arg0 script:arg1].windowNumber]; }
    if ([req isEqualToString:@"snapshot"      ]) { return [win snapshot:arg0]; }
    if ([req isEqualToString:@"close"         ]) { [win performClose:nil]; return nil; }
    if ([req isEqualToString:@"reload"        ]) { [win reload];           return nil; }
    if ([req isEqualToString:@"raise"         ]) { [[NSApplication sharedApplication] activate]; [win orderFrontRegardless]; [win makeKeyAndOrderFront:nil]; return nil; }
    if ([req isEqualToString:@"maximize"      ]) { [win zoom:nil];         return nil; }
    if ([req isEqualToString:@"minimize"      ]) { [win miniaturize:nil];  return nil; }
    if ([req isEqualToString:@"center"        ]) { [win center];           return nil; }
    if ([req isEqualToString:@"moveBy"        ]) { [win moveBy:arg0];      return nil; }
    if ([req isEqualToString:@"setTopLeft"    ]) { [win setTopLeft:arg0];  return nil; }
    if ([req isEqualToString:@"setFrame"      ]) { [win setFrame:arg0 immediate:arg1];    return nil; }
    if ([req isEqualToString:@"setAspectRatio"]) { [win setAspectRatio:NSMakeSize([arg0 longValue],[arg1 longValue])];  return nil; }
    if ([req isEqualToString:@"setSize"       ]) { [win setWidth:[arg0 longValue] height:[arg1 longValue]];  return nil; }
    if ([req isEqualToString:@"setMinSize"    ]) { [win setContentMinSize:CGSizeMake([arg0 longValue], [arg1 longValue])]; return nil; }
    if ([req isEqualToString:@"setMaxSize"    ]) { [win setContentMaxSize:CGSizeMake([arg0 longValue], [arg1 longValue])]; return nil; }
    if ([req isEqualToString:@"id"            ]) { return [NSNumber numberWithLong:win.windowNumber]; }
    if ([req isEqualToString:@"framerateDrop" ]) { [win framerateDrop:[arg0 longValue]]; return nil; }
    if ([req isEqualToString:@"toggleInspector" ]) { [win.view toggleInspector]; return nil; }
    if ([req isEqualToString:@"fullscreen"    ]) { [win toggleFullScreen:nil]; return nil; }
    if ([req isEqualToString:@"post" ]) 
    { 
        id payload = [NSString stringWithFormat:@"\"%@\"", [args objectAtIndex:0]];
        id eventArgs = [args objectAtIndex:1];
        if (eventArgs && [eventArgs isKindOfClass:[NSArray class]] && [eventArgs count])
        {
            for (id arg in eventArgs)
            {
                if ([arg isKindOfClass:[NSString class]])
                {
                    payload = [payload stringByAppendingString:[NSString stringWithFormat:@", \"%@\"", arg]];
                }
                else if ([arg isKindOfClass:[NSNumber class]])
                {
                    payload = [payload stringByAppendingString:[NSString stringWithFormat:@", %@", arg]];
                }
                else
                {
                    //NSLog(@"serialize to json %@ %@", arg, args);                    
                    NSData*  jsonData = [NSJSONSerialization dataWithJSONObject:arg options:NSJSONWritingPrettyPrinted error:nil];    
                    NSString* jsonStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                    payload = [payload stringByAppendingString:[NSString stringWithFormat:@", %@", jsonStr]];
                }
            }
        }
                
        id script = [NSString stringWithFormat:@"kakao.post.emit(%@);", payload];
        
        for (Win* w in [App wins])
        {
            if (w == win) continue;
                        
            // NSLog(@"run script in win %lu\n%@", (long)w.windowNumber, script);
            [w.view evaluateJavaScript:script completionHandler:nil];
        }
        
        return nil; 
    }
    
    return nil;
}

//  0000000  000000000   0000000   000000000  000   000   0000000  
// 000          000     000   000     000     000   000  000       
// 0000000      000     000000000     000     000   000  0000000   
//      000     000     000   000     000     000   000       000  
// 0000000      000     000   000     000      0000000   0000000   

+ (id) status:(NSString*)req args:(NSArray*)args win:(Win*)win
{
    if ([req isEqualToString:@"icon"])
    {
        [[[App get] status] snapshot:win.view rect:[args objectAtIndex:0]];
    }

    return nil;
}

//  0000000  000      000  00000000   0000000     0000000    0000000   00000000   0000000    
// 000       000      000  000   000  000   000  000   000  000   000  000   000  000   000  
// 000       000      000  00000000   0000000    000   000  000000000  0000000    000   000  
// 000       000      000  000        000   000  000   000  000   000  000   000  000   000  
//  0000000  0000000  000  000        0000000     0000000   000   000  000   000  0000000    

+ (id) clipboard:(NSString*)req args:(NSArray*)args win:(Win*)win
{
    id pb = [NSPasteboard generalPasteboard];
    if ([req isEqualToString:@"get"] || [req isEqualToString:@"read"]) { return [pb stringForType:NSPasteboardTypeString]; }
    if ([req isEqualToString:@"set"] || [req isEqualToString:@"write"]) 
    { 
        [pb declareTypes:[NSArray arrayWithObjects:NSPasteboardTypeString, nil] owner:nil]; // wtf?
        if ([pb setString:[args objectAtIndex:0] forType:NSPasteboardTypeString]) 
        {
            return [args objectAtIndex:0];
        } 
    }
    return nil;
}

// 0000000    000   000  000   000  0000000    000      00000000  
// 000   000  000   000  0000  000  000   000  000      000       
// 0000000    000   000  000 0 000  000   000  000      0000000   
// 000   000  000   000  000  0000  000   000  000      000       
// 0000000     0000000   000   000  0000000    0000000  00000000  

+ (id) bundle:(NSString*)req args:(NSArray*)args win:(Win*)win
{
    return [Bundle performSelector:sel_getUid([req cStringUsingEncoding:NSUTF8StringEncoding])];
}

//  0000000   00000000   00000000   
// 000   000  000   000  000   000  
// 000000000  00000000   00000000   
// 000   000  000        000        
// 000   000  000        000        

+ (id) app:(NSString*)req args:(NSArray*)args win:(Win*)win callback:(Callback)callback
{
    // NSLog(@"%d ▸ %@", (long)win.windowNumber, req);
    id app = [NSApplication sharedApplication];
    if ([req isEqualToString:@"quit"])
    {
        [[App get] quit];
    }
    else if ([req isEqualToString:@"sh"])
    {
        [[App get] executeShellScript:args callback:callback];
    }
    return nil;
}

// 000000000  00000000   0000000  000000000  
//    000     000       000          000     
//    000     0000000   0000000      000     
//    000     000            000     000     
//    000     00000000  0000000      000     

+ (id) test:(NSString*)req args:(NSArray*)args
{
    if ([req isEqualToString:@"ping"])
    {
        return [NSString stringWithFormat:@"you say %@ you get pong!", [args objectAtIndex:0]];
    }
    if ([req isEqualToString:@"struct"])
    {
        id dict = [NSMutableDictionary dictionary];
        [dict setObject:[NSString stringWithFormat:@"you sent %@", [args objectAtIndex:0]] forKey:@"input"];
        [dict setObject:@"you get this!" forKey:@"output"];
        return dict;
    }
    return nil;
}

// 00     00  00000000   0000000   0000000   0000000    0000000   00000000  
// 000   000  000       000       000       000   000  000        000       
// 000000000  0000000   0000000   0000000   000000000  000  0000  0000000   
// 000 0 000  000            000       000  000   000  000   000  000       
// 000   000  00000000  0000000   0000000   000   000   0000000   00000000  

+ (void) message:(WKScriptMessage*)msg win:(Win*)win
{     
    [self request:msg callback:nil win:win];
}

// 00000000  00     00  000  000000000  
// 000       000   000  000     000     
// 0000000   000000000  000     000     
// 000       000 0 000  000     000     
// 00000000  000   000  000     000     

+ (void) emit:(id)msg
{
    for (Win* win in [App wins])
    {
        [self send:msg win:win];
    }
}

+ (void) emit:(NSString*)name arg:(id)arg
{
    [Route emit:name args:[NSArray arrayWithObject:arg]];
}

+ (void) emit:(NSString*)name args:(NSArray*)args
{
    NSMutableDictionary* msg = [NSMutableDictionary dictionary];
    [msg setObject:name forKey:@"name"];
    [msg setObject:args forKey:@"args"];
    [Route emit:msg];
}

//  0000000  00000000  000   000  0000000    
// 000       000       0000  000  000   000  
// 0000000   0000000   000 0 000  000   000  
//      000  000       000  0000  000   000  
// 0000000   00000000  000   000  0000000    

+ (void) send:(id)msg win:(Win*)win
{
    NSString* payload;
    
    if ([msg isKindOfClass:[NSString class]])
    {
        payload = [NSString stringWithFormat:@"\"%@\"", msg];
    }
    else
    {
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:msg options:NSJSONWritingPrettyPrinted error:nil];
        payload = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    }
    
    id script = [NSString stringWithFormat:@"window.kakao.receive(%@)", payload];
    // NSLog(@"▸ %@", script);

    [win.view evaluateJavaScript:script completionHandler:nil];
}

+ (void) send:(NSString*)name arg:(id)arg win:(Win*)win
{
    [Route send:name args:[NSArray arrayWithObject:arg] win:win];
}

+ (void) send:(NSString*)name args:(NSArray*)args win:(Win*)win
{
    NSMutableDictionary* msg = [NSMutableDictionary dictionary];
    [msg setObject:name forKey:@"name"];
    [msg setObject:args forKey:@"args"];
    [Route send:msg win:win];
}

@end