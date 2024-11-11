package main

import (
	"io/ioutil"
	"log"
	"math/rand"
	"os"

	"github.com/paulmach/go.geojson"
)

// Coordinates holds latitude and longitude.
type Coordinates struct {
	lat, lon float64
}

// MunicipalityPolygons holds GeoJSON Feature data for each municipality.
var MunicipalityPolygons map[string]*geojson.Feature

// LoadMunicipalityGeojson loads the GeoJSON file and populates MunicipalityPolygons map.
func LoadMunicipalityGeojson(filename string) {
	MunicipalityPolygons = make(map[string]*geojson.Feature)

	// Read the GeoJSON file.
	file, err := os.Open(filename)
	if err != nil {
		log.Fatalf("Failed to open GeoJSON file: %v", err)
	}
	defer file.Close()

	// Parse the JSON content.
	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		log.Fatalf("Failed to read GeoJSON file: %v", err)
	}

	// Parse as GeoJSON FeatureCollection.
	fc, err := geojson.UnmarshalFeatureCollection(bytes)
	if err != nil {
		log.Fatalf("Failed to parse GeoJSON FeatureCollection: %v", err)
	}

	// Populate the map with each municipality feature.
	for _, feature := range fc.Features {
		name := feature.PropertyMustString("name")
		MunicipalityPolygons[name] = feature
	}
}

// calculateBoundingBox calculates the bounding box of a GeoJSON MultiPolygon.
func calculateBoundingBox(feature *geojson.Feature) (minLat, minLon, maxLat, maxLon float64) {
	// Same as the previous implementation.
	if feature.Geometry.Type == geojson.GeometryMultiPolygon {
		firstCoord := feature.Geometry.MultiPolygon[0][0][0]
		minLat, minLon = firstCoord[1], firstCoord[0]
		maxLat, maxLon = firstCoord[1], firstCoord[0]

		for _, polygon := range feature.Geometry.MultiPolygon {
			for _, ring := range polygon {
				for _, coord := range ring {
					lat, lon := coord[1], coord[0]
					if lat < minLat {
						minLat = lat
					}
					if lat > maxLat {
						maxLat = lat
					}
					if lon < minLon {
						minLon = lon
					}
					if lon > maxLon {
						maxLon = lon
					}
				}
			}
		}
	}
	return
}

// randomCoordinatesWithinMunicipality generates random coordinates within the specified municipality.
func randomCoordinatesWithinMunicipality(municipality string) Coordinates {
	feature := MunicipalityPolygons[municipality]
	if feature == nil {
		panic("No polygon data found for municipality: " + municipality)
	}

	minLat, minLon, maxLat, maxLon := calculateBoundingBox(feature)

	for {
		lat := minLat + rand.Float64()*(maxLat-minLat)
		lon := minLon + rand.Float64()*(maxLon-minLon)
		if pointInPolygon(lat, lon, feature) {
			return Coordinates{lat: lat, lon: lon}
		}
	}
}

// pointInPolygon performs a point-in-polygon test using the ray-casting algorithm.
func pointInPolygon(lat, lon float64, feature *geojson.Feature) bool {
	if feature.Geometry.Type == geojson.GeometryMultiPolygon {
		for _, polygon := range feature.Geometry.MultiPolygon {
			for _, ring := range polygon {
				if isPointInRing(lat, lon, ring) {
					return true
				}
			}
		}
	}
	return false
}

// isPointInRing checks if a point is within a polygon ring using the ray-casting algorithm.
func isPointInRing(lat, lon float64, ring [][]float64) bool {
	inside := false
	j := len(ring) - 1
	for i := 0; i < len(ring); i++ {
		yi, xi := ring[i][1], ring[i][0]
		yj, xj := ring[j][1], ring[j][0]
		if ((yi > lat) != (yj > lat)) && (lon < (xj-xi)*(lat-yi)/(yj-yi)+xi) {
			inside = !inside
		}
		j = i
	}
	return inside
}

// getMunicipalityNames returns a slice of all municipality names loaded from the GeoJSON file.
func getMunicipalityNames() []string {
	names := make([]string, 0, len(MunicipalityPolygons))
	for name := range MunicipalityPolygons {
		names = append(names, name)
	}
	return names
}
