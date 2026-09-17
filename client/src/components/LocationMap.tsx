import { useCallback } from "react";
import { MapView } from "@/components/Map";

const fullAddress = "Shop 1 & 2, Block 8 Allahwali Market, F-8/1, F-8, Islamabad, 44000, Pakistan";

export function LocationMap() {
  const onMapReady = useCallback((map: google.maps.Map) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: fullAddress }, (results, status) => {
      const result = results?.[0];
      if (status !== "OK" || !result) return;
      map.setCenter(result.geometry.location);
      map.setZoom(16);
      new google.maps.marker.AdvancedMarkerElement({ map, position: result.geometry.location, title: "Coffeemistry" });
    });
  }, []);
  return <div className="relative h-[20rem] w-full overflow-hidden bg-[#eadbc4] sm:h-[28rem]">
    <MapView initialCenter={{ lat: 33.7171, lng: 73.0437 }} initialZoom={13} onMapReady={onMapReady} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
    <iframe
      title="Map to Coffeemistry in F-8/1, Islamabad"
      className="absolute inset-0 h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=Shop%201%20%26%202%2C%20Block%208%20Allahwali%20Market%2C%20F-8%2F1%2C%20Islamabad&z=16&output=embed"
    />
  </div>;
}
