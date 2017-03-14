
#import <Foundation/Foundation.h>
#import "log_public.h"

void log_public(os_log_t log, os_log_type_t type, NSString * message)
{
    os_log_with_type(log, type, "%{public}s", [message cStringUsingEncoding:NSUTF8StringEncoding]);
}
