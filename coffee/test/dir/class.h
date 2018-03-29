#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "GridGrid.generated.h"

class UGridItem;
class AGridVoxel;

UCLASS()
class RTS_API AGridGrid : public AActor
{
	GENERATED_BODY()
	
public:	

	AGridGrid();

	virtual void BeginPlay() override;

	UPROPERTY(BlueprintReadOnly)
	TMap<FIntVector, UGridItem*> GridItems;

	UFUNCTION(BlueprintCallable)
	UGridItem * AddGridItem(AActor * actor);

	UFUNCTION(BlueprintCallable)
    void DelGridItem(AActor * actor) { /**/ }

    UFUNCTION(BlueprintCallable) AActor * ActorAtVoxel(AGridVoxel * voxel, const FVector & normal);

    UFUNCTION(BlueprintCallable) const TMap<FIntVector, UGridItem*> & ActorAtPos(const FIntVector & pos);
};
