// 000   000  000000000  000  000        
// 000   000     000     000  000        
// 000   000     000     000  000        
// 000   000     000     000  000        
//  0000000      000     000  0000000    

#import <Cocoa/Cocoa.h>

NSDictionary* dictForRect(NSRect rect);
NSDictionary* dictForSize(NSSize size);
NSDictionary* dictForPoint(NSPoint point);
NSRect rectForDict(NSDictionary* dict);
NSString* typeForNSFileType(NSString* fileType);
NSString* cornerForRectAndPoint(NSRect rect, NSPoint point);