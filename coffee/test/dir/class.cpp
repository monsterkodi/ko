#include "GridGrid.h"
#include "GridItem.h"
#include "GridVoxel.h"
#include "Tools.h"

AGridGrid::AGridGrid()
{
	PrimaryActorTick.bCanEverTick = false;
}

void AGridGrid::BeginPlay()
{
	Super::BeginPlay();
}

UGridItem * AGridGrid::AddGridItem(AActor * actor)
{
	FIntVector pos;
	UGridItem * gridItem = NewObject<UGridItem>(this);
	gridItem->Actor = actor;
	gridItem->SetLocation(actor->GetActorLocation());
	GridItems.Add(gridItem->Pos, gridItem);
	return gridItem;
}

AActor * AGridGrid::ActorAtVoxel(AGridVoxel * voxel, const FVector & normal)
{
	return ActorAtPos(PosForLocation(voxel->GetActorLocation() + normal * 100));
}

AActor * AGridGrid::ActorAtPos(const FIntVector & pos)
{
	if (GridItems.Contains(pos))
    {
    	return GridItems[pos]->Actor;
    }
     return nullptr;
}