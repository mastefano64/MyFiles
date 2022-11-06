
$(document).ready(function () {
    var appmap = new AppMap();
    appmap.initilizeMap();
});

function AppMap() {
    var that = this;
    this.map;

    this.initilizeMap = function () {
        var layerwfs = this.createWfs();

        this.map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),

                //new ol.layer.Vector({
                //    source: new ol.source.Vector({
                //        url: 'http://geomap.reteunitaria.piemonte.it/ws/siccms/coto-01/wfsg01/wfs_sicc102_farmacie?service=WFS&version=1.1.0&request=GetFeature&typename=FarmacieComu&srsName=EPSG:32632',
                //        format: new ol.format.WFS({
                //            srsName: "EPSG:32632",
                //            featureType: "FarmacieComu"
                //        })
                //    }),
                //    visible: true
                //}),
                //new ol.layer.Vector({
                //    source: new ol.source.Vector({
                //        url: 'http://geomap.reteunitaria.piemonte.it/ws/siccms/coto-01/wmsg01/wms_sicc112_ospedali?service=WFS&version=1.1.0&request=GetFeature&typename=ProntoSocc&srsName=EPSG:32632',
                //        format: new ol.format.WFS({
                //            srsName: "EPSG:32632",
                //            featureType: "ProntoSocc"
                //        })
                //    }),
                //    visible: true
                //})

                new ol.layer.Tile({
                    source: new ol.source.TileWMS({
                        url: 'http://geomap.reteunitaria.piemonte.it/ws/siccms/coto-01/wmsg01/wms_sicc112_ospedali?',
                        params: {
                            layers: 'Ospedali',
                            transparent: true
                        }
                    }),
                    visible: true
                }),
                layerwfs
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([7.66, 45.05]),
                zoom: 13
            })
        });

        var select = new ol.interaction.Select({
            condition: ol.events.condition.click,
            layers: [layerwfs]
        });
        select.on('select', function (event) {
            var selectedFeature = event.selected[0];
            if (selectedFeature) {
                // var props = selectedFeature.getProperties();
                // if (props.features.length === 1) {
                if (that.isCluster(selectedFeature) === false) {
                    const p = that.getClusterProperty(selectedFeature); 
                    $('#popupPanel #denominazione').text(p.denominazione);
                    $('#popupPanel #indirizzo').text(p.indirizzo);
                    $('#popupPanel #cap').text(p.cap);
                    $('#popupPanel #citta').text(p.citta);
                    var geometry = selectedFeature.getGeometry();
                    var lng = geometry.getCoordinates()[0];
                    var lat = geometry.getCoordinates()[1];
                    overlay.setPosition([lng, lat]);
                } else {
                    overlay.setPosition(undefined);
                }                  
            } else {
                overlay.setPosition(undefined);
            }
        });
        this.map.addInteraction(select);

        var overlay = new ol.Overlay({
            element: this.createPopup()
        });
        this.map.addOverlay(overlay); 
    };

    this.createWfs = function () {
        var WFSformat = new ol.format.WFS();

        var sourceWFS = new ol.source.Vector({
            loader: function (extent) {
                $.ajax('http://geomap.reteunitaria.piemonte.it/ws/siccms/coto-01/wfsg01/wfs_sicc102_farmacie?', {
                    type: 'GET',
                    data: {
                        service: 'WFS',
                        version: '1.1.0',
                        request: 'GetFeature',
                        typename: 'FarmacieComu',
                        srsname: 'EPSG:3857'
                    }
                }).done(function(response) {
                    sourceWFS.addFeatures(WFSformat.readFeatures(response));
                });
            }
        });
        var clustersource = new ol.source.Cluster({
            source: sourceWFS,
            distance: 50
        });

        var vectorLayerWFS = new ol.layer.Vector({
            source: clustersource,
            style: that.getFarmaciaStyle 
        });

        return vectorLayerWFS;
    };

    this.getFarmaciaStyle = function (feature, resolution) {
        var iconfile = '';        

        var size = feature.get('features').length;
        var iscluster = that.isCluster(feature);       

        if (size !== 1) {    
            return [
                new ol.style.Style({
                    image: new ol.style.Circle({
                      stroke: new ol.style.Stroke({
                        color: '#ffffff',
                      }),
                      fill: new ol.style.Fill({
                        color: '#3399CC',
                      }),
                      radius: 10
              
                    }),
                    text: new ol.style.Text({
                      text: size.toString(),
                      fill: new ol.style.Fill({
                        color: '#ffffff'
                      }),
                    }),
                })
            ];           
        } else {
            var prop = that.getClusterProperty(feature); 
            var isnotturna = (prop.notturna === 'NO') ? true : false;
            if (isnotturna === true) {
                iconfile = '/images/farmacia01.png';
            }
            else {
                iconfile = '/images/farmacia02.png';
            }
            return [
                new ol.style.Style({
                    image: new ol.style.Icon({
                        src: iconfile,
                        scale: 0.5
                    }) 
                })
            ];
        }       
    };

    // check if are clastered features
    this.isCluster = function(feature) {
        if (!feature || !feature.get('features')) { 
              return false; 
        }
        return feature.get('features').length > 1;
    }

    // get feature propertry or undefined
    this.getClusterProperty = function(feature) {
        if (that.isCluster(feature) === true) {
            return undefined;
        }
        const prop = feature.getProperties();
        const values = prop.features[0].values_; 
        return values; 
    }

    this.createPopup = function () {
        var panel = $('#popupPanel').get(0);
        var template = $('#popupTemplate').get(0);
        panel.innerHTML = template.innerHTML;
        return panel;
    };
}
