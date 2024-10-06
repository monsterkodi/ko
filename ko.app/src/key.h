//
// based on code from https://github.com/cocoabits/MASShortcut
// 
#import <Carbon/Carbon.h>
#import <AppKit/AppKit.h>

NS_INLINE UInt32 CarbonModifiersFromCocoaModifiers(NSUInteger cocoaFlags)
{
    return
          (cocoaFlags & NSEventModifierFlagCommand ? cmdKey : 0)
        | (cocoaFlags & NSEventModifierFlagOption ? optionKey : 0)
        | (cocoaFlags & NSEventModifierFlagControl ? controlKey : 0)
        | (cocoaFlags & NSEventModifierFlagShift ? shiftKey : 0);
}

//  0000000  000   000   0000000   00000000   000000000   0000000  000   000  000000000  
// 000       000   000  000   000  000   000     000     000       000   000     000     
// 0000000   000000000  000   000  0000000       000     000       000   000     000     
//      000  000   000  000   000  000   000     000     000       000   000     000     
// 0000000   000   000   0000000   000   000     000      0000000   0000000      000     

@interface Shortcut : NSObject

@property (nonatomic, readonly) NSInteger keyCode;
@property (nonatomic, readonly) NSEventModifierFlags modifierFlags;
@property (nonatomic, readonly) UInt32 carbonKeyCode;
@property (nonatomic, readonly) UInt32 carbonFlags;

- (id) initWithKeyCode:(NSInteger)code modifierFlags:(NSEventModifierFlags)flags;
+ (id) shortcutWithKeyCode:(NSInteger)code modifierFlags:(NSEventModifierFlags)flags;
+ (id) shortcutWithEvent:(nonnull NSEvent *)anEvent;

@end

// 000   000   0000000   000000000  000   000  00000000  000   000  
// 000   000  000   000     000     000  000   000        000 000   
// 000000000  000   000     000     0000000    0000000     00000    
// 000   000  000   000     000     000  000   000          000     
// 000   000   0000000      000     000   000  00000000     000     

@interface HotKey : NSObject

@property(readonly) UInt32 carbonID;
@property(copy) dispatch_block_t action;

+ (id) registeredHotKeyWithShortcut: (Shortcut*) shortcut;

@end

// 00     00   0000000   000   000  000  000000000   0000000   00000000   
// 000   000  000   000  0000  000  000     000     000   000  000   000  
// 000000000  000   000  000 0 000  000     000     000   000  0000000    
// 000 0 000  000   000  000  0000  000     000     000   000  000   000  
// 000   000   0000000   000   000  000     000      0000000   000   000  

@interface ShortcutMonitor : NSObject

+ (id) sharedMonitor;

- (BOOL) registerShortcut: (Shortcut*) shortcut withAction: (dispatch_block_t) action;

@end

