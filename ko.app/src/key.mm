//
// based on code from https://github.com/cocoabits/MASShortcut
// 

#import "key.h"

//  0000000  000   000   0000000   00000000   000000000   0000000  000   000  000000000  
// 000       000   000  000   000  000   000     000     000       000   000     000     
// 0000000   000000000  000   000  0000000       000     000       000   000     000     
//      000  000   000  000   000  000   000     000     000       000   000     000     
// 0000000   000   000   0000000   000   000     000      0000000   0000000      000     

@implementation Shortcut

- (id)initWithKeyCode:(NSInteger)code modifierFlags:(NSEventModifierFlags)flags
{
    self = [super init];
    if (self)
    {
        _keyCode = code;
        _modifierFlags = flags & (NSEventModifierFlagControl | NSEventModifierFlagShift | NSEventModifierFlagOption | NSEventModifierFlagCommand);
    }
    return self;
}

+ (id)shortcutWithKeyCode:(NSInteger)code modifierFlags:(NSEventModifierFlags)flags
{
    return [[self alloc] initWithKeyCode:code modifierFlags:flags];
}

+ (id)shortcutWithEvent:(NSEvent*)event
{
    return [[self alloc] initWithKeyCode:event.keyCode modifierFlags:event.modifierFlags];
}

- (UInt32)carbonKeyCode
{
    return (self.keyCode == NSNotFound ? 0 : (UInt32)self.keyCode);
}

- (UInt32)carbonFlags
{
    return CarbonModifiersFromCocoaModifiers(self.modifierFlags);
}

- (id)copyWithZone:(NSZone*)zone
{
    return [[self class] shortcutWithKeyCode:_keyCode modifierFlags:_modifierFlags];
}

@end

// 000   000   0000000   000000000  000   000  00000000  000   000  
// 000   000  000   000     000     000  000   000        000 000   
// 000000000  000   000     000     0000000    0000000     00000    
// 000   000  000   000     000     000  000   000          000     
// 000   000   0000000      000     000   000  00000000     000     

@interface HotKey ()
@property(assign) EventHotKeyRef hotKeyRef;
@property(assign) UInt32 carbonID;
@end

@implementation HotKey

- (id) initWithShortcut:(Shortcut*)shortcut
{
    self = [super init];

    static UInt32 CarbonHotKeyID = 0;

    _carbonID = ++CarbonHotKeyID;
    EventHotKeyID hotKeyID = { .signature = 666, .id = _carbonID };

    OSStatus status = RegisterEventHotKey([shortcut carbonKeyCode], [shortcut carbonFlags],
        hotKeyID, GetEventDispatcherTarget(), 0, &_hotKeyRef);

    if (status != noErr) return nil;

    return self;
}

+ (id) registeredHotKeyWithShortcut:(Shortcut*)shortcut
{
    return [[self alloc] initWithShortcut:shortcut];
}

- (void) dealloc
{
    if (_hotKeyRef) 
    {
        UnregisterEventHotKey(_hotKeyRef);
        _hotKeyRef = NULL;
    }
    [super dealloc];
}

@end

// 00     00   0000000   000   000  000  000000000   0000000   00000000   
// 000   000  000   000  0000  000  000     000     000   000  000   000  
// 000000000  000   000  000 0 000  000     000     000   000  0000000    
// 000 0 000  000   000  000  0000  000     000     000   000  000   000  
// 000   000   0000000   000   000  000     000      0000000   000   000  

@interface ShortcutMonitor ()

@property(assign) EventHandlerRef eventHandlerRef;
@property(strong) NSMutableDictionary *hotKeys;

@end

static OSStatus CarbonEventCallback(EventHandlerCallRef, EventRef, void*);

@implementation ShortcutMonitor

- (id) init
{
    self = [super init];
    
    [self setHotKeys:[NSMutableDictionary dictionary]];
    
    EventTypeSpec hotKeyPressedSpec = { .eventClass = kEventClassKeyboard, .eventKind = kEventHotKeyPressed };
    
    OSStatus status = InstallEventHandler(
                            GetEventDispatcherTarget(), 
                            CarbonEventCallback,
                            1, 
                            &hotKeyPressedSpec, 
                            (__bridge void*)self, 
                            &_eventHandlerRef
                        );
        
    if (status != noErr) return nil;
    
    return self;
}

- (void) dealloc
{
    if (_eventHandlerRef) 
    {
        RemoveEventHandler(_eventHandlerRef);
        _eventHandlerRef = NULL;
    }
    [super dealloc];
}

+ (id) sharedMonitor
{
    static ShortcutMonitor *sharedInstance = nil;
    if (!sharedInstance) sharedInstance = [[self alloc] init];
    return sharedInstance;
}

- (BOOL) registerShortcut:(Shortcut*)shortcut withAction:(dispatch_block_t)action
{
    if (HotKey *hotKey = [HotKey registeredHotKeyWithShortcut:shortcut]) 
    {
        [hotKey setAction:action];
        [_hotKeys setObject:hotKey forKey:shortcut];
        return YES;
    } 
    return NO;
}

- (void) handleEvent:(EventRef)event
{
    if (GetEventClass(event) != kEventClassKeyboard) return;

    EventHotKeyID hotKeyID;
    OSStatus status = GetEventParameter(event, kEventParamDirectObject, typeEventHotKeyID, NULL, sizeof(hotKeyID), NULL, &hotKeyID);
    
    if (status != noErr) return;

    [_hotKeys enumerateKeysAndObjectsUsingBlock:^(Shortcut *shortcut, HotKey *hotKey, BOOL *stop) 
    {
        if (hotKeyID.id == [hotKey carbonID]) 
        {
            if ([hotKey action]) 
            {
                dispatch_async(dispatch_get_main_queue(), [hotKey action]);
            }
            *stop = YES;
        }
    }];
}

@end

static OSStatus CarbonEventCallback(EventHandlerCallRef _, EventRef event, void *context)
{
    ShortcutMonitor *dispatcher = (__bridge id)context;
    [dispatcher handleEvent:event];
    return noErr;
}
