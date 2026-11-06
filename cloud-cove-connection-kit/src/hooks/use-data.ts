import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Building, Equipment, Room, ServiceOrder } from "@/lib/os";

export function useData() {
  return useQuery({
    queryKey: ["all-data"],
    queryFn: async () => {
      const [b, r, e, o] = await Promise.all([
        supabase.from("buildings").select("*").order("name"),
        supabase.from("rooms").select("*").order("name"),
        supabase
          .from("equipment")
          .select("*")
          .order("tombamento", { ascending: true, nullsFirst: false }),
        supabase.from("service_orders").select("*").order("created_at", { ascending: false }),
      ]);
      const err = b.error || r.error || e.error || o.error;
      if (err) throw new Error(err.message);
      return {
        buildings: b.data as Building[],
        rooms: r.data as Room[],
        equipment: e.data as Equipment[],
        orders: o.data as ServiceOrder[],
      };
    },
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["all-data"] });
}

export function locate(
  d: { buildings: Building[]; rooms: Room[]; equipment: Equipment[] },
  equipmentId: string,
) {
  const eq = d.equipment.find((x) => x.id === equipmentId);
  const room = d.rooms.find((x) => x.id === eq?.room_id);
  const building = d.buildings.find((x) => x.id === room?.building_id);
  return { eq, room, building };
}