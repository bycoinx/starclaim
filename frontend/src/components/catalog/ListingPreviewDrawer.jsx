import React from "react";
import { Drawer, DrawerContent } from "../ui/drawer";
import { useCatalogStore } from "../../lib/CatalogStore";
import DetailDrawer from "./DetailDrawer";

export default function ListingPreviewDrawer() {
  const store = useCatalogStore();
  const open = Boolean(store.selectedStarId);

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) store.setSelectedStarId(null); }}>
      <DrawerContent>
        <div className="w-full">
          <DetailDrawer selectedStarId={store.selectedStarId} onClose={() => store.setSelectedStarId(null)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
