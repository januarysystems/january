import { createFileRoute } from "@tanstack/react-router";
import {
  Battery,
  Bot,
  Cpu,
  Droplets,
  Gauge,
  Plus,
  Radio,
  Router,
  Signal,
  Thermometer,
  Wifi,
} from "lucide-react";

import { AmberButton, AppShell, PageHeader } from "@/components/january/AppShell";
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
        property: "og:description",
        content: "Device fleet dashboard with live sensor readings and robot status.",
      },
    ],
  }),
  component: IotPage,
});

function IotPage() {
  return (
    <AppShell promptPlaceholder="Ask January about your devices..." rightPanel={<IotRail />}>
      <PageHeader
        title="IoT & Robotics"
        subtitle="Live telemetry from every connected device"
        actions={
          <AmberButton>
            <Plus className="size-3.5" /> Pair Device
          </AmberButton>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Wifi} label="Devices" value={0} hint="Connected" />
        <StatCard icon={Signal} label="Online" value={0} hint="Reporting now" tone="ok" />
        <StatCard
          icon={Battery}
          label="Low Battery"
          value={0}
          hint="Needs charging"
          tone="danger"
        />
        <StatCard icon={Gauge} label="Data Points" value="—" hint="No data" tone="info" />
      </div>

      <Toolbar
        placeholder="Search devices..."
        selects={[
          ["All Types", "Controller", "Sensor", "Robot", "Gateway"],
          ["All Status", "Online", "Offline"],
        ]}
      />
      <FilterTabs tabs={["All Devices", "Online", "Offline", "Robots", "Sensors"]} />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No devices connected</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Connect a device to monitor its telemetry and status from here.
        </p>
      </Panel>
    </AppShell>
  );
}

function IotRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Live Telemetry" action="Expand" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No telemetry data is available yet.</p>
          <p>Device metrics will display once a connection is established.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Network" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Network status will appear when a device is connected.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Device Events" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No device events have been recorded yet.</p>
        </div>
      </Panel>
    </>
  );
}
