import React, { useEffect, useRef } from "react";
import { loadModules } from "esri-loader";

const Map = () => {
  const MapEl = useRef(null);

  useEffect(() => {
    loadModules([
      "esri/Map",
      "esri/Graphic",
      "esri/request",
      "esri/views/MapView",
      "esri/widgets/Search",
      "esri/widgets/Search/SearchSource",
      "esri/geometry/geometryEngine",
      "esri/geometry/Point",
    ]).then(
      ([
        Map,
        Graphic,
        esriRequest,
        MapView,
        Search,
        SearchSource,
        geometryEngine,
        Point,
      ]) => {
        // An open data address search API for France
        var url = "https://api-adresse.data.gouv.fr/";

        var map = new Map({
          basemap: "streets-vector",
        });

        var view = new MapView({
          container: "viewDiv",
          map: map,
          center: [2.21, 46.22], // lon, lat
          scale: 3000000,
        });

        var customSearchSource = new SearchSource({
          placeholder: "example: 8 Boulevard du Port",
          // Provide a getSuggestions method
          // to provide suggestions to the Search widget
          getSuggestions: function (params) {
            // You can request data from a
            // third-party source to find some
            // suggestions with provided suggestTerm
            // the user types in the Search widget
            return esriRequest(url + "search/", {
              query: {
                q: params.suggestTerm.replace(/ /g, "+"),
                limit: 6,
                lat: view.center.latitude,
                lon: view.center.longitude,
              },
              responseType: "json",
            }).then(function (results) {
              // Return Suggestion results to display
              // in the Search widget
              return results.data.features.map(function (feature) {
                return {
                  key: "name",
                  text: feature.properties.label,
                  sourceIndex: params.sourceIndex,
                };
              });
            });
          },
          // Provide a getResults method to find
          // results from the suggestions
          getResults: function (params) {
            // If the Search widget passes the current location,
            // you can use this in your own custom source
            var operation = params.location ? "reverse/" : "search/";
            var query = {};
            // You can perform a different query if a location
            // is provided
            if (params.location) {
              query.lat = params.location.latitude;
              query.lon = params.location.longitude;
            } else {
              query.q = params.suggestResult.text.replace(/ /g, "+");
              query.limit = 6;
            }
            return esriRequest(url + operation, {
              query: query,
              responseType: "json",
            }).then(function (results) {
              // Parse the results of your custom search
              var searchResults = results.data.features.map(function (feature) {
                // Create a Graphic the Search widget can display
                var graphic = new Graphic({
                  geometry: new Point({
                    x: feature.geometry.coordinates[0],
                    y: feature.geometry.coordinates[1],
                  }),
                  attributes: feature.properties,
                });
                // Optionally, you can provide an extent for
                // a point result, so the view can zoom to it
                var buffer = geometryEngine.geodesicBuffer(
                  graphic.geometry,
                  100,
                  "meters"
                );
                // Return a Search Result
                var searchResult = {
                  extent: buffer.extent,
                  feature: graphic,
                  name: feature.properties.label,
                };
                return searchResult;
              });

              // Return an array of Search Results
              return searchResults;
            });
          },
        });

        // Create Search widget using custom SearchSource
        var searchWidget = new Search({
          view: view,
          sources: [customSearchSource],
          includeDefaultSources: false,
        });

        // Add the search widget to the top left corner of the view
        view.ui.add(searchWidget, {
          position: "top-right",
        });
      }
    );
  }, []);

  return (
    <div
      id="viewDiv"
      style={{ height: "100vh", width: "100vw" }}
      ref={MapEl}
    ></div>
  );
};

export default Map;
