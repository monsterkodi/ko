// 000   000  000000000  000  000        
// 000   000     000     000  000        
// 000   000     000     000  000        
// 000   000     000     000  000        
//  0000000      000     000  0000000    

#import "util.h"

NSDictionary* dictForRect(NSRect rect)
{
    id dict = [NSMutableDictionary dictionary];
    [dict setObject:[NSNumber numberWithFloat:rect.origin.x]    forKey:@"x"];
    [dict setObject:[NSNumber numberWithFloat:rect.origin.y]    forKey:@"y"];
    [dict setObject:[NSNumber numberWithFloat:rect.size.width]  forKey:@"w"];
    [dict setObject:[NSNumber numberWithFloat:rect.size.height] forKey:@"h"];
    return dict;
}

NSRect rectForDict(NSDictionary* dict)
{
    return CGRectMake( [[dict objectForKey:@"x"] floatValue], 
                       [[dict objectForKey:@"y"] floatValue], 
                       [[dict objectForKey:@"w"] floatValue], 
                       [[dict objectForKey:@"h"] floatValue]);
}

NSDictionary* dictForSize(NSSize size)
{
    id dict = [NSMutableDictionary dictionary];
    [dict setObject:[NSNumber numberWithFloat:size.width]  forKey:@"w"];
    [dict setObject:[NSNumber numberWithFloat:size.height] forKey:@"h"];
    return dict;
}


NSDictionary* dictForPoint(NSPoint point)
{
    id dict = [NSMutableDictionary dictionary];
    [dict setObject:[NSNumber numberWithFloat:point.x]  forKey:@"x"];
    [dict setObject:[NSNumber numberWithFloat:point.y] forKey:@"y"];
    return dict;
}

NSString* typeForNSFileType(NSString* fileType)
{
    if ([fileType isEqualToString:NSFileTypeDirectory])
    {
        return @"dir";
    }
    else
    {
        return @"file";
    }
}

NSString* cornerForRectAndPoint(NSRect rect, NSPoint point)
{
    BOOL left   = point.x < rect.origin.x + rect.size.width *1/6;
    BOOL right  = point.x > rect.origin.x + rect.size.width *5/6;
    BOOL center = !left && !right;
    
    BOOL bot    = point.y < rect.origin.y + rect.size.height *1/6;
    BOOL top    = point.y > rect.origin.y + rect.size.height *5/6;
    BOOL mid    = !top && !bot;
    
    NSString* horz = left ? @"left" : right ? @"right" : @"center";
    NSString* vert = top  ? @"top"  : bot   ? @"bot"   : @"mid";
    
    return [NSString stringWithFormat:@"%@-%@", vert, horz];
}