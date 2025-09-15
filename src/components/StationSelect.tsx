import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import stationsFile from "../../Backend/stations.json";

export type StationRecord = {
  stnName: string;
  stnCode: string;
  stnCity?: string;
};

type StationSelectProps = {
  label: string;
  placeholder?: string;
  valueCode: string;
  onChangeCode: (code: string) => void;
};

export default function StationSelect({ label, placeholder, valueCode, onChangeCode }: StationSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const stations: StationRecord[] = useMemo(() => {
    const raw = (Array.isArray((stationsFile as any)?.stations) ? (stationsFile as any).stations : (stationsFile as any)) as any[];
    return raw.map((s: any) => ({
      stnName: s.stnName || s.name || s.station_name || "",
      stnCode: s.stnCode || s.code || s.station_code || "",
      stnCity: s.stnCity || s.city || s.district || "",
    })).filter((s: StationRecord) => s.stnCode && s.stnName);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as StationRecord[];
    return stations.filter((s) =>
      s.stnName.toLowerCase().includes(q) ||
      s.stnCode.toLowerCase().includes(q) ||
      (s.stnCity || "").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, stations]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-station-select-root]")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div data-station-select-root>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          placeholder={placeholder || "Type station name or code"}
          value={query || valueCode}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && (query.length >= 2) && (
          <Card className="absolute z-20 w-full mt-1 max-h-72 overflow-auto">
            <div className="p-2 text-xs text-muted-foreground">
              {`Showing ${suggestions.length} result(s)`}
            </div>
            <div>
              {suggestions.map((s) => (
                <button
                  key={s.stnCode + s.stnName}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted"
                  onClick={() => {
                    onChangeCode(s.stnCode);
                    setQuery(`${s.stnName} (${s.stnCode})`);
                    setOpen(false);
                  }}
                >
                  <div className="font-medium">{s.stnName}</div>
                  <div className="text-xs text-muted-foreground">{s.stnCode}{s.stnCity ? ` • ${s.stnCity}` : ''}</div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
