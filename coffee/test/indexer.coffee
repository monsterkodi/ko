
# 000  000   000  0000000    00000000  000   000  00000000  00000000 
# 000  0000  000  000   000  000        000 000   000       000   000
# 000  000 0 000  000   000  0000000     00000    0000000   0000000  
# 000  000  0000  000   000  000        000 000   000       000   000
# 000  000   000  0000000    00000000  000   000  00000000  000   000

{ slash, log, fs, _ } = require 'kxk'

{ expect, should } = require 'chai'

assert  = require 'assert'
Indexer = require '../main/indexer'
IndexHpp = require '../main/indexhpp'

should()

# sleep = (ms) -> Atomics.wait new Int32Array(new SharedArrayBuffer 4), 0, 0, ms

describe 'indexer', ->

    it 'classNameInLine', ->
        
        expect(Indexer.classNameInLine('class MyClass')).to.eql 'MyClass'
        expect(Indexer.classNameInLine('class CoffeeSimple')).to.eql 'CoffeeSimple'
        expect(Indexer.classNameInLine('class CoffeeClass extends CoffeeBase')).to.eql 'CoffeeClass'
        expect(Indexer.classNameInLine('class USimple : public UObject')).to.eql 'USimple'
        expect(Indexer.classNameInLine('class SOME_API USomeObject : public UObject')).to.eql 'USomeObject'
        expect(Indexer.classNameInLine('struct SOME_API FSomeStruct : public FSomeBase')).to.eql 'FSomeStruct'
        
    it 'methodNameInLine', -> 
        
        expect(Indexer.methodNameInLine('   coffeeMethod: ->')).to.eql 'coffeeMethod'
        expect(Indexer.methodNameInLine('   coffeeMeth_2: () ->')).to.eql 'coffeeMeth_2'
        expect(Indexer.methodNameInLine('   coffeeMeth_3 : (a,b)  => ')).to.eql 'coffeeMeth_3'
        
    it 'cppMethodNameInLine', -> 
        
        expect(Indexer.cppMethodNameInLine('    ACameraPawn();'))
        .to.eql 'ACameraPawn'
        
        expect(Indexer.cppMethodNameInLine('   virtual void DisplayDebug(class UCanvas* Canvas, const class FDebugDisplayInfo& DebugDisplay, float& YL, float& YPos) override;'))
        .to.eql 'DisplayDebug'

    it 'hppMethodNameInLine', -> 
        
        expect(Indexer.hppMethodNameInLine '    void AMeth();')
        .to.eql 'AMeth'
        expect(Indexer.hppMethodNameInLine '    int * BMeth();')
        .to.eql 'BMeth'
        expect(Indexer.hppMethodNameInLine '    int & CMeth();')
        .to.eql 'CMeth'
        expect(Indexer.hppMethodNameInLine '    void DMeth(int);')
        .to.eql 'DMeth'
        expect(Indexer.hppMethodNameInLine '    int * EMeth(int * arg /* cmmt */);')
        .to.eql 'EMeth'
        expect(Indexer.hppMethodNameInLine '    void FMeth() {}')
        .to.eql 'FMeth'
        expect(Indexer.hppMethodNameInLine '    int & GMeth() { // cmmt')
        .to.eql 'GMeth'
        expect(Indexer.hppMethodNameInLine '    int & HMeth() override;   ')
        .to.eql 'HMeth'
        expect(Indexer.hppMethodNameInLine '    void IMeth(   ')
        .to.eql 'IMeth'
        expect(Indexer.hppMethodNameInLine '    void JMeth(AActor* Goal, float AcceptanceRadius = -1, bool bStopOnOverlap = true,   ')
        .to.eql 'JMeth'
        expect(Indexer.hppMethodNameInLine '    NamespaceCrap::Type KMeth();')
        .to.eql 'KMeth'
        expect(Indexer.hppMethodNameInLine '    UFUNCTION( BlueprintCallable ) bool LMeth();')
        .to.eql 'LMeth'
        
        expect(Indexer.hppMethodNameInLine '    UGridItem * AddGridItem(AActor * actor);')
        .to.eql 'AddGridItem'
        expect(Indexer.hppMethodNameInLine '    const TMap<FIntVector, UGridItem*> & ActorAtPos(const FIntVector & pos);')
        .to.eql 'ActorAtPos'
        expect(Indexer.hppMethodNameInLine '    virtual void DisplayDebug(class UCanvas* Canvas, const class FDebugDisplayInfo& DebugDisplay, float& YL, float& YPos) override;')
        .to.eql 'DisplayDebug'
        expect(Indexer.hppMethodNameInLine '    EPathFollowingRequestResult::Type MoveToActor(AActor* Goal, float AcceptanceRadius = -1, bool bStopOnOverlap = true,')
        .to.eql 'MoveToActor'
        
        expect(Indexer.hppMethodNameInLine '    ').to.eql undefined
        expect(Indexer.hppMethodNameInLine '    UPROPERTY(BlueprintReadWrite, EditAnywhere)').to.eql undefined
        
    it 'cppFiles', (done) ->
        
        hpp = slash.resolve "#{__dirname}/dir/class.h"
        cpp = slash.resolve "#{__dirname}/dir/class.cpp"
        
        indexer = new Indexer()
        indexer.indexFile hpp, post:false
        indexer.indexFile cpp, post:false
        check = ->
            if _.size(indexer.files) < 2
                setTimeout check, 100
                return
            # log 'files',   indexer.files
            # log 'hpp.funcs', indexer.files[hpp].funcs
            # log indexer.files[cpp].classes
            # log 'funcs',   indexer.funcs
            try
                expect(indexer.files).to.have.property hpp
                expect(indexer.files).to.have.property cpp
                expect(indexer.classes).to.have.property 'AGridGrid'
                expect(indexer.funcs).to.have.property 'AddGridItem'
                expect(indexer.files[cpp]).to.nested.include 'funcs[4].name': 'ActorAtPos'
                expect(indexer.files[hpp]).to.nested.include 'classes[0].name': 'AGridGrid'
                expect(indexer.files[hpp]).to.nested.include 'funcs[5].name': 'ActorAtPos'
                done()
            catch err
                done err
            
        setTimeout check, 100
            # expect(indexer.files).to.include slash.resolve './dir/class.h'
        
    it 'specific files', (done) ->
        # return done()
        indexer = new Indexer()
        files = [
            'C:/Users/kodi/u/rts/UnrealEngine/Engine/Source/Runtime/AIModule/Classes/Actions/PawnAction_Wait.h'
            'C:/Users/kodi/u/rts/UnrealEngine/Engine/Source/Runtime/AIModule/Classes/AIController.h'
        ]
        
        for file in files
            indexer.indexFile file, post:false
            
        check = ->
            if _.size(indexer.files) < files.length
                setTimeout check, 100
                return
            try
                expect(indexer.funcs).to.not.be.empty
                done()
            catch err
                done err
            
        setTimeout check, 100
        
    it 'indexhpp', (done) ->
        return done()
        indexHpp = new IndexHpp
        text = """
        /* class inside comment */
        // this is not an enum nor a struct !!
        classy stuff;
        class forward;
        typedef struct AName {
        } BName;
        class Hello : public World
        {
            Hello() {}
            class Inner {};
        };
        """
        result = indexHpp.parse text
        # log result
        expect(result.classes).to.not.be.empty

    it 'indexhpp files', (done) ->
        # return done()
        indexHpp = new IndexHpp
        files = [
            # 'C:/Users/kodi/u/rts/UnrealEngine/Engine/Source/Runtime/AIModule/Classes/Actions/PawnAction_Wait.h'
            # 'C:/Users/kodi/u/rts/UnrealEngine/Engine/Source/Runtime/AIModule/Classes/AIController.h'
            'C:/Users/kodi/u/rts/UnrealEngine/Engine/Source/Runtime/AIModule/Public/GraphAStar.h'
        ]
        
        for file in files
            text = fs.readFileSync file, 'utf8'
            result = indexHpp.parse text
            log 'classes:'
            for clss in result.classes
                log clss.line, clss.name
            log 'funcs:'
            for func in result.funcs
                log func.line, func.method
            expect(result.classes).to.not.be.empty
            
        done()
            