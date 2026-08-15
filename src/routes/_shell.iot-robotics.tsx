import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Battery,
  Bot,
  Cpu,
  Droplets,
  Gauge,
  Loader2,
  Plus,
  Radio,
  Router,
  Signal,
  Thermometer,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Chip,
  MetricBar,
  Panel,
  PanelHeader,
  Sparkline,
  StatCard,
  StatusDot,
} from "@/components/january/primitives";
import { createIoTDevice, deleteIoTDevice, listIoTDevices, type IoTDevice, updateIoTDevice } from "@/lib/api";

export const Route = createFileRoute("/_shell/iot-robotics")({
  head: () => ({
    meta: [
      { title: "IoT & Robotics — JANUARY device control" },
      {
        name: "description",
        content:
          "Monitor connected controllers, sensors and robots with live telemetry, battery and signal health.",
      },
      { property: "og:title", content: "IoT & Robotics — JANUARY" },
      {
        property: "og:description", content: "Device fleet dashboard with live sensor readings and robot status." },
    ],
  }),
  component: IotPage,
});

const DEVICE_TYPES = ["esp32", "arduino", "stm32", "robot", "sensor", "controller", "gateway", "generic"];
const DEVICE_TYPE_LABEL: Record<string, string> = {
  esp32: "ESP32",
  arduino: "Arduino",
  stm32: "STM32",
  robot: "Robot",
  sensor: "Sensor",
  controller: "Controller",
  gateway: "Gateway",
  generic: "Generic",
};
const CONNECTION_TYPES = ["wifi", "bluetooth", "mqtt", "serial", "usb", "none"];
const STATUSES = ["online", "offline", "error", "unknown"];

function IotPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    device_type: "generic",
    device_id: "",
    connection_type: "wifi",
    connection_config: "",
    description: "",
  });

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["iot-devices"],
    queryFn: listIoTDevices,
  });

  const create = useMutation({
    mutationFn: () => createIoTDevice(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
      setIsCreating(false);
      setDraft({
        name: "",
        device_type: "generic",
        device_id: "",
        connection_type: "wifi",
        connection_config: "",
        description: "",
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteIoTDevice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["iot-devices"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IoTDevice> }) =>
      updateIoTDevice(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["iot-devices"] }),
  });

  const stats = useMemo(() => {
    const online = devices.filter((d) => d.status === "online").length;
    const lowBattery = 0;
    return {
      total: devices.length,
      online,
      lowBattery,
      dataPoints: "—",
    };
  }, [devices]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    devices.forEach((d) => {
      counts[d.device_type] = (counts[d.device_type] || 0) + 1;
    });
    return Object.entries(counts);
  }, [devices]);

  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.device_id && d.device_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell promptPlaceholder="Ask January about your devices..." rightPanel={<IotRail typeCounts={typeCounts} />}>
      <PageHeader
        title="IoT & Robotics"
        subtitle="Live telemetry from every connected device"
        actions={
          <AmberButton onClick={() => setIsCreating(true)}>
            <Plus className="size-3.5" /> Pair Device
          </AmberButton>
        }
      />

      {isCreating ? (
        <Panel className="mb-3">
          <PanelHeader title="Register Device" />
          <form
            className="grid gap-3 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <input
              required
              placeholder="Device name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <input
              placeholder="Device ID (optional)"
              value={draft.device_id}
              onChange={(e) => setDraft({ ...draft, device_id: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <select
              value={draft.device_type}
              onChange={(e) => setDraft({ ...draft, device_type: e.target.value })}
              className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            >
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t} className="bg-card">
                  {DEVICE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            <select
              value={draft.connection_type}
              onChange={(e) => setDraft({ ...draft, connection_type: e.target.value })}
              className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            >
              {CONNECTION_TYPES.map((c) => (
                <option key={c} value={c} className="bg-card">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <input
              placeholder="Connection config (optional)"
              value={draft.connection_config}
              onChange={(e) => setDraft({ ...draft, connection_config: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <input
              placeholder="Brief description (optional)"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <div className="flex gap-2 sm:col-span-2">
              <AmberButton type="submit" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Register
              </AmberButton>
              <GhostButton type="button" onClick={() => setIsCreating(false)}>
                <X className="size-3.5" /> Cancel
              </GhostButton>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Wifi} label="Devices" value={stats.total} hint="Registered" />
        <StatCard icon={Signal} label="Online" value={stats.online} hint="Connected" tone="ok" />
        <StatCard
          icon={Battery}
          label="Low Battery"
          value={stats.lowBattery}
          hint="Telemetry required"
          tone="danger"
        />
        <StatCard icon={Gauge} label="Data Points" value={stats.dataPoints} hint="No connection yet" tone="info" />
      </div>

      <Toolbar
        placeholder="Search devices..."
        selects={[
          ["All Types", "Controller", "Sensor", "Robot", "Gateway"],
          ["All Status", "Online", "Offline"],
        ]}
        onSearchChange={setSearchQuery}
      />
      <FilterTabs tabs={["All Devices", "Online", "Offline", "Robots", "Sensors"]} />

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading devices...</p>
      ) : filteredDevices.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-medium text-foreground">No devices registered</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Register a device to monitor its telemetry and status from here.
          </p>
        </Panel>
      ) : (
        <Panel>
          <div className="divide-y divide-[var(--hairline)]">
            {filteredDevices.map((device) => (
              <div key={device.id} className="group px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-medium text-foreground">
                        {device.name}
                      </span>
                      <Chip>{DEVICE_TYPE_LABEL[device.device_type]}</Chip>
                      <Chip tone={device.status === "online" ? "ok" : "amber"}>
                        <StatusDot tone={device.status === "online" ? "ok" : "amber"} />
                        {device.status}
                      </Chip>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {device.device_id || "No ID"} • {device.connection_type || "No connection"} {device.description ? `• ${device.description}` : ""}
                    </p>
                    {device.last_seen ? (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Last seen: {new Date(device.last_seen).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    {device.status === "offline" && (
                      <button
                        onClick={() => update.mutate({ id: device.id, data: { status: "online" } })}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-ok"
                      >
                        <Signal className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${device.name}"?`)) {
                          remove.mutate(device.id);
                        }
                      }}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}

function IotRail({ typeCounts }: { typeCounts: [string, number][] }) {
  return (
    <>
      <Panel>
        <PanelHeader title="Live Telemetry" action="Expand" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No telemetry data is available yet.</p>
          <p>Device metrics will display once a connection is established in Phase 2.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Network" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Network status will appear when a device is connected.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Device Types" />
        <ul className="space-y-1.5 p-3 text-[11px]">
          {typeCounts.length === 0 ? (
            <li className="text-muted-foreground">No devices yet</li>
          ) : (
            typeCounts.map(([type, count]) => (
              <li key={type} className="flex items-center justify-between">
                <span className="text-muted-foreground">{DEVICE_TYPE_LABEL[type] || type}</span>
                <span className="text-foreground/85">{count}</span>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </>
  );
}
