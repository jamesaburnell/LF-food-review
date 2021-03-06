// var startCoords = require('./../map');
var endLat;
var endLon;

var app = angular
  .module('TrueFoodReview.MainController',['ui.router'])
  .controller('MainController', ['$scope', 'UberFactory', 'YelpFactory', '$http', MainController]);


function MainController($scope, UberFactory, YelpFactory, $http) { 
  //Map stuff ===============================================
  $scope.lat = "0";
  $scope.lng = "0";
  $scope.accuracy = "0";
  $scope.error = "";
  $scope.model = { myMap: undefined };
  $scope.locationsList = [];

  $scope.myMarkers = [];

  $scope.showResult = function () {
      return $scope.error == "";
  };

  $scope.mapOptions = {
      center: new google.maps.LatLng($scope.lat, $scope.lng),
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      clickable: true
  };

  $scope.showPosition = function (position) {
      $scope.lat = position.coords.latitude;
      $scope.lng = position.coords.longitude;
      $scope.accuracy = position.coords.accuracy;
      $scope.$apply();

      var latlng = new google.maps.LatLng($scope.lat, $scope.lng);
      $scope.model.myMap.setCenter(latlng);
      $scope.myMarkers.push(new google.maps.Marker({ map: $scope.model.myMap, position: latlng, icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'}));

  };

  $scope.showError = function (error) {
      switch (error.code) {
          case error.PERMISSION_DENIED:
              $scope.error = "User denied the request for Geolocation.";
              break;
          case error.POSITION_UNAVAILABLE:
              $scope.error = "Location information is unavailable.";
              break;
          case error.TIMEOUT:
              $scope.error = "The request to get user location timed out.";
              break;
          case error.UNKNOWN_ERROR:
              $scope.error = "An unknown error occurred.";
              break;
      }
      $scope.$apply();
  };

  $scope.getLocation = function () {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition($scope.showPosition, $scope.showError);
      }
      else {
          $scope.error = "Geolocation is not supported by this browser.";
      }
  };
  $scope.getLocation();


  // YELP STUFF =============================================
  $scope.yelpLocations = [];
  $scope.markerClick;
  // $scope.selectedLocation = 'hey';
  // var infowindow;

  // Functions to make markers bounce upon mouseover of name *******
  $scope.bounceStart = function () {
  // var index = this.index
    // console.log(this.location[0]);
    for(var i = 0; i < $scope.myMarkers.length; i++) {
      if(this.location[0] === $scope.myMarkers[i].title){
        $scope.myMarkers[i].setAnimation(google.maps.Animation.BOUNCE);
      }     
    }
  }

  $scope.bounceStop = function () {
    for(var i = 0; i < $scope.myMarkers.length; i++) {
      // console.log(this.location[0]);
      if(this.location[0] === $scope.myMarkers[i].title){
        $scope.myMarkers[i].setAnimation(null);
      }
    }
  }



  // function that creates yelp markers on map ***********************

  $scope.getYelpLocations = function(){
    YelpFactory.getLocations().then(function (data) {
      var yelpData = data.data;
      console.log(yelpData);
      $scope.model.myMap = new google.maps.Map(document.getElementById('map'), $scope.mapOptions);
      $scope.getLocation();


      // make object for each restaurant ******************************

      yelpData.forEach(function (elem, i) {
       console.log(yelpData[i]);
        var latlng = new google.maps.LatLng(elem.lat, elem.lon);

        var placeObj = {
          position: latlng,
          latitude: elem.lat,
          longitude: elem.lon,
          address: yelpData[i].address,
          rating: elem.rating,
          reviews: yelpData[i].review_count,
          map: $scope.model.myMap,
          idKey: yelpData[i].id,
          title: yelpData[i].name,
          animation: google.maps.Animation.DROP
        };


        // create content for info windows ***************************

        var infoContent ='<span class="infoBold">' +yelpData[i].name + '</span><br>' + yelpData[i].address
                          +'<br><span class="infoUnderline">Rating</span>: ' + yelpData[i].rating
                          +'<br><span class="infoUnderline">Reviews</span>: ' + yelpData[i].review_count


        // create markers and info windows ***************************   

        var marker = new google.maps.Marker(placeObj);
        var infowindow = new google.maps.InfoWindow({
          content: infoContent
        });


        // Open and close info window on map ****************

        google.maps.event.addListener(marker, 'click', function(event) {
          infowindow.open($scope.model.myMap, marker);
          endLat = elem.lat;
          endLon = elem.lon;
          $scope.selectedLocation = "dope";
          console.log(endLat, endLon);
         

        });

        google.maps.event.addListener($scope.model.myMap, 'click', function(event) {
          infowindow.close();
        });


        // push markers to myMarker array, and locations and names to yelpLocations array

        var listContent = [placeObj.title, placeObj.rating, placeObj.address, placeObj.reviews];

        $scope.myMarkers.push(marker);
        $scope.yelpLocations.push(listContent);

      });

      $scope.markerClick = function () {
         for(var i = 0; i < $scope.myMarkers.length; i++) {
          console.log(this.location[0]);
          var infowindow = new google.maps.InfoWindow({
            content: '<span class="infoBold">' +yelpData[i].name + '</span><br>' + yelpData[i].address
                          +'<br><span class="infoUnderline">Rating</span>: ' + yelpData[i].rating
                          +'<br><span class="infoUnderline">Reviews</span>: ' + yelpData[i].review_count
          });
          if(this.location[0] === $scope.myMarkers[i].title){
            infowindow.open($scope.model.myMap, $scope.myMarkers[i]);
            $scope.myMarkers[i].setAnimation(null);
          }
        }
      }

    });
  };


  //UBER STUFF =============================================
    //invoked on page load to determine what to display based on whether the user is logged in or not
    $scope.cookie = '';
    (function() {
      $http.get('http://localhost:3000/login').then(function(result){
        console.log(result.data, 'works');
        $scope.cookie = !!result.data;
      });
    })();
    // *******************************************************

    // onClick function to oAuth into Uber*********************
    $scope.uberLogIn = function () {
      UberFactory.auth().then(function(data) {
        // console.log(data);
      });
    };

    // onClick funtion to display Uber Price estimates*********

    // toggle variable to toggle the prices to show or hide after initial request
    $scope.toggle = false;
    // function for initial price request
    $scope.getPrices = function() {
      $scope.toggle = $scope.toggle ? false : true;
      UberFactory.prices($scope.lat, $scope.lng, endLat, endLon).then(function(uberPrices){
        $scope.price = uberPrices.data.prices;
        $scope.distance = uberPrices.data.prices[0].distance;
        $scope.time = Math.ceil(uberPrices.data.prices[0].duration/60);
        $scope.productID = uberPrices.data.prices.product_id;
      });
    };
    // ******************************************************

    //
    $scope.requestRide = function(id) {
      $scope.product_id = id;
      UberFactory.callACar($scope.lat, $scope.lng, endLat, endLon, $scope.product_id).then(function(rideDetails){
        if(rideDetails.data.request_id) {
          $scope.toggle = false;
          $scope.incoming = 'The Batmobile is on the way to take you to your destination';
        }
      });
    };
}
