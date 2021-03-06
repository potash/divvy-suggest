var map, layer, heatmap, heatmapData, markers;
var fromProjection, toProjection;

var initPages = 25;
var initUrl = "http://suggest.divvybikes.com/api/places";

var csv = '';

function getPageUrl(page) {
	if (page == 1) {
		return initUrl;
	} else {
		return initUrl + "?page=" + page;
	}
}

function fetchPlaces(page, fetchNext) {
	$.ajax({dataType: "json", url: getPageUrl(page),
		success: function(data) {
			if (fetchNext && data.metadata.next != null) {
				fetchPlaces(data.metadata.next.match('\\d*$'), true);
			}
			addPlaces(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(errorThrown);
		}
	});
}

function init(divId) {
	initHeatmap(divId);
	addStations();
	for(var i = 1; i < initPages; i++) {
		fetchPlaces(i, i == initPages);
	}
}

function addPlaces(places) {
	heatmapData.data = heatmapData.data.concat(
			places.features.map(function(p) {
				var support = p.properties.submission_sets.support == null ? 1 : p.properties.submission_sets.support.length;
				csv += p.properties.id + "," + p.geometry.coordinates[0] + "," + p.geometry.coordinates[1] + "," + support + "\n";
				heatmapData.max = Math.max(heatmapData.max, support);
				return {
					lonlat: new OpenLayers.LonLat(p.geometry.coordinates[0], p.geometry.coordinates[1]), 
				count: support
				};
			}) 
			);
	heatmap.setDataSet(heatmapData);
}

function addStations() {
	var size = new OpenLayers.Size(12,20);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);

	getStations().stationBeanList.forEach(function(s) {
		var lonlat = new OpenLayers.LonLat(s.longitude,s.latitude).transform(fromProjection,toProjection);
		var icon = new OpenLayers.Icon("http://cdn.leafletjs.com/leaflet-0.7.1/images/marker-icon.png", size, offset);
		markers.addMarker(new OpenLayers.Marker(
				lonlat,
				icon)
			);
	});
}

function initHeatmap(divId) {
	heatmapData = { max: 1, data : [] };
	map = new OpenLayers.Map(divId);
	layer = new OpenLayers.Layer.OSM();

	fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
	toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
	var chicagoLonLat = new OpenLayers.LonLat(-87.629767, 41.878247);

	// create our heatmap layer
	heatmap = new OpenLayers.Layer.Heatmap( "Heatmap Layer", map, layer, {visible: true, radius:30}, 
			{isBaseLayer: false, opacity: 0.3, projection: fromProjection});
	map.addLayers([layer, heatmap]);

	map.setCenter(chicagoLonLat.transform(fromProjection,toProjection), 12);
	heatmap.setDataSet(heatmapData);

	markers = new OpenLayers.Layer.Markers( "Markers" );
	map.addLayer(markers);

}

