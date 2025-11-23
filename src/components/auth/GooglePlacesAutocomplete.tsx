import React, { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const libraries: ("places")[] = ["places"];

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface GooglePlacesAutocompleteProps {
  onLocationSelect: (location: LocationData) => void;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  onLocationSelect,
  label = "Location",
  placeholder = "Search for an address...",
  defaultValue = ""
}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry?.location && place.formatted_address) {
        const addressComponents = place.address_components || [];
        
        const getComponent = (type: string) => {
          const component = addressComponents.find(c => c.types.includes(type));
          return component?.long_name || '';
        };

        const locationData: LocationData = {
          address: place.formatted_address,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          city: getComponent('locality') || getComponent('administrative_area_level_2'),
          state: getComponent('administrative_area_level_1'),
          postalCode: getComponent('postal_code'),
          country: getComponent('country')
        };

        setInputValue(place.formatted_address);
        onLocationSelect(locationData);
      }
    }
  };

  if (!isLoaded) {
    return <Input placeholder="Loading..." disabled />;
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Autocomplete>
    </div>
  );
};
