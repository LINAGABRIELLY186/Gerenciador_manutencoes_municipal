import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, X } from "lucide-react";
import { DataState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { locate, useData, useRefresh } from "@/hooks/use-data";
import { brl } from "@/lib/os";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros | Gestão de Ar-Condicionado" },
      { name: "description", content: "Prédios, salas e equipamentos." },
      { property: "og:title", content: "Cadastros" },
      { property: "og:description", content: "Prédios, salas e equipamentos." },
    ],
  }),
  component: Cadastros,
});

const sel = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function Cadastros() {
  const q = useData();
  const refresh = useRefresh();

  // Estados dos formulários (com campo 'id' para diferenciar criação de edição)
  const [b, setB] = useState<{ id?: string; name: string; secretaria: string }>({
    name: "",
    secretaria: "",
  });

  const [r, setR] = useState<{ id?: string; building_id: string; name: string }>({
    building_id: "",
    name: "",
  });

  const [e, setE] = useState<{
    id?: string;
    room_id: string;
    patrimonio: string;
    tombamento: string;
    marca: string;
    modelo: string;
    btus: string;
    valor_novo: string;
  }>({
    room_id: "",
    patrimonio: "Ar-condicionado",
    tombamento: "",
    marca: "",
    modelo: "",
    btus: "",
    valor_novo: "",
  });

  const [activeTab, setActiveTab] = useState("equipamentos");

  if (!q.data) return <DataState isLoading={q.isLoading} error={q.error} />;
  const d = q.data;

  const run = async (
    p: PromiseLike<{ error: { code?: string; message: string } | null }>,
    ok: string,
    reset?: () => void
  ) => {
    const { error } = await p;
    if (error) {
      if (error.code === "23505") {
        toast.error("Já existe um registro com este número de tombamento.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success(ok);
    reset?.();
    refresh();
  };

  // Handlers para Prédios
  const handleSaveBuilding = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!b.name.trim()) {
      toast.error("Informe o nome do prédio.");
      return;
    }

    const payload = {
      name: b.name.trim(),
      secretaria: b.secretaria?.trim() || null,
    };

    if (b.id) {
      run(
        supabase.from("buildings").update(payload).eq("id", b.id),
        "Prédio atualizado com sucesso",
        () => setB({ name: "", secretaria: "" })
      );
    } else {
      run(
        supabase.from("buildings").insert(payload),
        "Prédio cadastrado com sucesso",
        () => setB({ name: "", secretaria: "" })
      );
    }
  };

  // Handlers para Salas
  const handleSaveRoom = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!r.name.trim() || !r.building_id) {
      toast.error("Selecione o prédio e informe o nome da sala.");
      return;
    }

    const payload = {
      building_id: r.building_id,
      name: r.name.trim(),
    };

    if (r.id) {
      run(
        supabase.from("rooms").update(payload).eq("id", r.id),
        "Sala atualizada com sucesso",
        () => setR({ building_id: "", name: "" })
      );
    } else {
      run(
        supabase.from("rooms").insert(payload),
        "Sala cadastrada com sucesso",
        () => setR({ ...r, name: "" })
      );
    }
  };

  // Handlers para Equipamentos
  const handleSaveEquipment = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!e.room_id || !e.patrimonio.trim()) {
      toast.error("Selecione a sala e informe o tipo de equipamento.");
      return;
    }

    const payload = {
      room_id: e.room_id,
      patrimonio: e.patrimonio.trim(),
      tombamento: e.tombamento?.trim() || null,
      marca: e.marca?.trim() || null,
      modelo: e.modelo?.trim() || null,
      btus: e.btus ? Number(e.btus) : null,
      valor_novo: Number(e.valor_novo) || 0,
    };

    if (e.id) {
      run(
        supabase.from("equipment").update(payload).eq("id", e.id),
        "Equipamento atualizado com sucesso",
        () =>
          setE({
            room_id: "",
            patrimonio: "Ar-condicionado",
            tombamento: "",
            marca: "",
            modelo: "",
            btus: "",
            valor_novo: "",
          })
      );
    } else {
      run(
        supabase.from("equipment").insert(payload),
        "Equipamento cadastrado com sucesso",
        () =>
          setE({
            ...e,
            tombamento: "",
            marca: "",
            modelo: "",
            btus: "",
            valor_novo: "",
          })
      );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cadastros</h1>

      {/* Formulários lado a lado */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Formulário: Prédio */}
        <form
          className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-card"
          onSubmit={handleSaveBuilding}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{b.id ? "Editar prédio" : "Novo prédio"}</h2>
              {b.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setB({ name: "", secretaria: "" })}
                >
                  <X className="mr-1 size-3" /> Cancelar
                </Button>
              )}
            </div>
            <Label>Nome</Label>
            <Input
              value={b.name}
              onChange={(x) => setB({ ...b, name: x.target.value })}
              placeholder="Ex: Sede Administrativa"
            />
            <Label>Secretaria</Label>
            <Input
              value={b.secretaria}
              onChange={(x) => setB({ ...b, secretaria: x.target.value })}
              placeholder="Ex: Secretaria de Administração"
            />
          </div>
          <Button className="mt-4 w-full">{b.id ? "Salvar alterações" : "Cadastrar prédio"}</Button>
        </form>

        {/* Formulário: Sala */}
        <form
          className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-card"
          onSubmit={handleSaveRoom}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{r.id ? "Editar sala" : "Nova sala"}</h2>
              {r.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setR({ building_id: "", name: "" })}
                >
                  <X className="mr-1 size-3" /> Cancelar
                </Button>
              )}
            </div>
            <Label>Prédio</Label>
            <select
              className={sel}
              value={r.building_id}
              onChange={(x) => setR({ ...r, building_id: x.target.value })}
            >
              <option value="">Selecione…</option>
              {d.buildings.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <Label>Nome da sala</Label>
            <Input
              value={r.name}
              onChange={(x) => setR({ ...r, name: x.target.value })}
              placeholder="Ex: Gabinete / Sala 02"
            />
          </div>
          <Button className="mt-4 w-full">{r.id ? "Salvar alterações" : "Cadastrar sala"}</Button>
        </form>

        {/* Formulário: Equipamento */}
        <form
          className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-card"
          onSubmit={handleSaveEquipment}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{e.id ? "Editar equipamento" : "Novo equipamento"}</h2>
              {e.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setE({
                      room_id: "",
                      patrimonio: "Ar-condicionado",
                      tombamento: "",
                      marca: "",
                      modelo: "",
                      btus: "",
                      valor_novo: "",
                    })
                  }
                >
                  <X className="mr-1 size-3" /> Cancelar
                </Button>
              )}
            </div>
            <Label>Sala</Label>
            <select
              className={sel}
              value={e.room_id}
              onChange={(x) => setE({ ...e, room_id: x.target.value })}
            >
              <option value="">Selecione…</option>
              {d.rooms.map((x) => (
                <option key={x.id} value={x.id}>
                  {d.buildings.find((bb) => bb.id === x.building_id)?.name} / {x.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Nº Tombamento (Único)</Label>
                <Input
                  value={e.tombamento}
                  onChange={(x) => setE({ ...e, tombamento: x.target.value })}
                  placeholder="Ex: 001452"
                />
              </div>
              <div>
                <Label>Equipamento / Tipo</Label>
                <Input
                  value={e.patrimonio}
                  onChange={(x) => setE({ ...e, patrimonio: x.target.value })}
                  placeholder="Ex: Ar-condicionado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Marca</Label>
                <Input
                  value={e.marca}
                  onChange={(x) => setE({ ...e, marca: x.target.value })}
                  placeholder="Ex: Elgin"
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={e.modelo}
                  onChange={(x) => setE({ ...e, modelo: x.target.value })}
                  placeholder="Ex: Split Eco"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>BTUs (opcional)</Label>
                <Input
                  type="number"
                  value={e.btus}
                  onChange={(x) => setE({ ...e, btus: x.target.value })}
                  placeholder="Ex: 12000"
                />
              </div>
              <div>
                <Label>Valor novo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={e.valor_novo}
                  onChange={(x) => setE({ ...e, valor_novo: x.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
          <Button className="mt-4 w-full">
            {e.id ? "Salvar alterações" : "Cadastrar equipamento"}
          </Button>
        </form>
      </div>

      {/* Tabelas de Gerenciamento organizadas em Abas */}
      <section className="rounded-xl border bg-card p-4 shadow-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-4 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="equipamentos">
                Equipamentos ({d.equipment.length})
              </TabsTrigger>
              <TabsTrigger value="salas">Salas ({d.rooms.length})</TabsTrigger>
              <TabsTrigger value="predios">Prédios ({d.buildings.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* Aba: Equipamentos */}
          <TabsContent value="equipamentos" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2">Tombamento</th>
                  <th>Equipamento</th>
                  <th>Local</th>
                  <th>Aparelho</th>
                  <th>Valor novo</th>
                  <th>Defeito crítico</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.equipment.map((x) => {
                  const l = locate(d, x.id);
                  return (
                    <tr key={x.id}>
                      <td className="py-2 font-mono font-semibold">
                        {x.tombamento || <span className="text-muted-foreground italic">S/T</span>}
                      </td>
                      <td className="py-2">{x.patrimonio}</td>
                      <td>
                        {l.building?.name || "Sem prédio"} / {l.room?.name || "Sem sala"}
                      </td>
                      <td>
                        {x.marca || ""} {x.modelo || ""} {x.btus ? `${x.btus} BTUs` : ""}
                      </td>
                      <td>{brl(x.valor_novo)}</td>
                      <td>
                        <Switch
                          checked={x.critico}
                          onCheckedChange={(v) =>
                            run(
                              supabase.from("equipment").update({ critico: v }).eq("id", x.id),
                              "Status atualizado"
                            )
                          }
                        />
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar equipamento"
                          onClick={() => {
                            setE({
                              id: x.id,
                              room_id: x.room_id || "",
                              patrimonio: x.patrimonio || "",
                              tombamento: x.tombamento || "",
                              marca: x.marca || "",
                              modelo: x.modelo || "",
                              btus: x.btus ? String(x.btus) : "",
                              valor_novo: x.valor_novo ? String(x.valor_novo) : "",
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir equipamento"
                          onClick={() =>
                            confirm("Excluir equipamento e seu histórico?") &&
                            run(supabase.from("equipment").delete().eq("id", x.id), "Equipamento excluído")
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TabsContent>

          {/* Aba: Salas */}
          <TabsContent value="salas" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2">Nome da Sala</th>
                  <th>Prédio Vinculado</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.rooms.map((room) => {
                  const bldg = d.buildings.find((bItem) => bItem.id === room.building_id);
                  return (
                    <tr key={room.id}>
                      <td className="py-2 font-semibold">{room.name}</td>
                      <td>{bldg?.name || "Sem prédio"}</td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar sala"
                          onClick={() => {
                            setR({
                              id: room.id,
                              building_id: room.building_id || "",
                              name: room.name || "",
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir sala"
                          onClick={() =>
                            confirm("Excluir esta sala e seus equipamentos associados?") &&
                            run(supabase.from("rooms").delete().eq("id", room.id), "Sala excluída")
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TabsContent>

          {/* Aba: Prédios */}
          <TabsContent value="predios" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2">Nome do Prédio</th>
                  <th>Secretaria / Órgão</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.buildings.map((bldg) => (
                  <tr key={bldg.id}>
                    <td className="py-2 font-semibold">{bldg.name}</td>
                    <td>{bldg.secretaria || "—"}</td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar prédio"
                        onClick={() => {
                          setB({
                            id: bldg.id,
                            name: bldg.name || "",
                            secretaria: bldg.secretaria || "",
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir prédio"
                        onClick={() =>
                          confirm("Excluir este prédio e todas as salas vinculadas?") &&
                          run(
                            supabase.from("buildings").delete().eq("id", bldg.id),
                            "Prédio excluído"
                          )
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}