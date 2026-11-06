-- Sistema Municipal de Gestão de Ar-Condicionado - Lagoa do Piauí (PI)
-- Execute este script no SQL Editor do seu projeto Supabase.

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  secretaria text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  patrimonio text not null unique,
  marca text,
  modelo text,
  btus integer,
  valor_novo numeric(12,2) not null default 0,
  critico boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  numero serial,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  tipo text not null default 'corretiva' check (tipo in ('corretiva','preventiva')),
  queixa text not null,
  status text not null default 'aguardando_visita' check (status in
    ('aguardando_visita','aguardando_autorizacao','autorizado_em_execucao','servico_concluido','arquivado')),
  tecnico_nome text,
  diagnostico text,
  pecas jsonb not null default '[]'::jsonb,
  mao_de_obra numeric(12,2) not null default 0,
  motivo_recusa text,
  valor_final numeric(12,2),
  nota_fiscal text,
  arquivado_por text,
  created_at timestamptz not null default now(),
  orcamento_at timestamptz,
  autorizado_at timestamptz,
  concluido_at timestamptz,
  arquivado_at timestamptz
);

grant select on public.buildings, public.rooms, public.equipment, public.service_orders to anon;
grant select, insert, update, delete on public.buildings, public.rooms, public.equipment, public.service_orders to authenticated;
grant all on public.buildings, public.rooms, public.equipment, public.service_orders to service_role;
grant usage, select on sequence public.service_orders_numero_seq to authenticated;

alter table public.buildings enable row level security;
alter table public.rooms enable row level security;
alter table public.equipment enable row level security;
alter table public.service_orders enable row level security;

-- Leitura pública (técnico sem senha precisa ver as OS e onde ficam os aparelhos)
create policy "public read buildings" on public.buildings for select to anon, authenticated using (true);
create policy "public read rooms" on public.rooms for select to anon, authenticated using (true);
create policy "public read equipment" on public.equipment for select to anon, authenticated using (true);
create policy "public read orders" on public.service_orders for select to anon, authenticated using (true);

-- Gestão completa apenas para usuários autenticados
create policy "admin write buildings" on public.buildings for all to authenticated using (true) with check (true);
create policy "admin write rooms" on public.rooms for all to authenticated using (true) with check (true);
create policy "admin write equipment" on public.equipment for all to authenticated using (true) with check (true);
create policy "admin write orders" on public.service_orders for all to authenticated using (true) with check (true);

-- Ações do técnico (sem senha) com travas de status no servidor
create or replace function public.tecnico_enviar_orcamento(
  _order_id uuid, _tecnico text, _diagnostico text, _pecas jsonb, _mao_de_obra numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.service_orders
     set tecnico_nome = _tecnico, diagnostico = _diagnostico, pecas = coalesce(_pecas,'[]'::jsonb),
         mao_de_obra = greatest(coalesce(_mao_de_obra,0),0), status = 'aguardando_autorizacao',
         orcamento_at = now(), motivo_recusa = null
   where id = _order_id and status = 'aguardando_visita';
  if not found then raise exception 'OS não está aguardando visita'; end if;
end $$;

create or replace function public.tecnico_concluir_servico(_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.service_orders set status = 'servico_concluido', concluido_at = now()
   where id = _order_id and status = 'autorizado_em_execucao';
  if not found then raise exception 'Serviço ainda não autorizado pela gestão'; end if;
end $$;

grant execute on function public.tecnico_enviar_orcamento(uuid, text, text, jsonb, numeric) to anon, authenticated;
grant execute on function public.tecnico_concluir_servico(uuid) to anon, authenticated;
