#import <Foundation/Foundation.h>

@interface WhisperEngine : NSObject
  - (NSString *)ping;
  //- (instancetype)initWithModelPath:(NSString *)modelPath;
  - (nullable instancetype)initWithModelPath:(NSString *)modelPath;
@end 