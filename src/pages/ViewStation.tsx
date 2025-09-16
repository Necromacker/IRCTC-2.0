import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { Building } from "lucide-react";

const DADAR_COORDS = { lat: 19.0183, lng: 72.8423 };

const StreetView = () => {
  const panoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panoRef.current) {
      const panorama = new google.maps.StreetViewPanorama(panoRef.current, {
        position: DADAR_COORDS,
        pov: { heading: 120, pitch: 0 },
        zoom: 1,
        addressControl: true,
        linksControl: true,
        panControl: true,
        enableCloseButton: false,
      });

      // Attempt to find a nearby panorama if exact position isn't available
      const sv = new google.maps.StreetViewService();
      sv.getPanorama({ location: DADAR_COORDS, radius: 150 }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location?.pano) {
          panorama.setPano(data.location.pano);
          panorama.setPov({ heading: 120, pitch: 0 });
          panorama.setVisible(true);
        }
      });
    }
  }, []);

  return <div ref={panoRef} className="w-full h-[28rem] rounded-xl ring-1 ring-border shadow-sm" />;
};

const render = (status: Status) => {
  if (status === Status.LOADING) {
    return (
      <div className="w-full h-[28rem] rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">Loading Street View…</div>
      </div>
    );
  }
  if (status === Status.FAILURE) {
    // Fallback embedded Street View iframe for Dadar Station
    const iframeSrc = `https://www.google.com/maps?q=&layer=c&cbll=${DADAR_COORDS.lat},${DADAR_COORDS.lng}&cbp=11,120,0,0,0&hl=en&output=svembed`;
    return (
      <iframe
        title="Dadar Station Street View"
        src={iframeSrc}
        className="w-full h-[28rem] rounded-lg border"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }
  return <StreetView />;
};

const ViewStation = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card className="border card-glow">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-railway-orange/10 rounded-t-xl border-b">
            <CardTitle>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 widget-glow ring-1 ring-inset ring-primary/20 bg-white/70 backdrop-blur">
                    <Building className="h-7 w-7 text-primary" />
                    <span className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-primary bg-clip-text text-transparent">View Station</span>
                  </div>
                  <span className="hidden sm:block h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent" />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Dadar Railway Station, Mumbai</h2>
              <p className="text-sm text-muted-foreground">Explore the station surroundings in 360° Street View.</p>
            </div>

            <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} render={render} />

            {/* Fallback link */}
            <div className="text-xs text-muted-foreground">
              If Street View doesn’t load, you can also explore using Google Maps: <a className="text-primary underline" href="https://www.google.com/maps/@19.0183,72.8423,3a,75y,120h,90t/data=!3m6!1e1" target="_blank" rel="noreferrer">Open 360° view</a>.
            </div>

            {/* Dadar Station Map Image */}
            <div className="pt-4">
              <h3 className="text-sm font-semibold mb-2">Dadar Station Map</h3>
              <div className="w-full h-[40rem] rounded-xl border bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border">
                <img
                  src="/Station.jpg"
                  alt="Dadar Station Map"
                  className="w-full h-full max-w-full max-h-full object-contain block"
                  loading="lazy"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewStation; 